import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentLocale } from "@/lib/locale";
import { THEME_WISH_COPY } from "@/lib/themeWish";

export default function ThemeWishesPanel() {
  const locale = currentLocale();
  const c = THEME_WISH_COPY[locale];
  const title = { en: "Theme travel wishes", no: "Ønsker for temareiser", pt: "Desejos de viagens temáticas" }[locale];
  const empty = { en: "No wishes yet.", no: "Ingen ønsker ennå.", pt: "Nenhum desejo ainda." }[locale];
  const { data = [], isPending, isError } = useQuery({
    queryKey: ["theme_travel_wishes"],
    queryFn: async () => {
      const result = await supabase.from("theme_travel_wishes").select("id, created_at, name, email, wish, locale").order("created_at", { ascending: false });
      if (result.error) throw result.error;
      return result.data;
    },
  });
  return <section className="mt-10 border-t border-parchment-3 pt-8">
    <h2 className="mb-5 font-serif text-3xl font-bold text-ink">{title}</h2>
    {isPending ? <p role="status" className="text-voyage-muted">…</p> : isError ? <p role="alert" className="text-destructive">{c.error}</p> : data.length === 0 ? <p className="text-voyage-muted">{empty}</p> :
      <div className="space-y-4">{data.map(row => <article key={row.id} className="rounded-lg border border-parchment-3 bg-voyage-white p-5">
        <div className="flex flex-wrap justify-between gap-2"><h3 className="font-serif text-xl font-bold text-ink">{row.name}</h3><time className="text-sm text-voyage-muted" dateTime={row.created_at}>{new Date(row.created_at).toLocaleString()}</time></div>
        <p className="mt-1 break-all text-sm text-voyage-muted">{row.email} · {row.locale}</p>
        <p className="mt-4 whitespace-pre-wrap break-words text-ink-2">{row.wish}</p>
      </article>)}</div>}
  </section>;
}