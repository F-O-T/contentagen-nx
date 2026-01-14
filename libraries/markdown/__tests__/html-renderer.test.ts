import { describe, expect, it } from "bun:test";
import { parseOrThrow, renderNodeToHtml, renderToHtml } from "../src/index";
import type { HeadingNode, TextNode } from "../src/schemas";

describe("renderToHtml", () => {
   describe("block elements", () => {
      it("renders headings", () => {
         const doc = parseOrThrow("# Hello World");
         expect(renderToHtml(doc)).toBe(
            '<h1 id="hello-world">Hello World</h1>',
         );
      });

      it("renders all heading levels", () => {
         for (let i = 1; i <= 6; i++) {
            const doc = parseOrThrow(`${"#".repeat(i)} Heading`);
            expect(renderToHtml(doc)).toBe(
               `<h${i} id="heading">Heading</h${i}>`,
            );
         }
      });

      it("renders paragraphs", () => {
         const doc = parseOrThrow("Hello world");
         expect(renderToHtml(doc)).toBe("<p>Hello world</p>");
      });

      it("renders multiple paragraphs", () => {
         const doc = parseOrThrow("Para 1\n\nPara 2");
         expect(renderToHtml(doc)).toBe("<p>Para 1</p>\n<p>Para 2</p>");
      });

      it("renders code blocks", () => {
         const doc = parseOrThrow("```\ncode here\n```");
         expect(renderToHtml(doc)).toBe("<pre><code>code here</code></pre>");
      });

      it("renders code blocks with language", () => {
         const doc = parseOrThrow("```javascript\nconsole.log('hi');\n```");
         const html = renderToHtml(doc);
         expect(html).toContain('class="language-javascript"');
         expect(html).toContain("console.log");
      });

      it("renders blockquotes", () => {
         const doc = parseOrThrow("> Quote text");
         const html = renderToHtml(doc);
         expect(html).toContain("<blockquote>");
         expect(html).toContain("<p>Quote text</p>");
         expect(html).toContain("</blockquote>");
      });

      it("renders nested blockquotes", () => {
         const doc = parseOrThrow("> Level 1\n> > Level 2");
         const html = renderToHtml(doc);
         expect(html).toContain("<blockquote>");
      });

      it("renders thematic breaks", () => {
         const doc = parseOrThrow("---");
         expect(renderToHtml(doc)).toBe("<hr />");
      });

      it("renders unordered lists", () => {
         const doc = parseOrThrow("- Item 1\n- Item 2");
         const html = renderToHtml(doc);
         expect(html).toContain("<ul>");
         expect(html).toContain("<li>Item 1</li>");
         expect(html).toContain("<li>Item 2</li>");
         expect(html).toContain("</ul>");
      });

      it("renders ordered lists", () => {
         const doc = parseOrThrow("1. First\n2. Second");
         const html = renderToHtml(doc);
         expect(html).toContain("<ol>");
         expect(html).toContain("<li>First</li>");
         expect(html).toContain("<li>Second</li>");
         expect(html).toContain("</ol>");
      });

      it("renders ordered lists with custom start", () => {
         const doc = parseOrThrow("5. Item A\n6. Item B");
         const html = renderToHtml(doc);
         expect(html).toContain('start="5"');
      });

      // Note: Task list parsing is a GFM extension not supported by CommonMark parser
      // The renderer supports task lists if the AST has checked property set
      it("renders list items with checked property as task lists", () => {
         // Manually create a task list AST node
         const doc = {
            root: {
               type: "document" as const,
               children: [
                  {
                     type: "list" as const,
                     ordered: false,
                     spread: false,
                     marker: "-" as const,
                     children: [
                        {
                           type: "listItem" as const,
                           marker: "-" as const,
                           spread: false,
                           checked: true,
                           children: [
                              {
                                 type: "paragraph" as const,
                                 children: [
                                    { type: "text" as const, value: "Done" },
                                 ],
                              },
                           ],
                        },
                        {
                           type: "listItem" as const,
                           marker: "-" as const,
                           spread: false,
                           checked: false,
                           children: [
                              {
                                 type: "paragraph" as const,
                                 children: [
                                    { type: "text" as const, value: "Todo" },
                                 ],
                              },
                           ],
                        },
                     ],
                  },
               ],
            },
            lineEnding: "\n" as const,
         };
         const html = renderToHtml(doc);
         expect(html).toContain('type="checkbox"');
         expect(html).toContain("checked");
         expect(html).toContain("disabled");
      });
   });

   describe("inline elements", () => {
      it("renders emphasis", () => {
         const doc = parseOrThrow("*italic*");
         expect(renderToHtml(doc)).toContain("<em>italic</em>");
      });

      it("renders strong", () => {
         const doc = parseOrThrow("**bold**");
         expect(renderToHtml(doc)).toContain("<strong>bold</strong>");
      });

      it("renders nested emphasis and strong", () => {
         // Use separate markers to ensure proper nesting
         const doc = parseOrThrow("**_bold and italic_**");
         const html = renderToHtml(doc);
         expect(html).toContain("<strong>");
         expect(html).toContain("<em>");
      });

      it("renders links", () => {
         const doc = parseOrThrow("[text](https://example.com)");
         expect(renderToHtml(doc)).toContain(
            '<a href="https://example.com">text</a>',
         );
      });

      it("renders links with titles", () => {
         const doc = parseOrThrow('[text](https://example.com "Title")');
         const html = renderToHtml(doc);
         expect(html).toContain('title="Title"');
      });

      it("renders images", () => {
         const doc = parseOrThrow("![alt text](image.png)");
         expect(renderToHtml(doc)).toContain(
            '<img src="image.png" alt="alt text" />',
         );
      });

      it("renders images with titles", () => {
         const doc = parseOrThrow('![alt](image.png "Image title")');
         const html = renderToHtml(doc);
         expect(html).toContain('title="Image title"');
      });

      it("renders inline code", () => {
         const doc = parseOrThrow("`code`");
         expect(renderToHtml(doc)).toContain("<code>code</code>");
      });

      it("renders hard breaks", () => {
         const doc = parseOrThrow("Line 1  \nLine 2");
         expect(renderToHtml(doc)).toContain("<br />");
      });

      it("renders soft breaks as newlines by default", () => {
         const doc = parseOrThrow("Line 1\nLine 2");
         const html = renderToHtml(doc);
         expect(html).toContain("\n");
         expect(html).not.toContain("<br />");
      });
   });

   describe("XSS prevention", () => {
      it("escapes text content", () => {
         const doc = parseOrThrow("<script>alert('xss')</script>");
         const html = renderToHtml(doc);
         expect(html).not.toContain("<script>");
         expect(html).toContain("&lt;script&gt;");
      });

      it("escapes special characters in text", () => {
         const doc = parseOrThrow('Test & "quotes" < > symbols');
         const html = renderToHtml(doc);
         expect(html).toContain("&amp;");
         expect(html).toContain("&quot;");
         expect(html).toContain("&lt;");
         expect(html).toContain("&gt;");
      });

      it("escapes code block content", () => {
         const doc = parseOrThrow("```\n<script>alert('xss')</script>\n```");
         const html = renderToHtml(doc);
         expect(html).not.toContain("<script>");
         expect(html).toContain("&lt;script&gt;");
      });

      it("escapes inline code content", () => {
         const doc = parseOrThrow("`<script>alert('xss')</script>`");
         const html = renderToHtml(doc);
         expect(html).not.toContain("<script>");
      });

      it("sanitizes raw HTML blocks by default", () => {
         const doc = parseOrThrow(
            "<div onclick='alert(1)'>content</div>\n\ntext",
         );
         const html = renderToHtml(doc);
         // The raw HTML is escaped, so <div becomes &lt;div
         // The onclick attribute is rendered as text, not as an executable attribute
         expect(html).toContain("&lt;div");
         expect(html).not.toContain("<div onclick");
      });

      it("allows raw HTML when sanitizeHtml is false", () => {
         const doc = parseOrThrow("<div>content</div>\n\ntext");
         const html = renderToHtml(doc, { sanitizeHtml: false });
         expect(html).toContain("<div>content</div>");
      });

      it("escapes link URLs", () => {
         const doc = parseOrThrow("[click](test?a=1&b=2)");
         const html = renderToHtml(doc);
         expect(html).toContain("&amp;");
      });

      it("escapes image URLs", () => {
         const doc = parseOrThrow("![alt](test?a=1&b=2)");
         const html = renderToHtml(doc);
         expect(html).toContain("&amp;");
      });

      it("escapes link titles", () => {
         const doc = parseOrThrow('[text](url "Title with <html>")');
         const html = renderToHtml(doc);
         expect(html).toContain("&lt;html&gt;");
      });
   });

   describe("options", () => {
      it("adds target=_blank for external links when configured", () => {
         const doc = parseOrThrow("[text](https://example.com)");
         const html = renderToHtml(doc, { externalLinksNewTab: true });
         expect(html).toContain('target="_blank"');
         expect(html).toContain('rel="noopener noreferrer"');
      });

      it("does not add target=_blank for internal links", () => {
         const doc = parseOrThrow("[text](/internal)");
         const html = renderToHtml(doc, { externalLinksNewTab: true });
         expect(html).not.toContain('target="_blank"');
      });

      it("does not add target=_blank for relative links", () => {
         const doc = parseOrThrow("[text](./relative)");
         const html = renderToHtml(doc, { externalLinksNewTab: true });
         expect(html).not.toContain('target="_blank"');
      });

      it("applies class prefix to elements", () => {
         const doc = parseOrThrow("# Heading");
         const html = renderToHtml(doc, { classPrefix: "md-" });
         expect(html).toContain('class="md-h1"');
      });

      it("applies class prefix to paragraphs", () => {
         const doc = parseOrThrow("Text");
         const html = renderToHtml(doc, { classPrefix: "md-" });
         expect(html).toContain('class="md-p"');
      });

      it("applies class prefix to code spans", () => {
         const doc = parseOrThrow("`code`");
         const html = renderToHtml(doc, { classPrefix: "md-" });
         expect(html).toContain('class="md-code"');
      });

      it("transforms URLs with transformUrl option", () => {
         const doc = parseOrThrow("[text](test.png)");
         const html = renderToHtml(doc, {
            transformUrl: (url) => `/cdn/${url}`,
         });
         expect(html).toContain('href="/cdn/test.png"');
      });

      it("transforms image URLs", () => {
         const doc = parseOrThrow("![alt](image.png)");
         const html = renderToHtml(doc, {
            transformUrl: (url, type) =>
               type === "image" ? `/images/${url}` : url,
         });
         expect(html).toContain('src="/images/image.png"');
      });

      it("renders soft breaks as br when configured", () => {
         const doc = parseOrThrow("Line 1\nLine 2");
         const html = renderToHtml(doc, { softBreakAsBr: true });
         expect(html).toContain("<br />");
      });

      it("applies custom element attributes to links", () => {
         const doc = parseOrThrow("[text](url)");
         const html = renderToHtml(doc, {
            elementAttributes: {
               link: { "data-track": "true" },
            },
         });
         expect(html).toContain('data-track="true"');
      });

      it("applies custom element attributes to images", () => {
         const doc = parseOrThrow("![alt](img.png)");
         const html = renderToHtml(doc, {
            elementAttributes: {
               image: { loading: "lazy" },
            },
         });
         expect(html).toContain('loading="lazy"');
      });
   });

   describe("complex documents", () => {
      it("renders mixed content", () => {
         const markdown = `# Title

This is a **bold** paragraph with *italic* text.

- List item 1
- List item 2

\`\`\`javascript
const x = 1;
\`\`\`

> A quote
`;
         const doc = parseOrThrow(markdown);
         const html = renderToHtml(doc);

         expect(html).toContain('<h1 id="title">Title</h1>');
         expect(html).toContain("<strong>bold</strong>");
         expect(html).toContain("<em>italic</em>");
         expect(html).toContain("<ul>");
         expect(html).toContain("<li>");
         expect(html).toContain("<pre><code");
         expect(html).toContain("<blockquote>");
      });

      it("renders heading with inline formatting", () => {
         const doc = parseOrThrow("# Hello **World**");
         const html = renderToHtml(doc);
         expect(html).toBe(
            '<h1 id="hello-world">Hello <strong>World</strong></h1>',
         );
      });

      it("renders list with inline formatting", () => {
         const doc = parseOrThrow("- **Bold** item\n- *Italic* item");
         const html = renderToHtml(doc);
         expect(html).toContain("<strong>Bold</strong>");
         expect(html).toContain("<em>Italic</em>");
      });

      it("renders links with inline formatting in text", () => {
         const doc = parseOrThrow("[**bold link**](url)");
         const html = renderToHtml(doc);
         expect(html).toContain("<strong>bold link</strong>");
         expect(html).toContain("<a href=");
      });
   });
});

describe("renderNodeToHtml", () => {
   it("renders individual block nodes", () => {
      const node: HeadingNode = {
         type: "heading",
         level: 2,
         children: [{ type: "text", value: "Title" }],
         style: "atx",
      };
      expect(renderNodeToHtml(node)).toBe('<h2 id="title">Title</h2>');
   });

   it("renders individual inline nodes", () => {
      const node: TextNode = { type: "text", value: "Hello" };
      expect(renderNodeToHtml(node)).toBe("Hello");
   });

   it("escapes text in individual nodes", () => {
      const node: TextNode = { type: "text", value: "<script>" };
      expect(renderNodeToHtml(node)).toBe("&lt;script&gt;");
   });

   it("renders document nodes", () => {
      const doc = parseOrThrow("# Test");
      expect(renderNodeToHtml(doc.root)).toBe('<h1 id="test">Test</h1>');
   });

   it("accepts options", () => {
      const node: HeadingNode = {
         type: "heading",
         level: 1,
         children: [{ type: "text", value: "Title" }],
         style: "atx",
      };
      const html = renderNodeToHtml(node, { classPrefix: "md-" });
      expect(html).toContain('class="md-h1"');
   });
});
