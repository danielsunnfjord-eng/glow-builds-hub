import { createFileRoute } from "@tanstack/react-router";
import PricingPage from "@/pages/PricingPage";
import { headFor, localeFromParam } from "@/lib/seoHead";
import { copyFor } from "@/lib/seoCopy";
import en from "@/i18n/locales/en";
import no from "@/i18n/locales/no";
import pt from "@/i18n/locales/pt";
import type { Locale } from "@/lib/locale";

const BUNDLES: Record<Locale, typeof en> = { en, no: no as typeof en, pt: pt as typeof en };

/** FAQPage structured data built from the localized pricing FAQ copy. */
function faqJsonLd(locale: Locale) {
  const faq = BUNDLES[locale].pricingPage.faq as Record<string, { q: string; a: string }>;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: Object.values(faq).map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export const Route = createFileRoute("/{-$locale}/pricing")({
  head: ({ params }) => {
    const locale = localeFromParam(params.locale);
    const copy = copyFor("pricing", locale);
    return headFor(params.locale, {
      path: "/pricing",
      title: copy.title,
      description: copy.description,
      jsonLd: faqJsonLd(locale),
    });
  },
  component: PricingPage,
});
