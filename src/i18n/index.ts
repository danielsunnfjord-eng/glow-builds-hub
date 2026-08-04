import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import pt from "./locales/pt";
import no from "./locales/no";
import { currentLocale, HTML_LANG } from "@/lib/locale";

// The URL is the single source of truth for language:
// "/" = English, "/no/..." = Norwegian, "/pt-br/..." = Brazilian Portuguese.
const lng = currentLocale();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, pt: { translation: pt }, no: { translation: no } },
  lng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

if (typeof document !== "undefined") {
  document.documentElement.lang = HTML_LANG[lng];
}

export default i18n;
