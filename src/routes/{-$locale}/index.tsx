import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import { headFor, localeFromParam } from "@/lib/seoHead";
import { copyFor } from "@/lib/seoCopy";
import { SITE_URL, localePath } from "@/lib/locale";

export const Route = createFileRoute("/{-$locale}/")({
  head: ({ params }) => {
    const locale = localeFromParam(params.locale);
    const copy = copyFor("home", locale);
    return headFor(params.locale, {
      path: "/",
      title: copy.title,
      description: copy.description,
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
  },
  component: Index,
});
