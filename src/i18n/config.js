
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import fr from "./fr.json";
import rw from "./rw.json";

const savedLanguage =
  typeof window !== "undefined"
    ? localStorage.getItem("turaheza-language")
    : null;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    rw: { translation: rw }
  },
  lng: ["en", "fr", "rw"].includes(savedLanguage)
    ? savedLanguage
    : "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

i18n.on("languageChanged", (language) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("turaheza-language", language);
  }
});

export default i18n;
