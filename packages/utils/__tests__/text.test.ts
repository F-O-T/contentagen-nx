import { describe, it, expect } from "vitest";
import {
   createDescriptionFromText,
   getKeywordsFromText,
   createSlug,
   countWords,
   extractTitleFromMarkdown,
   readTimeMinutes,
   removeTitleFromMarkdown,
   formatValueForDisplay,
   calculateContentStats,
   calculateReadabilityScore,
   analyzeContentStructure,
} from "../src/text";

describe("text utilities", () => {
   describe("createDescriptionFromText", () => {
      it("should create a description from text within maxLength", () => {
         const text = "This is a simple test.";
         const result = createDescriptionFromText({ text, maxLength: 50 });
         expect(result).toBe("This is a simple test.");
      });

      it("should truncate text longer than maxLength", () => {
         const text = "This is a very long text that should be truncated because it exceeds the maximum length.";
         const result = createDescriptionFromText({ text, maxLength: 50 });
         expect(result.length).toBeLessThanOrEqual(50);
         expect(result).toContain("...");
      });

      it("should remove markdown headers and links", () => {
         const text = "# Title\n\nThis is a [link](https://example.com) in text.";
         const result = createDescriptionFromText({ text, maxLength: 100 });
         expect(result).not.toContain("# Title");
         expect(result).not.toContain("[link](https://example.com)");
         expect(result).toContain("link");
      });

      it("should extract first paragraph", () => {
         const text = "First paragraph.\n\nSecond paragraph.";
         const result = createDescriptionFromText({ text, maxLength: 100 });
         expect(result).toContain("First paragraph");
         expect(result).not.toContain("Second paragraph");
      });
   });

   describe("getKeywordsFromText", () => {
      it("should extract keywords from text", () => {
         const text = "This is a test text about keywords and testing";
         const result = getKeywordsFromText({ text });
         expect(result).toContain("this");
         expect(result).toContain("test");
         expect(result).toContain("text");
         expect(result).toContain("keywords");
      });

      it("should filter words by minimum length", () => {
         const text = "This is a test with some longer words";
         const result = getKeywordsFromText({ text, minLength: 5 });
         expect(result).toContain("longer");
         expect(result).toContain("words");
         expect(result).not.toContain("this");
         expect(result).not.toContain("test");
      });

      it("should limit to top 10 keywords", () => {
         const text = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12";
         const result = getKeywordsFromText({ text, minLength: 3 });
         expect(result.length).toBeLessThanOrEqual(10);
      });
   });

   describe("createSlug", () => {
      it("should create slug from text", () => {
         const result = createSlug("Hello World Test");
         expect(result).toBe("hello-world-test");
      });

      it("should handle special characters", () => {
         const result = createSlug("Hello! @#$%^&*() World");
         expect(result).toBe("hello-dollarpercentand-world");
      });
   });

   describe("countWords", () => {
      it("should count words in text", () => {
         const result = countWords("This is a test");
         expect(result).toBe(4);
      });

      it("should handle multiple spaces", () => {
         const result = countWords("This    is   a   test");
         expect(result).toBe(4);
      });

      it("should handle empty string", () => {
         const result = countWords("");
         expect(result).toBe(0);
      });
   });

   describe("extractTitleFromMarkdown", () => {
      it("should extract title from markdown", () => {
         const markdown = "# My Title\n\nSome content here";
         const result = extractTitleFromMarkdown(markdown);
         expect(result).toBe("My Title");
      });

      it("should return empty string if no title found", () => {
         const markdown = "Some content without title";
         const result = extractTitleFromMarkdown(markdown);
         expect(result).toBe("");
      });
   });

   describe("readTimeMinutes", () => {
      it("should calculate read time", () => {
         const result = readTimeMinutes(200);
         expect(result).toBe(1);
      });

      it("should round up partial minutes", () => {
         const result = readTimeMinutes(250);
         expect(result).toBe(2);
      });
   });

   describe("removeTitleFromMarkdown", () => {
      it("should remove title from markdown", () => {
         const markdown = "# My Title\n\nSome content here";
         const result = removeTitleFromMarkdown(markdown);
         expect(result).not.toContain("# My Title");
         expect(result).toContain("Some content here");
      });
   });

   describe("formatValueForDisplay", () => {
      it("should format value for display", () => {
         const result = formatValueForDisplay("test_value");
         expect(result).toBe("Test Value");
      });

      it("should return default for empty value", () => {
         const result = formatValueForDisplay("");
         expect(result).toBe("Not specified");
      });
   });

   describe("calculateContentStats", () => {
      it("should calculate content statistics", () => {
         const content = "This is a test content with ten words in total";
         const result = calculateContentStats(content);
         expect(result.wordsCount).toBe("10");
         expect(result.readTimeMinutes).toBe("1");
      });
   });

   describe("calculateReadabilityScore", () => {
      it("should calculate readability score", () => {
         const text = "This is a simple text for testing readability score calculation.";
         const result = calculateReadabilityScore({ text });
         expect(result).toHaveProperty("score");
         expect(result).toHaveProperty("level");
         expect(typeof result.score).toBe("number");
         expect(typeof result.level).toBe("string");
      });
   });

   describe("analyzeContentStructure", () => {
      it("should analyze content structure", () => {
         const text = "# Title\n\nSome content.\n\n* List item 1\n* List item 2\n\n`code block`";
         const result = analyzeContentStructure({ text });
         expect(result).toHaveProperty("structure");
         expect(result.structure.headings).toBeGreaterThanOrEqual(1);
         expect(result.structure.paragraphs).toBeGreaterThanOrEqual(1);
      });
   });
});