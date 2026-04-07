import { useTranslation } from "react-i18next";

const flags: Record<string, string> = { en: "🇬🇧", pt: "🇧🇷", no: "🇳🇴" };

interface LanguageSelectorProps {
  variant?: "light" | "dark";
}

const LanguageSelector = ({ variant = "light" }: LanguageSelectorProps) => {
  const { i18n, t } = useTranslation();
  const langs = ["en", "pt", "no"] as const;

  return (
    <div className="flex items-center gap-1">
      {langs.map((lng) => (
        <button
          key={lng}
          onClick={() => i18n.changeLanguage(lng)}
          title={t(`lang.${lng}`)}
          className={`px-1.5 py-0.5 rounded text-sm transition-all ${
            i18n.language === lng
              ? variant === "dark"
                ? "bg-voyage-white/20 text-voyage-white"
                : "bg-ink/10 text-ink"
              : variant === "dark"
                ? "text-voyage-white/40 hover:text-voyage-white/70"
                : "text-voyage-muted hover:text-ink"
          }`}
        >
          {flags[lng]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
