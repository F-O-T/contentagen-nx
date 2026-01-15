import { beforeAll, describe, expect, it } from "bun:test";
import { parseAffFile, parseDicFile } from "../src/hunspell-parser.ts";
import { createSpellChecker, type SpellChecker } from "../src/index.ts";

// Create a minimal test dictionary
const minimalAff = `
SET UTF-8
FLAG UTF-8
TRY aeiouáéíóúãõâêôçbcdfghjklmnpqrstvwxyz

MAP 6
MAP aáãâ
MAP eéê
MAP ií
MAP oóõô
MAP uúü
MAP cç

REP 3
REP rr r
REP ss s
REP ção cao

PFX R Y 1
PFX R 0 re .

SFX S Y 3
SFX S 0 s [aeiou]
SFX S 0 es [rzs]
SFX S ão ões ão
`;

const minimalDic = `
10
palavra/S
computador/RS
casa/S
livro/S
cão
coração/S
programação
`;

describe("createSpellChecker", () => {
   let checker: SpellChecker;

   beforeAll(() => {
      checker = createSpellChecker({
         language: "pt",
         affData: minimalAff,
         dicData: minimalDic,
      });
   });

   describe("check", () => {
      it("should accept valid base words", () => {
         expect(checker.check("palavra")).toBe(true);
         expect(checker.check("computador")).toBe(true);
         expect(checker.check("casa")).toBe(true);
         expect(checker.check("cão")).toBe(true);
      });

      it("should reject misspelled words", () => {
         expect(checker.check("palavrra")).toBe(false);
         expect(checker.check("computadro")).toBe(false);
         expect(checker.check("xyzabc")).toBe(false);
      });

      it("should accept words with suffixes", () => {
         expect(checker.check("palavras")).toBe(true);
         expect(checker.check("casas")).toBe(true);
         expect(checker.check("computadores")).toBe(true);
      });

      it("should accept words with prefixes", () => {
         expect(checker.check("recomputador")).toBe(true);
      });

      it("should ignore short words by default", () => {
         expect(checker.check("a")).toBe(true);
         expect(checker.check("de")).toBe(true);
      });

      it("should ignore capitalized words by default", () => {
         expect(checker.check("Brasil")).toBe(true);
         expect(checker.check("João")).toBe(true);
      });

      it("should ignore all-caps acronyms", () => {
         expect(checker.check("API")).toBe(true);
         expect(checker.check("URL")).toBe(true);
      });

      it("should ignore words with numbers", () => {
         expect(checker.check("abc123")).toBe(true);
         expect(checker.check("v2")).toBe(true);
      });
   });

   describe("suggest", () => {
      it("should provide suggestions for misspelled words", () => {
         const suggestions = checker.suggest("palavrra");
         expect(suggestions.length).toBeGreaterThan(0);
      });

      it("should limit suggestions", () => {
         const suggestions = checker.suggest("xyzabc", 3);
         expect(suggestions.length).toBeLessThanOrEqual(3);
      });
   });

   describe("checkText", () => {
      it("should return errors with correct positions", () => {
         // Using words from our minimal dictionary
         const result = checker.checkText("casa palavrra livro");
         expect(result.hasErrors).toBe(true);
         expect(result.errors.length).toBe(1);
         expect(result.errors[0]?.word).toBe("palavrra");
         expect(result.errors[0]?.offset).toBe(5);
      });

      it("should count words correctly", () => {
         const result = checker.checkText("palavra casa livro");
         expect(result.wordCount).toBe(3);
      });

      it("should return timing information", () => {
         const result = checker.checkText("teste de texto");
         expect(result.checkTimeMs).toBeGreaterThanOrEqual(0);
      });

      it("should handle empty text", () => {
         const result = checker.checkText("");
         expect(result.errors).toEqual([]);
         expect(result.wordCount).toBe(0);
         expect(result.hasErrors).toBe(false);
      });
   });

   describe("addWord", () => {
      it("should accept added custom words", () => {
         expect(checker.check("minhanovapavra")).toBe(false);
         checker.addWord("minhanovapavra");
         expect(checker.check("minhanovapavra")).toBe(true);
      });
   });

   describe("ignoreWord", () => {
      it("should accept ignored words", () => {
         expect(checker.check("palavraignorada")).toBe(false);
         checker.ignoreWord("palavraignorada");
         expect(checker.check("palavraignorada")).toBe(true);
      });
   });
});

describe("parseAffFile", () => {
   it("should parse SET directive", () => {
      const result = parseAffFile("SET UTF-8");
      expect(result.encoding).toBe("UTF-8");
   });

   it("should parse TRY directive", () => {
      const result = parseAffFile("TRY abcdef");
      expect(result.tryChars).toBe("abcdef");
   });

   it("should parse MAP directives", () => {
      const result = parseAffFile(`
MAP 2
MAP aáã
MAP eéê
`);
      expect(result.characterMaps.length).toBe(2);
      expect(result.characterMaps[0]).toEqual(["a", "á", "ã"]);
   });

   it("should parse REP directives", () => {
      const result = parseAffFile(`
REP 2
REP rr r
REP ss s
`);
      expect(result.replacements.length).toBe(2);
      expect(result.replacements[0]).toEqual({ from: "rr", to: "r" });
   });

   it("should parse PFX rules", () => {
      const result = parseAffFile(`
PFX R Y 2
PFX R 0 re [^r]
PFX R 0 rer r
`);
      expect(result.prefixRules["R"]).toBeDefined();
      expect(result.prefixRules["R"]?.length).toBe(2);
   });

   it("should parse SFX rules", () => {
      const result = parseAffFile(`
SFX S Y 2
SFX S 0 s [aeiou]
SFX S 0 es [rzs]
`);
      expect(result.suffixRules["S"]).toBeDefined();
      expect(result.suffixRules["S"]?.length).toBe(2);
   });
});

describe("parseDicFile", () => {
   it("should parse word count", () => {
      const result = parseDicFile(`3
palavra
casa
livro`);
      expect(result.wordCount).toBe(3);
   });

   it("should parse words with flags", () => {
      const result = parseDicFile(`2
palavra/S
computador/RS`);
      expect(result.words.get("palavra")).toBe("S");
      expect(result.words.get("computador")).toBe("RS");
   });

   it("should parse words without flags", () => {
      const result = parseDicFile(`1
palavra`);
      expect(result.words.get("palavra")).toBe("");
   });
});
