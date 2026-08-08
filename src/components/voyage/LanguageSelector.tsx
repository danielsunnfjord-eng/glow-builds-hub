import { useTranslation } from "react-i18next";
import { useLocation } from "@/lib/router-compat";
import { LOCALE_PREFIX, currentLocale, localePath, type Locale } from "@/lib/locale";

const flagUrls: Record<string, string> = {
  en: "https://flagcdn.com/w80/gb.png",
  pt: "https://flagcdn.com/w80/br.png",
  no: "https://flagcdn.com/w80/no.png",
};

interface LanguageSelectorProps {
  variant?: "light" | "dark";
}

const LanguageSelector = ({ variant = "light" }: LanguageSelectorProps) => {
  const { t } = useTranslation();
  const { pathname, search, hash } = useLocation();
  const active = currentLocale();
  const langs: Locale[] = ["en", "pt", "no"];

  // pathname here is already basename-stripped by the router, so it is the
  // language-neutral path; rebuild it under the target language prefix.
  const hrefFor = (lng: Locale) => `${localePath(pathname, lng)}${search}${hash}`;

  return (
    <div className="flex items-center gap-1.5">
      {langs.map((lng) => (
        <a
          key={lng}
          href={hrefFor(lng)}
          hrefLang={LOCALE_PREFIX[lng] ? lng : "en"}
          title={t(`lang.${lng}`)}
          className={`p-1 rounded-sm transition-all inline-flex ${
            active === lng
              ? variant === "dark"
                ? "bg-voyage-white/20 ring-1 ring-voyage-white/30"
                : "bg-ink/10 ring-1 ring-ink/20"
              : "opacity-50 hover:opacity-80"
          }`}
        >
          <img
            src={flagUrls[lng]}
            alt={t(`lang.${lng}`)}
            width={24}
            height={16}
            loading="lazy"
            className="w-6 h-4 rounded-[2px] object-cover"
          />
        </a>
      ))}
    </div>
  );
};

export default LanguageSelector;
