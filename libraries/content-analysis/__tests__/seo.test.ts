import { describe, expect, it } from "bun:test";
import { analyzeSeo } from "../src/seo";

describe("analyzeSeo", () => {
   it("should return a high score for well-optimized content", () => {
      const result = analyzeSeo({
         content: `**TL;DR** - SEO optimization is crucial for website visibility in search engines.

## Introduction

This is a comprehensive guide about SEO optimization for your website. Learn the essential techniques.

## Why SEO Matters

SEO is crucial for driving organic traffic to your website. Without proper optimization, your content may never reach your target audience. Understanding SEO fundamentals is key to success.

## Best Practices

Here are some key best practices for SEO:

- Use descriptive headings that include your target keywords
- Include relevant keywords naturally throughout your content
- Add internal and external links to improve site structure
- Optimize images with descriptive alt text for accessibility

## Conclusion

SEO is an ongoing process that requires continuous effort and optimization. [Learn more about SEO](https://example.com).`,
         title: "Complete Guide to SEO Optimization in 2024",
         metaDescription:
            "Learn the essential SEO optimization techniques to improve your website ranking. This comprehensive guide covers best practices and actionable tips.",
         targetKeywords: ["SEO", "optimization"],
      });

      expect(result.score).toBeGreaterThan(70);
      expect(result.metrics.wordCount).toBeGreaterThan(100);
      expect(result.metrics.headingCount).toBeGreaterThan(0);
      expect(result.metrics.hasQuickAnswer).toBe(true);
   });

   it("should flag missing title", () => {
      const result = analyzeSeo({
         content: "This is some content without proper structure.",
      });

      expect(result.score).toBeLessThan(100);
      expect(result.issues.some((i) => i.type === "title")).toBe(true);
   });

   it("should flag short content", () => {
      const result = analyzeSeo({
         content: "Short content.",
         title: "A Good Title for SEO",
      });

      expect(result.issues.some((i) => i.type === "content_length")).toBe(true);
   });

   it("should flag H1 in content", () => {
      const result = analyzeSeo({
         content: `# This is an H1 in content

Some paragraph text.`,
         title: "Page Title",
      });

      expect(result.issues.some((i) => i.type === "headings")).toBe(true);
      expect(
         result.issues.find((i) => i.type === "headings")?.message,
      ).toContain("H1");
   });

   it("should calculate keyword density correctly", () => {
      const result = analyzeSeo({
         content: `SEO is important. SEO helps your website. Learning SEO is valuable.

SEO optimization involves many techniques. SEO best practices include keyword research.`,
         title: "SEO Guide",
         targetKeywords: ["SEO"],
      });

      expect(result.metrics.keywordDensity).toBeDefined();
      expect(result.metrics.keywordDensity?.["SEO"]).toBeGreaterThan(0);
   });

   it("should detect missing quick answer", () => {
      const result = analyzeSeo({
         content: `## Introduction

This is a long introduction that doesn't immediately answer the reader's question.
It goes on and on without providing value upfront.

## The Main Content

Here is where the actual content begins, but by now the reader has scrolled a lot.
The quick answer should have been at the top.

## More Details

Additional information follows here. ${"Word ".repeat(50)}`,
         title: "Guide to Something Important",
      });

      expect(result.metrics.hasQuickAnswer).toBe(false);
      // The quick_answer issue is only shown for content > 300 words
      // This content is shorter, so let's check the score instead
      expect(result.score).toBeLessThan(100);
   });
});
