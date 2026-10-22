// Group and school references. Hidden until real group testimonials exist.
// To switch on: set GROUP_REFERENCES_ENABLED = true, fill GROUP_REFERENCES, and render <GroupReferences /> on group pages.
import ScrollReveal from "./ScrollReveal";

export const GROUP_REFERENCES_ENABLED = false;

type GroupReference = { text: string; author: string; group: string };
// PLACEHOLDER: add real, approved group/school testimonials here.
export const GROUP_REFERENCES: GroupReference[] = [];

export default function GroupReferences({ label }: { label: string }) {
  if (!GROUP_REFERENCES_ENABLED || GROUP_REFERENCES.length === 0) return null;
  return (
    <section className="bg-parchment-2 px-16 py-28 max-md:px-6 max-md:py-16">
      <ScrollReveal>
        <div className="mb-10 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold">{label}</div>
      </ScrollReveal>
      <div className="grid max-w-6xl grid-cols-2 gap-6 max-md:grid-cols-1">
        {GROUP_REFERENCES.map((r) => (
          <div key={r.author} className="rounded-lg border border-parchment-3 bg-voyage-white p-8">
            <p className="mb-5 whitespace-pre-line text-[0.85rem] italic leading-relaxed text-ink-2">"{r.text}"</p>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-voyage-muted">{r.author}</div>
            <div className="mt-1 text-[0.7rem] text-gold">{r.group}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
