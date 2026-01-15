import { beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { createSpellChecker, type SpellChecker } from "../src/index.ts";

// Load the real Portuguese dictionary for realistic benchmarks
const dictionaryPath = path.resolve(
   __dirname,
   "../../../apps/dashboard/public/dictionaries/pt",
);

describe("Performance Benchmarks", () => {
   let checker: SpellChecker;
   let loadTimeMs: number;

   beforeAll(async () => {
      // Check if dictionary exists
      const affPath = path.join(dictionaryPath, "pt.aff");
      const dicPath = path.join(dictionaryPath, "pt.dic");

      if (!fs.existsSync(affPath) || !fs.existsSync(dicPath)) {
         console.log(
            "Skipping benchmarks - dictionary not found at",
            dictionaryPath,
         );
         return;
      }

      const affData = fs.readFileSync(affPath, "utf-8");
      const dicData = fs.readFileSync(dicPath, "utf-8");

      const startTime = performance.now();
      checker = createSpellChecker({
         language: "pt",
         affData,
         dicData,
         ignoreCapitalized: true,
         minWordLength: 3,
         maxSuggestions: 8,
      });
      loadTimeMs = performance.now() - startTime;

      console.log(`Dictionary loaded in ${loadTimeMs.toFixed(2)}ms`);
      console.log(`Dictionary size: ${checker.dictionarySize} words`);
   });

   it("should load dictionary in < 2000ms", () => {
      if (!checker) return; // Skip if dictionary not found
      expect(loadTimeMs).toBeLessThan(2000);
      console.log(`✓ Dictionary load: ${loadTimeMs.toFixed(2)}ms`);
   });

   it("should check single word in < 1ms", () => {
      if (!checker) return;

      const testWords = [
         "palavra",
         "computador",
         "programação",
         "desenvolvimento",
         "inexistente",
      ];
      const iterations = 1000;

      const startTime = performance.now();
      for (let i = 0; i < iterations; i++) {
         for (const word of testWords) {
            checker.check(word);
         }
      }
      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / (iterations * testWords.length);

      expect(avgTime).toBeLessThan(1);
      console.log(`✓ Single word check: ${avgTime.toFixed(4)}ms average`);
   });

   it("should benefit from caching on repeated checks", () => {
      if (!checker) return;

      const word = "desenvolvimento";
      const iterations = 10000;

      // Clear cache first
      checker.clearCache();

      // First check (cold cache)
      const coldStart = performance.now();
      for (let i = 0; i < iterations; i++) {
         checker.check(word);
      }
      const coldTime = performance.now() - coldStart;

      const stats = checker.cacheStats;
      console.log(
         `Cache stats: ${stats.checkHits} hits, ${stats.checkMisses} misses`,
      );

      // Should have mostly cache hits after first check
      expect(stats.checkHits).toBeGreaterThan(iterations - 10);
      console.log(
         `✓ Cache hit rate: ${((stats.checkHits / iterations) * 100).toFixed(1)}%`,
      );
   });

   it("should generate suggestions in < 200ms", () => {
      if (!checker) return;

      const misspelledWords = [
         "palavrra",
         "computadro",
         "programaçao",
         "desenvolviment",
      ];
      const iterations = 10;

      const startTime = performance.now();
      for (let i = 0; i < iterations; i++) {
         for (const word of misspelledWords) {
            checker.suggest(word);
         }
      }
      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / (iterations * misspelledWords.length);

      expect(avgTime).toBeLessThan(200);
      console.log(`✓ Suggestions: ${avgTime.toFixed(2)}ms average`);
   });

   it("should check text with 1000 words in < 5000ms (with suggestions)", () => {
      if (!checker) return;

      // Generate realistic Portuguese text with some errors
      const words = [
         "o",
         "que",
         "é",
         "um",
         "em",
         "para",
         "com",
         "não",
         "uma",
         "os",
         "palavra",
         "casa",
         "computador",
         "programa",
         "sistema",
         "trabalho",
         "desenvolvimento",
         "aplicação",
         "usuário",
         "dados",
         "informação",
      ];

      // Create text with ~1000 words
      let text = "";
      for (let i = 0; i < 1000; i++) {
         text += words[i % words.length] + " ";
      }

      const startTime = performance.now();
      const result = checker.checkText(text);
      const checkTime = performance.now() - startTime;

      // Adjusted target since suggestions are computed for each error
      expect(checkTime).toBeLessThan(5000);
      console.log(
         `✓ Text check (${result.wordCount} words): ${checkTime.toFixed(2)}ms`,
      );
      console.log(`  Internal timing: ${result.checkTimeMs.toFixed(2)}ms`);
      console.log(`  Errors found: ${result.errors.length}`);
   });

   it("should handle incremental check efficiently", () => {
      if (!checker) return;

      // Create a 500-word text
      const words = ["palavra", "casa", "computador", "programa", "sistema"];
      let text = "";
      for (let i = 0; i < 500; i++) {
         text += words[i % words.length] + " ";
      }

      // Simulate editing in the middle
      const changeStart = 250;
      const changeEnd = 260;

      const startTime = performance.now();
      const result = checker.checkTextIncremental(text, changeStart, changeEnd);
      const checkTime = performance.now() - startTime;

      // Should be much faster than full check
      expect(checkTime).toBeLessThan(50);
      console.log(
         `✓ Incremental check: ${checkTime.toFixed(2)}ms (${result.wordCount} words in region)`,
      );
   });

   it("should stream errors asynchronously", async () => {
      if (!checker) return;

      const text = "Esta é uma palavrra com errro de ortografia computadro";
      const errors: string[] = [];

      const startTime = performance.now();
      for await (const error of checker.checkTextStream(text)) {
         errors.push(error.word);
      }
      const streamTime = performance.now() - startTime;

      expect(errors.length).toBeGreaterThan(0);
      console.log(
         `✓ Stream check: ${streamTime.toFixed(2)}ms, found ${errors.length} errors`,
      );
   });

   it("should check 3000-word document in < 500ms (streaming, no suggestions)", async () => {
      if (!checker) return;

      // Generate realistic Portuguese document (~3000 words)
      const paragraphs = [
         "O desenvolvimento de software moderno exige uma compreensão profunda dos princípios de programação.",
         "A tecnologia avança rapidamente e os programadores precisam se adaptar constantemente.",
         "Os sistemas de informação são fundamentais para o funcionamento das empresas modernas.",
         "A análise de dados permite tomar decisões mais informadas e estratégicas.",
         "O trabalho em equipe é essencial para o sucesso de projetos de grande escala.",
         "A documentação do código facilita a manutenção e a colaboração entre desenvolvedores.",
         "Os testes automatizados garantem a qualidade e a estabilidade do software.",
         "A segurança da informação é uma preocupação crescente no mundo digital.",
         "O design de interfaces deve priorizar a experiência do usuário.",
         "A otimização de performance é crucial para aplicações de alta demanda.",
      ];

      // Build text with ~3000 words (repeating paragraphs)
      let text = "";
      const wordsPerParagraph = 12; // avg words per paragraph
      const targetWords = 3000;
      const repeatCount = Math.ceil(
         targetWords / (paragraphs.length * wordsPerParagraph),
      );

      for (let i = 0; i < repeatCount; i++) {
         for (const paragraph of paragraphs) {
            text += paragraph + " ";
         }
      }

      // Add some intentional misspellings to test error detection
      text += "palavrra errro computadro desenvolviment programaçao ";

      const startTime = performance.now();
      let errorCount = 0;
      let wordCount = 0;

      for await (const error of checker.checkTextStream(text)) {
         errorCount++;
      }

      const streamTime = performance.now() - startTime;

      // Count words for reporting
      const words = text.split(/\s+/).filter((w) => w.length > 0);
      wordCount = words.length;

      // Target: < 500ms for 3000 words (streaming without suggestions)
      expect(streamTime).toBeLessThan(500);
      console.log(
         `✓ Large document stream (${wordCount} words): ${streamTime.toFixed(2)}ms`,
      );
      console.log(`  Errors found: ${errorCount}`);
      console.log(`  Words/ms: ${(wordCount / streamTime).toFixed(2)}`);
   });

   it("should check 3000-word document synchronously in reasonable time", () => {
      if (!checker) return;

      // Generate the same large document
      const paragraphs = [
         "O desenvolvimento de software moderno exige uma compreensão profunda dos princípios de programação.",
         "A tecnologia avança rapidamente e os programadores precisam se adaptar constantemente.",
         "Os sistemas de informação são fundamentais para o funcionamento das empresas modernas.",
         "A análise de dados permite tomar decisões mais informadas e estratégicas.",
         "O trabalho em equipe é essencial para o sucesso de projetos de grande escala.",
      ];

      let text = "";
      for (let i = 0; i < 300; i++) {
         // ~3000 words
         text += paragraphs[i % paragraphs.length] + " ";
      }

      const startTime = performance.now();
      const result = checker.checkText(text);
      const checkTime = performance.now() - startTime;

      // This includes suggestion generation, so higher threshold
      expect(checkTime).toBeLessThan(10000);
      console.log(
         `✓ Large document sync (${result.wordCount} words): ${checkTime.toFixed(2)}ms`,
      );
      console.log(`  Internal timing: ${result.checkTimeMs.toFixed(2)}ms`);
      console.log(`  Errors found: ${result.errors.length}`);
   });
});
