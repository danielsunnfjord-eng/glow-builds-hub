import { createFileRoute } from "@tanstack/react-router";
import Legal from "@/pages/Legal";
import { SITE_URL } from "@/lib/locale";

const TITLE = "Terms of Service — Fjord & Waves Travel";
const DESCRIPTION =
  "The terms that govern Fjord & Waves Travel's advisory services: fees, payments, itinerary purchases, cancellations, liability and applicable Norwegian law.";

export const Route = createFileRoute("/{-$locale}/terms")({
  head: ({ params }) => {
    const url = `${SITE_URL}${params.locale ? `/${params.locale}` : ""}/terms`;
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: TITLE },
        { name: "twitter:description", content: DESCRIPTION },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: Legal,
});
