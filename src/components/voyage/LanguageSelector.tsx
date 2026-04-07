import { useTranslation } from "react-i18next";

const flagUrls: Record<string, string> = {
  en: "https://flagcdn.com/w80/gb.png",
  pt: "https://flagcdn.com/w80/br.png",
  no: "https://flagcdn.com/w80/no.png",
};

interface LanguageSelectorProps {
  variant?: "light" | "dark";
}

const LanguageSelector = ({ variant = "light" }: LanguageSelectorProps) => {
  const { i18n, t } = useTranslation();
  const langs = ["en", "pt", "no"] as const;

  return (
    <div className="flex items-center gap-1.5">
      {langs.map((lng) => (
        <button
          key={lng}
          onClick={() => i18n.changeLanguage(lng)}
          title={t(`lang.${lng}`)}
          className={`p-1 rounded transition-all ${
            i18n.language === lng
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
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
