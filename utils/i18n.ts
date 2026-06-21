import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { useEffect } from "react";
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
const DEFAULT_LANGUAGE = "pt";
const supportedLanguages = new Set(Object.keys(resources));

function normalizeLanguage(languageCode?: string | null) {
  return languageCode && supportedLanguages.has(languageCode)
    ? languageCode
    : DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

export function useInitializeI18n() {
  useEffect(() => {
    let isActive = true;

    async function initializeLanguage() {
      const deviceLanguage = normalizeLanguage(
        Localization.getLocales()[0]?.languageCode,
      );

      try {
        const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
        const nextLanguage = normalizeLanguage(storedLanguage || deviceLanguage);
        if (isActive && nextLanguage !== i18n.language) {
          await i18n.changeLanguage(nextLanguage);
        }
      } catch {
        if (isActive && deviceLanguage !== i18n.language) {
          await i18n.changeLanguage(deviceLanguage);
        }
      }
    }

    initializeLanguage();

    return () => {
      isActive = false;
    };
  }, []);
}

// Store language changes
i18n.on("languageChanged", (lng) => {
  AsyncStorage.setItem(STORAGE_KEY, lng).catch(() => {
    // Ignore persistence errors.
  });
});

export default i18n;
