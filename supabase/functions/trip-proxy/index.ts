import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const allowedTripHosts = new Set(["trips.foratravel.com"]);

const responseHeaders = (contentType: string) => new Headers({
  ...corsHeaders,
  "content-type": contentType,
  "cache-control": "no-store",
});

const isAllowedTripUrl = (url: URL) =>
  url.protocol === "https:" && allowedTripHosts.has(url.hostname) && url.pathname.startsWith("/i/");

const injectPreviewHelpers = (html: string, targetUrl: URL) => {
  const helpers = `
    <base href="${targetUrl.origin}/">
    <style>html,body,#__next{min-height:100%;}</style>
    <script>
      (function(){
        function guardHistory(method) {
          var original = history[method];
          history[method] = function(state, title, url) {
            try { return original.apply(this, arguments); }
            catch (error) {
              if (error && error.name === 'SecurityError') return original.call(this, state, title);
              throw error;
            }
          };
        }
        guardHistory('pushState');
        guardHistory('replaceState');
      })();
      window.open = function(url){ if (url) window.location.href = url; return null; };
      document.addEventListener('click', function(event) {
        var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
        if (!link) return;
        var href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        link.removeAttribute('target');
      }, true);
    </script>
  `;

  if (html.includes("<head>")) return html.replace("<head>", `<head>${helpers}`);
  return `${helpers}${html}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const requestUrl = new URL(req.url);
    const rawUrl = requestUrl.searchParams.get("url");
    if (!rawUrl) {
      return new Response("Missing trip URL", { status: 400, headers: corsHeaders });
    }

    const targetUrl = new URL(rawUrl);
    if (!isAllowedTripUrl(targetUrl)) {
      return new Response("Unsupported trip URL", { status: 400, headers: corsHeaders });
    }

    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; FjordWavesTripPreview/1.0)",
      },
    });

    const contentType = upstream.headers.get("content-type") || "text/html; charset=utf-8";
    if (!contentType.includes("text/html")) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: responseHeaders(contentType),
      });
    }

    const html = await upstream.text();
    const proxiedHtml = injectPreviewHelpers(html, targetUrl);

    return new Response(proxiedHtml, {
      status: upstream.status,
      headers: responseHeaders("text/html; charset=utf-8"),
    });
  } catch (error) {
    console.error("Trip proxy error", error);
    return new Response("Unable to load this trip preview", { status: 500, headers: corsHeaders });
  }
});