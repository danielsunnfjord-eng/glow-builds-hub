import { useTranslation } from "react-i18next";
import ScrollReveal from "./ScrollReveal";

const Reviews = () => {
  const { t } = useTranslation();
  const reviews = t("reviews.items", { returnObjects: true }) as Array<{
    text: string;
    author: string;
    dest: string;
  }>;

  return (
    <section id="reviews" className="py-28 px-16 bg-parchment-2 max-md:px-6 max-md:py-16">
      <ScrollReveal>
        <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
          {t("reviews.eyebrow")}
        </div>
      </ScrollReveal>
      <ScrollReveal>
        <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4">
          {t("reviews.title1")}
          <br />
          <em className="italic font-normal">{t("reviews.title2")}</em>
        </h2>
      </ScrollReveal>
      <ScrollReveal>
        <div className="grid grid-cols-3 max-md:grid-cols-1 gap-6 mt-16 max-w-6xl">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="p-8 bg-voyage-white rounded-lg border border-parchment-3 flex flex-col"
            >
              <div className="text-gold text-[0.8rem] tracking-wider mb-4">★★★★★</div>
              <p className="text-[0.85rem] text-ink-2 leading-relaxed italic mb-5 whitespace-pre-line flex-1">
                "{r.text}"
              </p>
              <div className="text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-voyage-muted">
                {r.author}
              </div>
              <div className="text-[0.7rem] text-gold mt-1">{r.dest}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};

export default Reviews;
