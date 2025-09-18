import i18n from "i18next";
import enUSResources from "./locales/en-US";
import ptBRResources from "./locales/pt-BR";

type RecursiveKeyOf<T> = T extends object
   ? {
        [K in keyof T]: K extends string
           ? T[K] extends object
              ? `${K}.${RecursiveKeyOf<T[K]>}` | K
              : K
           : never;
     }[keyof T]
   : never;

type TranslationResources = typeof enUSResources.translation;

export type TranslationKey = RecursiveKeyOf<TranslationResources>;

const resources = {
   en: enUSResources,
   pt: ptBRResources,
};

declare module "i18next" {
   interface CustomTypeOptions {
      resources: typeof resources;
   }
}

i18n.init({
   resources,
   supportedLngs: ["en", "pt"],
   defaultNS: "translation",
   load: "languageOnly",
   fallbackLng: "en",
   lng: "pt", // Define português como idioma inicial
});

export default i18n;

export function translate(key: TranslationKey) {
   const result = i18n.t(key);
   if (result === key) {
      console.warn(`Translation key not found: ${key}`);
   }
   return result;
}

// Utility to get current language for HTTP requests
export function getCurrentLanguage(): string {
   return i18n.language || "en";
}

// Utility to get language headers for HTTP requests
export function getLanguageHeaders(): Record<string, string> {
   return {
      "Accept-Language": getCurrentLanguage(),
      "X-Locale": getCurrentLanguage(),
   };
}
