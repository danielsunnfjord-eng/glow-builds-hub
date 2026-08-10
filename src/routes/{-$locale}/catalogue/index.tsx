import { createFileRoute } from "@tanstack/react-router";
import ItinerariesShop from "@/pages/ItinerariesShop";
import { headFor, localeFromParam } from "@/lib/seoHead";
import { copyFor } from "@/lib/seoCopy";
import { SITE_URL, localePath } from "@/lib/locale";

export const Route = createFileRoute("/{-$locale}/catalogue/")({
  head: ({ params }) => {
    const locale = localeFromParam(params.locale);
    const copy = copyFor("catalogue", locale);
    return headFor(params.locale, {
      path: "/catalogue",
      title: copy.title,
      description: copy.description,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${SITE_URL}${localePath("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.title,
            item: `${SITE_URL}${localePath("/catalogue", locale)}`,
          },
        ],
      },
    });
  },
  component: ItinerariesShop,
});
