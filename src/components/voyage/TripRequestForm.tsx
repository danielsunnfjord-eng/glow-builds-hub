import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const INTEREST_OPTIONS = [
  { key: "adventure", emoji: "🏔️" },
  { key: "culture", emoji: "🏛️" },
  { key: "gastronomy", emoji: "🍷" },
  { key: "relaxation", emoji: "🧘" },
  { key: "nature", emoji: "🌿" },
  { key: "nightlife", emoji: "🌃" },
];

const ACCOMMODATION_OPTIONS = ["boutiqueHotel", "resort", "airbnb", "cabin", "other"] as const;
const PACE_OPTIONS = ["intense", "relaxed", "mixed"] as const;

// Common country dial codes (sorted by likely audience)
const COUNTRY_CODES: { code: string; label: string; flag: string }[] = [
  { code: "+47", label: "Norway", flag: "🇳🇴" },
  { code: "+46", label: "Sweden", flag: "🇸🇪" },
  { code: "+45", label: "Denmark", flag: "🇩🇰" },
  { code: "+358", label: "Finland", flag: "🇫🇮" },
  { code: "+354", label: "Iceland", flag: "🇮🇸" },
  { code: "+44", label: "United Kingdom", flag: "🇬🇧" },
  { code: "+1", label: "USA / Canada", flag: "🇺🇸" },
  { code: "+33", label: "France", flag: "🇫🇷" },
  { code: "+49", label: "Germany", flag: "🇩🇪" },
  { code: "+34", label: "Spain", flag: "🇪🇸" },
  { code: "+39", label: "Italy", flag: "🇮🇹" },
  { code: "+351", label: "Portugal", flag: "🇵🇹" },
  { code: "+31", label: "Netherlands", flag: "🇳🇱" },
  { code: "+32", label: "Belgium", flag: "🇧🇪" },
  { code: "+41", label: "Switzerland", flag: "🇨🇭" },
  { code: "+43", label: "Austria", flag: "🇦🇹" },
  { code: "+353", label: "Ireland", flag: "🇮🇪" },
  { code: "+55", label: "Brazil", flag: "🇧🇷" },
  { code: "+52", label: "Mexico", flag: "🇲🇽" },
  { code: "+54", label: "Argentina", flag: "🇦🇷" },
  { code: "+61", label: "Australia", flag: "🇦🇺" },
  { code: "+64", label: "New Zealand", flag: "🇳🇿" },
  { code: "+81", label: "Japan", flag: "🇯🇵" },
  { code: "+86", label: "China", flag: "🇨🇳" },
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+971", label: "UAE", flag: "🇦🇪" },
  { code: "+27", label: "South Africa", flag: "🇿🇦" },
];

