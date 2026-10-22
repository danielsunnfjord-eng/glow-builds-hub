import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import DualPathCards from "@/components/voyage/DualPathCards";
import FeaturedItineraries from "@/components/voyage/FeaturedItineraries";
import ClientPortal from "@/components/voyage/ClientPortal";
import WhyAdvisor from "@/components/voyage/WhyAdvisor";
import Reviews from "@/components/voyage/Reviews";
import { HOME_TESTIMONIAL_AUTHORS } from "@/components/voyage/home/homeCopy";
import { currentLocale, localePath } from "@/lib/locale";

const GROUP_LINK_COPY: Record<string, string> = {
  en: "Planning a trip for a school, team or company? See our group travel.",
  no: "Planlegger du en tur for skole, lag eller bedrift? Se våre gruppereiser.",
  pt: "Planejando uma viagem para escola, equipe ou empresa? Veja nossas viagens em grupo.",
};

/** Private bespoke travel: sections moved here from the former homepage. */
export default function PrivateTravel() {
  const locale = currentLocale();
  return (
    <div>
      <Navbar />
      <main>
        <div className="bg-parchment pt-36 px-6 md:px-16">
          <div className="max-w-[1200px] mx-auto">
            <a
              href={localePath("/", locale)}
              className="inline-block text-sm text-voyage-muted underline underline-offset-4 hover:text-ink"
            >
              {GROUP_LINK_COPY[locale] ?? GROUP_LINK_COPY.en}
            </a>
          </div>
        </div>
        <DualPathCards />
        <FeaturedItineraries />
        <ClientPortal />
        <WhyAdvisor />
        <Reviews exclude={HOME_TESTIMONIAL_AUTHORS} />
      </main>
      <Footer />
    </div>
  );
}
