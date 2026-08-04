// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://fjordwavestravel.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/plan-my-trip", changefreq: "monthly", priority: "0.9" },
  { path: "/routes", changefreq: "weekly", priority: "0.9" },
  { path: "/catalogue", changefreq: "weekly", priority: "0.9" },
  { path: "/destinations/norway", changefreq: "monthly", priority: "0.9" },
  { path: "/legal", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

async function fetchCatalogEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("catalog_itineraries")
      .select("slug, updated_at")
      .eq("is_published", true);
    if (error || !data) return [];
    return data.map((row: { slug: string; updated_at: string | null }) => ({
      path: `/catalogue/${row.slug}`,
      lastmod: row.updated_at ? row.updated_at.slice(0, 10) : undefined,
      changefreq: "monthly" as const,
      priority: "0.7",
    }));
  } catch {
    return [];
  }
}

const LOCALES = [
  { code: "en", hreflang: "en", prefix: "" },
  { code: "no", hreflang: "no", prefix: "/no" },
  { code: "pt", hreflang: "pt-BR", prefix: "/pt-br" },
] as const;

function localized(prefix: string, path: string) {
  if (!prefix) return path;
  return path === "/" ? `${prefix}/` : `${prefix}${path}`;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.flatMap((e) =>
    LOCALES.map((loc) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${localized(loc.prefix, e.path)}</loc>`,
      ...LOCALES.map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${BASE_URL}${localized(alt.prefix, e.path)}"/>`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${e.path}"/>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
    ),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const dynamic = await fetchCatalogEntries();
const entries = [...staticEntries, ...dynamic];
writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
