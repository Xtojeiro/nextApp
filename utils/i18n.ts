import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../assets/locales/en.json";
import es from "../assets/locales/es.json";
import pt from "../assets/locales/pt.json";

const resources = {
  en: { translation: en },
  pt: { translation: pt },
  es: { translation: es },
};

const STORAGE_KEY = "user_language";

// Initialize synchronously with device language first
const deviceLanguage = Localization.getLocales()[0]?.languageCode || "en";

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Load stored language asynchronously and update
AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (stored && stored !== deviceLanguage) {
      i18n.changeLanguage(stored);
    }
  })
  .catch(() => {
    // Ignore errors
  });

// Store language changes
i18n.on("languageChanged", (lng) => {
  AsyncStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
