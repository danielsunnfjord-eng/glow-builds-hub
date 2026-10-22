import Navbar from "./Navbar";
import Footer from "./Footer";
import { currentLocale } from "@/lib/locale";
import { navigationCopy, type TravelPageKey } from "@/lib/travelNavigation";

export default function TravelPlaceholderPage({ page }: { page: TravelPageKey }) {
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 pb-24 pt-60 md:px-16">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="font-serif text-4xl font-bold text-ink">{navigationCopy[currentLocale()][page]}</h1>
          {/* CONTENT PLACEHOLDER: Await user-supplied page text and uploaded photos. */}
        </div>
      </main>
      <Footer />
    </div>
  );
}