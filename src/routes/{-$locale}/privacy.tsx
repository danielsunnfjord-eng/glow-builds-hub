import { createFileRoute } from "@tanstack/react-router";
import Legal from "@/pages/Legal";
import { SITE_URL } from "@/lib/locale";

const TITLE = "Privacy Policy — Fjord & Waves Travel";
const DESCRIPTION =
  "What personal data Fjord & Waves Travel collects when you enquire, subscribe or book, why we process it, how long we keep it, and your GDPR rights.";

export const Route = createFileRoute("/{-$locale}/privacy")({
  head: ({ params }) => {
    const url = `${SITE_URL}${params.locale ? `/${params.locale}` : ""}/privacy`;
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
