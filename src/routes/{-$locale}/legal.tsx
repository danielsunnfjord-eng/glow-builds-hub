import { createFileRoute } from "@tanstack/react-router";
import Legal from "@/pages/Legal";
import { SITE_URL } from "@/lib/locale";

const TITLE = "Privacy Policy & Terms — Fjord & Waves Travel";
const DESCRIPTION =
  "How Fjord & Waves Travel handles your data under GDPR, plus the terms of service that govern our concierge travel advisory and itinerary purchases.";

export const Route = createFileRoute("/{-$locale}/legal")({
  head: ({ params }) => {
    const url = `${SITE_URL}${params.locale ? `/${params.locale}` : ""}/legal`;
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
