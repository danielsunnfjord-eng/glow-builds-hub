import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function genImage(prompt: string, apiKey: string): Promise<Uint8Array> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Image gen failed [${r.status}]: ${t.slice(0, 200)}`);
  }
  const data = await r.json();
  const url: string | undefined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("No image returned");
  const b64 = url.split(",")[1] ?? url;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SERVICE_ROLE) throw new Error("Missing env");

    const { hero_prompt, gallery_prompts = [] } = await req.json();
    if (!hero_prompt && (!gallery_prompts || !gallery_prompts.length)) {
      return new Response(JSON.stringify({ error: "Provide hero_prompt or gallery_prompts" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const stylePrefix =
      "Cinematic editorial travel photography, natural light, photo-realistic, high detail, no text, no watermark, no people facing camera. Subject: ";

    const upload = async (bytes: Uint8Array): Promise<string> => {
      const path = `ai/${crypto.randomUUID()}.png`;
      const { error } = await supabase.storage.from("catalog-images").upload(path, bytes, {
        contentType: "image/png",
      });
      if (error) throw error;
      return supabase.storage.from("catalog-images").getPublicUrl(path).data.publicUrl;
    };

    let hero_image_url: string | null = null;
    if (hero_prompt) {
      const bytes = await genImage(stylePrefix + hero_prompt + ". Wide cinematic 16:9 framing.", LOVABLE_API_KEY);
      hero_image_url = await upload(bytes);
    }

    const gallery_image_urls: string[] = [];
    for (const p of (gallery_prompts as string[]).slice(0, 6)) {
      try {
        const bytes = await genImage(stylePrefix + p, LOVABLE_API_KEY);
        gallery_image_urls.push(await upload(bytes));
      } catch (e) {
        console.error("gallery image failed:", e);
      }
    }

    return new Response(JSON.stringify({ hero_image_url, gallery_image_urls }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-catalog-images error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
