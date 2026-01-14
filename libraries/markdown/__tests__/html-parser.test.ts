import { describe, expect, it } from "bun:test";
import {
   htmlAstToMarkdownAst,
   htmlToMarkdown,
   parseHtml,
} from "../src/html-parser";

describe("htmlToMarkdown", () => {
   describe("headings", () => {
      it("should convert h1-h6 to markdown headings", () => {
         expect(htmlToMarkdown("<h1>Heading 1</h1>")).toBe("# Heading 1");
         expect(htmlToMarkdown("<h2>Heading 2</h2>")).toBe("## Heading 2");
         expect(htmlToMarkdown("<h3>Heading 3</h3>")).toBe("### Heading 3");
         expect(htmlToMarkdown("<h4>Heading 4</h4>")).toBe("#### Heading 4");
         expect(htmlToMarkdown("<h5>Heading 5</h5>")).toBe("##### Heading 5");
         expect(htmlToMarkdown("<h6>Heading 6</h6>")).toBe("###### Heading 6");
      });
   });

   describe("paragraphs", () => {
      it("should convert paragraphs", () => {
         expect(htmlToMarkdown("<p>Hello world</p>")).toBe("Hello world");
      });

      it("should handle multiple paragraphs", () => {
         const html = "<p>First paragraph</p><p>Second paragraph</p>";
         const md = htmlToMarkdown(html);
         expect(md).toContain("First paragraph");
         expect(md).toContain("Second paragraph");
      });
   });

   describe("inline formatting", () => {
      it("should convert bold text", () => {
         expect(htmlToMarkdown("<p><strong>bold</strong></p>")).toBe(
            "**bold**",
         );
         expect(htmlToMarkdown("<p><b>bold</b></p>")).toBe("**bold**");
      });

      it("should convert italic text", () => {
         expect(htmlToMarkdown("<p><em>italic</em></p>")).toBe("*italic*");
         expect(htmlToMarkdown("<p><i>italic</i></p>")).toBe("*italic*");
      });

      it("should convert inline code", () => {
         expect(htmlToMarkdown("<p><code>code</code></p>")).toBe("`code`");
      });

      it("should handle nested formatting", () => {
         const html = "<p><strong><em>bold italic</em></strong></p>";
         const md = htmlToMarkdown(html);
         expect(md).toContain("bold italic");
         expect(md).toContain("**");
         expect(md).toContain("*");
      });
   });

   describe("links and images", () => {
      it("should convert links", () => {
         const html = '<p><a href="https://example.com">Link text</a></p>';
         expect(htmlToMarkdown(html)).toBe("[Link text](https://example.com)");
      });

      it("should convert links with title", () => {
         const html =
            '<p><a href="https://example.com" title="Example">Link</a></p>';
         expect(htmlToMarkdown(html)).toBe(
            '[Link](https://example.com "Example")',
         );
      });

      it("should convert images", () => {
         const html = '<img src="image.png" alt="Alt text">';
         expect(htmlToMarkdown(html)).toBe("![Alt text](image.png)");
      });

      it("should convert images with title", () => {
         const html = '<img src="image.png" alt="Alt" title="Title">';
         expect(htmlToMarkdown(html)).toBe('![Alt](image.png "Title")');
      });
   });

   describe("lists", () => {
      it("should convert unordered lists", () => {
         const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
         const md = htmlToMarkdown(html);
         expect(md).toContain("- Item 1");
         expect(md).toContain("- Item 2");
      });

      it("should convert ordered lists", () => {
         const html = "<ol><li>First</li><li>Second</li></ol>";
         const md = htmlToMarkdown(html);
         expect(md).toContain("1.");
         expect(md).toContain("First");
         expect(md).toContain("Second");
      });

      it("should handle nested lists", () => {
         const html = "<ul><li>Item 1<ul><li>Nested</li></ul></li></ul>";
         const md = htmlToMarkdown(html);
         expect(md).toContain("Item 1");
         expect(md).toContain("Nested");
      });
   });

   describe("code blocks", () => {
      it("should convert pre/code blocks", () => {
         const html =
            '<pre><code class="language-javascript">const x = 1;</code></pre>';
         const md = htmlToMarkdown(html);
         expect(md).toContain("```javascript");
         expect(md).toContain("const x = 1;");
         expect(md).toContain("```");
      });

      it("should handle code blocks without language", () => {
         const html = "<pre><code>some code</code></pre>";
         const md = htmlToMarkdown(html);
         expect(md).toContain("```");
         expect(md).toContain("some code");
      });
   });

   describe("blockquotes", () => {
      it("should convert blockquotes", () => {
         const html = "<blockquote><p>Quoted text</p></blockquote>";
         const md = htmlToMarkdown(html);
         expect(md).toContain("> Quoted text");
      });
   });

   describe("horizontal rules", () => {
      it("should convert hr tags", () => {
         expect(htmlToMarkdown("<hr>")).toBe("---");
         expect(htmlToMarkdown("<hr/>")).toBe("---");
      });
   });

   describe("tables", () => {
      it("should convert simple tables", () => {
         const html = `
            <table>
               <thead>
                  <tr><th>Header 1</th><th>Header 2</th></tr>
               </thead>
               <tbody>
                  <tr><td>Cell 1</td><td>Cell 2</td></tr>
               </tbody>
            </table>
         `;
         const md = htmlToMarkdown(html);
         expect(md).toContain("Header 1");
         expect(md).toContain("Header 2");
         expect(md).toContain("|");
         expect(md).toContain("---");
      });
   });

   describe("HTML entities", () => {
      it("should decode HTML entities", () => {
         expect(htmlToMarkdown("<p>&amp;</p>")).toBe("&");
         expect(htmlToMarkdown("<p>&lt;tag&gt;</p>")).toBe("<tag>");
         expect(htmlToMarkdown("<p>&quot;quoted&quot;</p>")).toBe('"quoted"');
      });
   });

   describe("complex documents", () => {
      it("should handle a complete HTML document", () => {
         const html = `
            <!DOCTYPE html>
            <html>
            <head><title>Test</title></head>
            <body>
               <h1>Title</h1>
               <p>Introduction with <strong>bold</strong> and <em>italic</em>.</p>
               <h2>Section</h2>
               <ul>
                  <li>Item 1</li>
                  <li>Item 2</li>
               </ul>
            </body>
            </html>
         `;
         const md = htmlToMarkdown(html);
         expect(md).toContain("# Title");
         expect(md).toContain("## Section");
         expect(md).toContain("**bold**");
         expect(md).toContain("*italic*");
         expect(md).toContain("- Item 1");
      });
   });
});

