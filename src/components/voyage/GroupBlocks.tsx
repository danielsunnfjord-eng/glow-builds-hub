import { GROUP_INTAKE_URL } from "@/lib/travelNavigation";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const btnGold = "inline-flex items-center justify-center rounded-sm bg-gold px-7 py-3.5 text-center text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink transition hover:bg-gold-2";

/** Group pages: every proposal button opens the Groups & Corporate Fora intake in a new tab. */
export function ProposalCta({ label }: { label: string }) {
  return <a href={GROUP_INTAKE_URL} {...ext} className={btnGold}>{label}</a>;
}

/** Two-column table that stays readable on phones (text wraps, no horizontal scroll). */
export function TwoColTable({ head, rows }: { head: [string, string]; rows: [string, React.ReactNode][] }) {
  return (
    <table className="w-full table-fixed text-left text-[0.95rem]">
      <thead>
        <tr className="border-b-2 border-gold text-[0.7rem] uppercase tracking-[0.14em] text-voyage-muted">
          <th scope="col" className="w-[38%] py-3 pr-4 font-semibold sm:w-[30%]">{head[0]}</th>
          <th scope="col" className="py-3 font-semibold">{head[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b], n) => (
          <tr key={n} className="border-b border-parchment-3 align-top">
            <th scope="row" className="py-3 pr-4 font-serif text-lg font-semibold leading-snug text-gold [overflow-wrap:anywhere]">{a}</th>
            <td className="py-3 leading-relaxed text-ink-2">{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function NumberedSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {steps.map((s, n) => (
        <li key={n} className="border-t-2 border-gold pt-4">
          <div className="font-serif text-3xl text-gold">{n + 1}</div>
          <p className="mt-2 leading-relaxed text-ink-2">{s}</p>
        </li>
      ))}
    </ol>
  );
}
