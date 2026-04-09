import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TripRequestForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    phone: "",
    destination: "",
    departure: "",
    group_size: 1,
    trip_duration: "",
    start_date: "",
    end_date: "",
    estimated_budget: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const lang = i18n.language?.substring(0, 2) || "en";
      const { error } = await supabase.from("trip_requests" as any).insert({
        client_name: form.client_name,
        client_email: form.client_email,
        phone: form.phone || null,
        destination: form.destination || null,
        departure: form.departure || null,
        group_size: form.group_size,
        trip_duration: form.trip_duration || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        estimated_budget: form.estimated_budget || null,
        notes: form.notes || null,
        language: lang,
      } as any);
      if (error) throw error;

      // Send notification email
      try {
        await supabase.functions.invoke("notify-trip-request", {
          body: {
            clientName: form.client_name,
            clientEmail: form.client_email,
            destination: form.destination,
            departure: form.departure,
            groupSize: form.group_size,
            tripDuration: form.trip_duration,
            startDate: form.start_date,
            endDate: form.end_date,
            budget: form.estimated_budget,
            notes: form.notes,
          },
        });
      } catch {
        // notification failure shouldn't block submission
      }

      setSubmitted(true);
      onSuccess?.();
      toast({ title: t("tripForm.successTitle"), description: t("tripForm.successDesc") });
    } catch (err: any) {
      toast({ title: t("tripForm.errorTitle"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✈️</div>
        <h3 className="font-serif text-xl font-bold text-foreground mb-2">{t("tripForm.thankYouTitle")}</h3>
        <p className="text-muted-foreground text-sm">{t("tripForm.thankYouDesc")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.name")} *</label>
          <input required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.email")} *</label>
          <input type="email" required value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.phone")}</label>
        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("tripForm.phonePlaceholder")} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.departure")}</label>
          <input value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} placeholder={t("tripForm.departurePlaceholder")} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.destination")}</label>
          <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder={t("tripForm.destinationPlaceholder")} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.groupSize")}</label>
          <input type="number" min={1} value={form.group_size} onChange={(e) => setForm({ ...form, group_size: Math.max(1, Number(e.target.value)) })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.startDate")}</label>
          <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.endDate")}</label>
          <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.duration")}</label>
          <input value={form.trip_duration} onChange={(e) => setForm({ ...form, trip_duration: e.target.value })} placeholder={t("tripForm.durationPlaceholder")} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.budget")}</label>
          <input value={form.estimated_budget} onChange={(e) => setForm({ ...form, estimated_budget: e.target.value })} placeholder={t("tripForm.budgetPlaceholder")} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("tripForm.notes")}</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} placeholder={t("tripForm.notesPlaceholder")} className={inputClass} />
      </div>

      <button type="submit" disabled={submitting} className="mt-2 px-6 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-60">
        {submitting ? t("tripForm.submitting") : t("tripForm.submit")}
      </button>
    </form>
  );
};

export default TripRequestForm;
