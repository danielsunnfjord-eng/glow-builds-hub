import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    let fileBytes: Uint8Array;
    let fileName = "upload";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      fileName = file.name;
      fileBytes = new Uint8Array(await file.arrayBuffer());
    } else {
      return new Response(
        JSON.stringify({ error: "Expected multipart/form-data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For PDF files, extract text using a simple approach
    // We decode the raw bytes and extract readable text segments
    let extractedText = "";

    if (fileName.toLowerCase().endsWith(".pdf")) {
      // Simple PDF text extraction - look for text between BT/ET operators
      // and extract stream content
      const rawStr = new TextDecoder("latin1").decode(fileBytes);
      
      // Extract text from PDF streams
      const textParts: string[] = [];
      
      // Method 1: Extract text between parentheses in BT...ET blocks
      const btEtRegex = /BT\s([\s\S]*?)ET/g;
      let match;
      while ((match = btEtRegex.exec(rawStr)) !== null) {
        const block = match[1];
        // Extract text in parentheses (Tj operator)
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(block)) !== null) {
          textParts.push(tjMatch[1]);
        }
        // TJ operator (array of strings)
        const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
        let tjArrMatch;
        while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
          const innerRegex = /\(([^)]*)\)/g;
          let innerMatch;
          while ((innerMatch = innerRegex.exec(tjArrMatch[1])) !== null) {
            textParts.push(innerMatch[1]);
          }
        }
      }

      extractedText = textParts.join(" ").replace(/\\n/g, "\n").replace(/\\r/g, "").trim();
      
      // If simple extraction didn't find much, try to get any readable text
      if (extractedText.length < 50) {
        // Fallback: extract any readable ASCII sequences
        const readable = rawStr.match(/[\x20-\x7E]{10,}/g) || [];
        const filtered = readable.filter(s => 
          !s.includes("/") && !s.includes("stream") && !s.includes("endobj") && 
          !s.includes("xref") && !s.match(/^\d+ \d+ obj/)
        );
        extractedText = filtered.join("\n").trim() || "Could not extract text from this PDF. Please try uploading a text-based format (.txt, .csv).";
      }
    } else {
      // For non-PDF files, just decode as text
      extractedText = new TextDecoder().decode(fileBytes);
    }

    return new Response(
      JSON.stringify({ text: extractedText.slice(0, 10000), fileName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-form-upload error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
