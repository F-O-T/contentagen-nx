import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const LOCALES_DIR = join(__dirname, "locales");
const SUPPORTED_LOCALES = ["en-US", "pt-BR"];

function getAllJsonFiles(dir: string): string[] {
   const files = readdirSync(dir, { recursive: true });
   return files
      .filter((file) => typeof file === "string" && file.endsWith(".json"))
      .map((file) => file as string);
}

function getKeysFromObject(
   obj: Record<string, unknown>,
   prefix = "",
): string[] {
   const keys: string[] = [];

   for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
         typeof value === "object" &&
         value !== null &&
         !Array.isArray(value)
      ) {
         keys.push(
            ...getKeysFromObject(value as Record<string, unknown>, fullKey),
         );
      } else {
         keys.push(fullKey);
      }
   }

   return keys.sort();
}

function loadTranslationKeys(locale: string, filename: string): string[] {
   const filePath = join(LOCALES_DIR, locale, "pages", filename);
   const content = readFileSync(filePath, "utf-8");
   const translations = JSON.parse(content);
   return getKeysFromObject(translations);
}

describe("Translation Keys Consistency", () => {
   const jsonFiles = getAllJsonFiles(
      join(LOCALES_DIR, SUPPORTED_LOCALES[0]!, "pages"),
   );

   describe.each(jsonFiles)("Translation file: %s", (filename) => {
      it(`should have matching keys between all locales for ${filename}`, () => {
         const keysByLocale: Record<string, string[]> = {};

         // Load keys for each locale
         for (const locale of SUPPORTED_LOCALES) {
            keysByLocale[locale] = loadTranslationKeys(locale, filename);
         }

         // Compare keys between locales
         const [baseLocale, ...otherLocales] = SUPPORTED_LOCALES;
         const baseKeys = keysByLocale[baseLocale!]!;

         for (const locale of otherLocales) {
            const localeKeys = keysByLocale[locale]!;

            // Check for missing keys in current locale
            const missingKeys = baseKeys.filter(
               (key: string) => !localeKeys.includes(key),
            );
            const extraKeys = localeKeys.filter(
               (key: string) => !baseKeys.includes(key),
            );

            expect(
               missingKeys,
               `Missing keys in ${locale} (${filename}): ${missingKeys.join(", ")}`,
            ).toHaveLength(0);
            expect(
               extraKeys,
               `Extra keys in ${locale} (${filename}): ${extraKeys.join(", ")}`,
            ).toHaveLength(0);
            expect(
               localeKeys,
               `Keys mismatch between ${baseLocale} and ${locale} for ${filename}`,
            ).toEqual(baseKeys);
         }
      });
   });

   it("should have the same translation files in all locales", () => {
      const filesByLocale: Record<string, string[]> = {};

      for (const locale of SUPPORTED_LOCALES) {
         const pagesDir = join(LOCALES_DIR, locale, "pages");
         filesByLocale[locale] = getAllJsonFiles(pagesDir).sort();
      }

      const [baseLocale, ...otherLocales] = SUPPORTED_LOCALES;
      const baseFiles = filesByLocale[baseLocale!]!;

      for (const locale of otherLocales) {
         const localeFiles = filesByLocale[locale]!;

         const missingFiles = baseFiles.filter(
            (file: string) => !localeFiles.includes(file),
         );
         const extraFiles = localeFiles.filter(
            (file: string) => !baseFiles.includes(file),
         );

         expect(
            missingFiles,
            `Missing translation files in ${locale}: ${missingFiles.join(", ")}`,
         ).toHaveLength(0);
         expect(
            extraFiles,
            `Extra translation files in ${locale}: ${extraFiles.join(", ")}`,
         ).toHaveLength(0);
         expect(
            localeFiles,
            `Translation files mismatch between ${baseLocale} and ${locale}`,
         ).toEqual(baseFiles);
      }
   });
});
