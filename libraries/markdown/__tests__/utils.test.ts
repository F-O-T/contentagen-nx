import { describe, expect, it } from "bun:test";
import { normalizeMarkdownEmphasis } from "../src/utils";

describe("normalizeMarkdownEmphasis", () => {
   describe("basic unescaping", () => {
      it("unescapes bold markers", () => {
         expect(normalizeMarkdownEmphasis("\\*\\*bold\\*\\*")).toBe("**bold**");
      });

      it("unescapes italic markers", () => {
         expect(normalizeMarkdownEmphasis("\\*italic\\*")).toBe("*italic*");
      });

      it("leaves already unescaped markers alone", () => {
         expect(normalizeMarkdownEmphasis("**already fine**")).toBe(
            "**already fine**",
         );
      });

      it("handles mixed escaped and unescaped markers", () => {
         expect(
            normalizeMarkdownEmphasis(
               "mixed \\*\\*escaped\\*\\* and **normal**",
            ),
         ).toBe("mixed **escaped** and **normal**");
      });
   });

   describe("unicode and international text", () => {
      it("handles Portuguese text with escaped markers", () => {
         expect(
            normalizeMarkdownEmphasis(
               "As \\*\\*mudanças SEO\\*\\* são profundas",
            ),
         ).toBe("As **mudanças SEO** são profundas");
      });

      it("handles text with accented characters", () => {
         expect(
            normalizeMarkdownEmphasis("\\*\\*café\\*\\* e \\*\\*résumé\\*\\*"),
         ).toBe("**café** e **résumé**");
      });

      it("handles Chinese characters", () => {
         expect(normalizeMarkdownEmphasis("\\*\\*你好世界\\*\\*")).toBe(
            "**你好世界**",
         );
      });

      it("handles Japanese characters", () => {
         expect(normalizeMarkdownEmphasis("\\*\\*こんにちは\\*\\*")).toBe(
            "**こんにちは**",
         );
      });

      it("handles emojis", () => {
         expect(normalizeMarkdownEmphasis("\\*\\*Hello 👋\\*\\*")).toBe(
            "**Hello 👋**",
         );
      });
   });

   describe("multiple occurrences", () => {
      it("handles multiple escaped bold phrases in same line", () => {
         expect(
            normalizeMarkdownEmphasis(
               "This is \\*\\*first\\*\\* and \\*\\*second\\*\\* bold text",
            ),
         ).toBe("This is **first** and **second** bold text");
      });

      it("handles escaped bold and italic mixed", () => {
         expect(
            normalizeMarkdownEmphasis("\\*\\*bold\\*\\* and \\*italic\\* text"),
         ).toBe("**bold** and *italic* text");
      });

      it("handles many escaped markers in one string", () => {
         const input =
            "\\*\\*one\\*\\* \\*two\\* \\*\\*three\\*\\* \\*four\\* \\*\\*five\\*\\*";
         const expected = "**one** *two* **three** *four* **five**";
         expect(normalizeMarkdownEmphasis(input)).toBe(expected);
      });
   });

   describe("preserves other markdown", () => {
      it("does not affect other escaped characters", () => {
         expect(normalizeMarkdownEmphasis("\\# not a heading")).toBe(
            "\\# not a heading",
         );
         expect(normalizeMarkdownEmphasis("\\[not a link\\]")).toBe(
            "\\[not a link\\]",
         );
      });

      it("preserves regular markdown links", () => {
         expect(normalizeMarkdownEmphasis("[link](https://example.com)")).toBe(
            "[link](https://example.com)",
         );
      });

      it("preserves regular markdown images", () => {
         expect(normalizeMarkdownEmphasis("![alt](image.png)")).toBe(
            "![alt](image.png)",
         );
      });

      it("preserves inline code with asterisks", () => {
         expect(normalizeMarkdownEmphasis("`**not bold**`")).toBe(
            "`**not bold**`",
         );
      });

      it("preserves code blocks", () => {
         const input = "```\n**code**\n```";
         expect(normalizeMarkdownEmphasis(input)).toBe(input);
      });
   });

   describe("edge cases", () => {
      it("handles text without any escapes", () => {
         expect(normalizeMarkdownEmphasis("plain text")).toBe("plain text");
      });

      it("handles empty string", () => {
         expect(normalizeMarkdownEmphasis("")).toBe("");
      });

      it("handles single asterisk escape", () => {
         expect(normalizeMarkdownEmphasis("\\*")).toBe("*");
      });

      it("handles double asterisk escape alone", () => {
         expect(normalizeMarkdownEmphasis("\\*\\*")).toBe("**");
      });

      it("handles escaped asterisks at start of string", () => {
         expect(normalizeMarkdownEmphasis("\\*\\*start\\*\\* of text")).toBe(
            "**start** of text",
         );
      });

      it("handles escaped asterisks at end of string", () => {
         expect(normalizeMarkdownEmphasis("end of \\*\\*text\\*\\*")).toBe(
            "end of **text**",
         );
      });

      it("handles newlines with escaped markers", () => {
         expect(
            normalizeMarkdownEmphasis("line1 \\*\\*bold\\*\\*\nline2"),
         ).toBe("line1 **bold**\nline2");
      });

      it("handles only escaped markers with whitespace", () => {
         expect(normalizeMarkdownEmphasis("\\*\\*   \\*\\*")).toBe("**   **");
      });
   });

   describe("real-world LLM output patterns", () => {
      it("handles typical LLM escaped output", () => {
         const llmOutput =
            "O SEO em 2026 não é mais o mesmo. As \\*\\*mudanças SEO\\*\\* são profundas.";
         const expected =
            "O SEO em 2026 não é mais o mesmo. As **mudanças SEO** são profundas.";
         expect(normalizeMarkdownEmphasis(llmOutput)).toBe(expected);
      });

      it("handles mixed LLM output with some escaped and some not", () => {
         const llmOutput =
            "\\*\\*Título\\*\\* e **subtítulo** com \\*\\*destaque\\*\\*";
         const expected = "**Título** e **subtítulo** com **destaque**";
         expect(normalizeMarkdownEmphasis(llmOutput)).toBe(expected);
      });

      it("handles paragraph with multiple bold phrases", () => {
         const input = `
				Este é um parágrafo com \\*\\*primeira frase em negrito\\*\\* e depois
				temos \\*\\*segunda frase\\*\\* e finalmente \\*\\*terceira frase\\*\\*.
			`;
         const result = normalizeMarkdownEmphasis(input);
         expect(result).toContain("**primeira frase em negrito**");
         expect(result).toContain("**segunda frase**");
         expect(result).toContain("**terceira frase**");
         expect(result).not.toContain("\\*");
      });

      it("handles list items with escaped bold", () => {
         const input = `
- \\*\\*Item 1\\*\\*: Description
- \\*\\*Item 2\\*\\*: Description
- \\*\\*Item 3\\*\\*: Description
			`;
         const result = normalizeMarkdownEmphasis(input);
         expect(result).toContain("**Item 1**");
         expect(result).toContain("**Item 2**");
         expect(result).toContain("**Item 3**");
      });
   });
});
