import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import { headFor, localeFromParam } from "@/lib/seoHead";
import { copyFor } from "@/lib/seoCopy";
import { SITE_URL, localePath } from "@/lib/locale";
import sup from "@/assets/home/sunrise_sup_copacabana.jpg.asset.json";

export const Route = createFileRoute("/{-$locale}/")({
  head: ({ params }) => {
    const locale = localeFromParam(params.locale);
    const copy = copyFor("home", locale);
    const head = headFor(params.locale, {
      path: "/",
      title: copy.title,
      description: copy.description,
      image: sup.url,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        name: "Fjord & Waves Travel",
        url: `${SITE_URL}${localePath("/", locale)}`,
        image: `${SITE_URL}/og-image.png`,
        description: copy.description,
        founder: { "@type": "Person", name: "Daniel Lira Figueiredo" },
        areaServed: ["Norway", "Scandinavia", "Brazil", "Europe"],
      },
    });
    return { ...head, meta: head.meta.map((meta) => meta.name === "description" || meta.name === "twitter:description" || meta.property === "og:description" ? { ...meta, content: copy.description } : meta) };
  },
  component: Index,
});