describe("parseHtml", () => {
   it("should parse basic HTML elements", () => {
      const nodes = parseHtml("<p>Hello</p>");
      expect(nodes.length).toBe(1);
      expect(nodes[0]?.type).toBe("element");
      expect(nodes[0]?.tag).toBe("p");
   });

   it("should parse attributes", () => {
      const nodes = parseHtml('<a href="test.html" class="link">Link</a>');
      expect(nodes[0]?.attributes?.href).toBe("test.html");
      expect(nodes[0]?.attributes?.class).toBe("link");
   });

   it("should handle nested elements", () => {
      const nodes = parseHtml("<div><p>Nested</p></div>");
      expect(nodes[0]?.children?.length).toBe(1);
      expect(nodes[0]?.children?.[0]?.tag).toBe("p");
   });

   it("should handle self-closing tags", () => {
      const nodes = parseHtml('<img src="test.png"><br>');
      expect(nodes.length).toBe(2);
      expect(nodes[0]?.tag).toBe("img");
      expect(nodes[1]?.tag).toBe("br");
   });
});

describe("htmlAstToMarkdownAst", () => {
   it("should convert HTML AST to Markdown AST", () => {
      const htmlNodes = parseHtml("<h1>Hello</h1><p>World</p>");
      const mdAst = htmlAstToMarkdownAst(htmlNodes);

      expect(mdAst.type).toBe("document");
      expect(mdAst.children.length).toBe(2);
      expect(mdAst.children[0]?.type).toBe("heading");
      expect(mdAst.children[1]?.type).toBe("paragraph");
   });
});
