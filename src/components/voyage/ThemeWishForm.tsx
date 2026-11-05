import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { THEME_WISH_COPY, themeWishSchema } from "@/lib/themeWish";
import { currentLocale, localePath } from "@/lib/locale";

export default function ThemeWishForm({ label }: { label: string }) {
  const locale = currentLocale();
  const c = THEME_WISH_COPY[locale];
  const [state, setState] = useState<"idle" | "sending" | "done" | "error" | "invalid">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const fields = new FormData(event.currentTarget);
    const parsed = themeWishSchema.safeParse({ name: fields.get("name"), email: fields.get("email"), wish: fields.get("wish"), consent: fields.get("consent") === "on", locale });
    if (!parsed.success) { setState("invalid"); return; }
    setState("sending");
    try {
      const response = await fetch("/api/public/theme-wish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      setState(response.ok ? "done" : "error");
    } catch { setState("error"); }
  }
  const inputClass = "w-full rounded-sm border border-parchment-3 bg-voyage-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none";
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="link" className="h-auto justify-start whitespace-normal p-0 text-left font-semibold text-gold">{label}</Button></DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg bg-parchment p-6 sm:p-8">
        <DialogTitle className="pr-5 font-serif text-3xl leading-tight text-ink tracking-normal">{c.title}</DialogTitle>
        {state === "done" ? <p role="status" className="leading-relaxed text-ink-2">{c.done}</p> : (
          <form onSubmit={submit} className="space-y-4">
            <div><label htmlFor="wish-name" className="mb-1 block text-sm font-semibold text-ink-2">{c.name}</label><input id="wish-name" name="name" required maxLength={120} autoComplete="name" className={inputClass} /></div>
            <div><label htmlFor="wish-email" className="mb-1 block text-sm font-semibold text-ink-2">{c.email}</label><input id="wish-email" name="email" type="email" required maxLength={200} autoComplete="email" className={inputClass} /></div>
            <div><label htmlFor="wish-message" className="mb-1 block text-sm font-semibold text-ink-2">{c.wish}</label><textarea id="wish-message" name="wish" required maxLength={2000} rows={4} className={inputClass} /></div>
            <div className="flex items-start gap-3"><input id="wish-consent" name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-gold" /><div className="text-sm leading-relaxed text-ink-2"><label htmlFor="wish-consent">{c.consent}</label>{" "}<a href={localePath("/privacy", locale)} target="_blank" rel="noopener noreferrer" className="underline">{c.privacy}</a></div></div>
            {(state === "invalid" || state === "error") && <p role="alert" className="text-sm text-destructive">{state === "invalid" ? c.invalid : c.error}</p>}
            <Button type="submit" disabled={state === "sending"} className="w-full bg-gold text-ink hover:bg-gold-2"><Send size={16} aria-hidden />{state === "sending" ? c.sending : c.send}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}