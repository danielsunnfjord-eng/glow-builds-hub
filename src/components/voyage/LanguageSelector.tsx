import { useTranslation } from "react-i18next";
import flagGb from "@/assets/flag-gb.png";
import flagBr from "@/assets/flag-br.png";
import flagNo from "@/assets/flag-no.png";

const flagImages: Record<string, string> = { en: flagGb, pt: flagBr, no: flagNo };

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
            src={flagImages[lng]}
            alt={t(`lang.${lng}`)}
            width={24}
            height={24}
            loading="lazy"
            className="w-6 h-6 rounded-sm object-cover"
          />
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