function calcDuration(start: string, end: string): string {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "";
  const nights = diff;
  const days = diff + 1;
  return `${days}d / ${nights}n`;
}

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
    adults: 1,
    children_count: 0,
    children_ages: [] as number[],
    trip_duration: "",
    start_date: "",
    end_date: "",
    estimated_budget: "",
    notes: "",
    interests: [] as string[],
    mobility_notes: "",
    accommodation_type: "",
    dietary_restrictions: "",
    must_have_experiences: "",
    travel_pace: "",
    visited_before: false,
  });

  // Default country code based on language
  const defaultDial = i18n.language?.startsWith("pt") ? "+55" : "+47";
  const [phoneCountry, setPhoneCountry] = useState<string>(defaultDial);
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Keep combined phone in sync
  useEffect(() => {
    const digits = phoneNumber.replace(/[^\d\s\-]/g, "").trim();
    setForm((f) => ({ ...f, phone: digits ? `${phoneCountry} ${digits}` : "" }));
  }, [phoneCountry, phoneNumber]);

  // Auto-calculate duration
  useEffect(() => {
    const dur = calcDuration(form.start_date, form.end_date);
    if (dur && dur !== form.trip_duration) {
      setForm((f) => ({ ...f, trip_duration: dur }));
    }
  }, [form.start_date, form.end_date]);

  // Sync children_ages array length
  useEffect(() => {
    setForm((f) => {
      const ages = [...f.children_ages];
      while (ages.length < f.children_count) ages.push(0);
      if (ages.length > f.children_count) ages.length = f.children_count;
      return { ...f, children_ages: ages };
    });
  }, [form.children_count]);

  const toggleInterest = (key: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(key)
        ? f.interests.filter((i) => i !== key)
        : [...f.interests, key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const lang = i18n.language?.substring(0, 2) || "en";
      const groupSize = form.adults + form.children_count;
      const { error } = await supabase.from("trip_requests" as any).insert({
        client_name: form.client_name,
        client_email: form.client_email,
        phone: form.phone || null,
        destination: form.destination || null,
        departure: form.departure || null,
        group_size: groupSize,
        adults: form.adults,
        children_count: form.children_count,
        children_ages: form.children_count > 0 ? form.children_ages : null,
        trip_duration: form.trip_duration || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        estimated_budget: form.estimated_budget || null,
        notes: form.notes || null,
        language: lang,
        interests: form.interests.length > 0 ? form.interests : null,
        mobility_notes: form.mobility_notes || null,
        accommodation_type: form.accommodation_type || null,
        dietary_restrictions: form.dietary_restrictions || null,
        must_have_experiences: form.must_have_experiences || null,
        travel_pace: form.travel_pace || null,
        visited_before: form.visited_before,
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
            groupSize: groupSize,
            adults: form.adults,
            childrenCount: form.children_count,
            childrenAges: form.children_ages,
            tripDuration: form.trip_duration,
            startDate: form.start_date,
            endDate: form.end_date,
            budget: form.estimated_budget,
            notes: form.notes,
            interests: form.interests,
            mobilityNotes: form.mobility_notes,
            accommodationType: form.accommodation_type,
            dietaryRestrictions: form.dietary_restrictions,
            mustHaveExperiences: form.must_have_experiences,
            travelPace: form.travel_pace,
            visitedBefore: form.visited_before,
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
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block";
  const hintClass = "text-xs text-muted-foreground mt-1";

  // Accept letters (incl. Nordic/accented), spaces, hyphens, apostrophes
  const NAME_REGEX = "[\\p{L} '\\-]{2,}";
  // Require international format: + followed by 7-15 digits (spaces/dashes allowed)
  const PHONE_REGEX = "\\+[0-9][0-9\\s\\-]{6,}";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-24 sm:pb-4">
      {/* Name & Email */}
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div>
          <label className={labelClass}>{t("tripForm.name")} *</label>
          <input
            required
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            pattern={NAME_REGEX}
            title={t("tripForm.nameHint")}
            autoComplete="name"
            className={inputClass}
          />
          <p className={hintClass}>{t("tripForm.nameHint")}</p>
        </div>
        <div>
          <label className={labelClass}>{t("tripForm.email")} *</label>
          <input type="email" required value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} autoComplete="email" className={inputClass} />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className={labelClass}>{t("tripForm.phone")}</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && !v.startsWith("+") && /^\d/.test(v)) {
              setForm((f) => ({ ...f, phone: `+47 ${v}` }));
            }
          }}
          placeholder={t("tripForm.phonePlaceholder")}
          pattern={PHONE_REGEX}
          title={t("tripForm.phoneHint")}
          inputMode="tel"
          autoComplete="tel"
          className={inputClass}
        />
        <p className={hintClass}>{t("tripForm.phoneHint")}</p>
      </div>

      {/* Departure & Destination */}
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div>
          <label className={labelClass}>{t("tripForm.departure")}</label>
          <input value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} placeholder={t("tripForm.departurePlaceholder")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t("tripForm.destination")}</label>
          <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder={t("tripForm.destinationPlaceholder")} className={inputClass} />
        </div>
      </div>

      {/* Adults & Children */}
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div>
          <label className={labelClass}>{t("tripForm.adults")}</label>
          <input type="number" min={1} value={form.adults} onChange={(e) => setForm({ ...form, adults: Math.max(1, Number(e.target.value)) })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t("tripForm.childrenLabel")}</label>
          <input type="number" min={0} value={form.children_count} onChange={(e) => setForm({ ...form, children_count: Math.max(0, Number(e.target.value)) })} className={inputClass} />
        </div>
      </div>

      {/* Children ages */}
      {form.children_count > 0 && (
        <div>
          <label className={labelClass}>{t("tripForm.childrenAges")}</label>
          <div className="flex flex-wrap gap-2">
            {form.children_ages.map((age, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={17}
                  value={age}
                  onChange={(e) => {
                    const ages = [...form.children_ages];
                    ages[idx] = Math.min(17, Math.max(0, Number(e.target.value)));
                    setForm({ ...form, children_ages: ages });
                  }}
                  className="w-16 px-2 py-2 rounded-lg bg-background border border-border text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <span className="text-xs text-muted-foreground">{t("tripForm.years")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start, End, Duration */}
      <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
        <div>
          <label className={labelClass}>{t("tripForm.startDate")}</label>
          <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t("tripForm.endDate")}</label>
          <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t("tripForm.duration")}</label>
          <input value={form.trip_duration} readOnly placeholder={t("tripForm.durationAutoPlaceholder")} className={`${inputClass} bg-muted cursor-default`} />
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className={labelClass}>{t("tripForm.budget")}</label>
        <input value={form.estimated_budget} onChange={(e) => setForm({ ...form, estimated_budget: e.target.value })} placeholder={t("tripForm.budgetPlaceholder")} className={inputClass} />
      </div>

      {/* Visited before */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="visited_before"
          checked={form.visited_before}
          onChange={(e) => setForm({ ...form, visited_before: e.target.checked })}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
        />
        <label htmlFor="visited_before" className="text-sm text-foreground cursor-pointer">
          {t("tripForm.visitedBefore")}
        </label>
      </div>

      {/* Interests */}
      <div>
        <label className={labelClass}>{t("tripForm.interests")}</label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => toggleInterest(opt.key)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                form.interests.includes(opt.key)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-foreground hover:border-primary/40"
              }`}
            >
              {opt.emoji} {t(`tripForm.interest_${opt.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Accommodation & Pace */}
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div>
          <label className={labelClass}>{t("tripForm.accommodationType")}</label>
          <select value={form.accommodation_type} onChange={(e) => setForm({ ...form, accommodation_type: e.target.value })} className={inputClass}>
            <option value="">{t("tripForm.selectOption")}</option>
            {ACCOMMODATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{t(`tripForm.accommodation_${opt}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t("tripForm.travelPace")}</label>
          <select value={form.travel_pace} onChange={(e) => setForm({ ...form, travel_pace: e.target.value })} className={inputClass}>
            <option value="">{t("tripForm.selectOption")}</option>
            {PACE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{t(`tripForm.pace_${opt}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobility */}
      <div>
        <label className={labelClass}>{t("tripForm.mobilityNotes")}</label>
        <input value={form.mobility_notes} onChange={(e) => setForm({ ...form, mobility_notes: e.target.value })} placeholder={t("tripForm.mobilityPlaceholder")} className={inputClass} />
      </div>

      {/* Dietary */}
      <div>
        <label className={labelClass}>{t("tripForm.dietaryRestrictions")}</label>
        <input value={form.dietary_restrictions} onChange={(e) => setForm({ ...form, dietary_restrictions: e.target.value })} placeholder={t("tripForm.dietaryPlaceholder")} className={inputClass} />
      </div>

      {/* Must-have experiences */}
      <div>
        <label className={labelClass}>{t("tripForm.mustHaveExperiences")}</label>
        <textarea value={form.must_have_experiences} onChange={(e) => setForm({ ...form, must_have_experiences: e.target.value })} rows={2} placeholder={t("tripForm.mustHavePlaceholder")} className={inputClass} />
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>{t("tripForm.notes")}</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder={t("tripForm.notesPlaceholder")} className={inputClass} />
      </div>

      <button type="submit" disabled={submitting} className="mt-2 px-6 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-60">
        {submitting ? t("tripForm.submitting") : t("tripForm.submit")}
      </button>
    </form>
  );
};

export default TripRequestForm;
