import { expect, setDefaultTimeout, test } from "bun:test";

setDefaultTimeout(30000); // 30-second timeout for performance tests

import {
   generate,
   parse,
   parseOrThrow,
   parseStream,
   parseStreamToDocument,
} from "../src/index";

// =============================================================================
// Types
// =============================================================================

interface BenchmarkResult {
   name: string;
   iterations: number;
   totalMs: number;
   avgMs: number;
   minMs: number;
   maxMs: number;
   opsPerSec: number;
}

// =============================================================================
// Benchmark Helpers
// =============================================================================

function benchmark(
   name: string,
   fn: () => void,
   iterations = 10,
): BenchmarkResult {
   const times: number[] = [];

   // Warmup (2 iterations)
   for (let i = 0; i < 2; i++) {
      fn();
   }

   // Measure actual iterations
   for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
   }

   const totalMs = times.reduce((a, b) => a + b, 0);
   const avgMs = totalMs / iterations;
   const minMs = Math.min(...times);
   const maxMs = Math.max(...times);
   const opsPerSec = 1000 / avgMs;

   return { avgMs, iterations, maxMs, minMs, name, opsPerSec, totalMs };
}

function formatResult(result: BenchmarkResult): string {
   return `${result.name}: avg=${result.avgMs.toFixed(3)}ms, min=${result.minMs.toFixed(3)}ms, max=${result.maxMs.toFixed(3)}ms, ops/s=${result.opsPerSec.toFixed(2)}`;
}

function formatBytes(bytes: number): string {
   if (bytes < 1024) return `${bytes} B`;
   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
   return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatNumber(n: number): string {
   return n.toLocaleString("en-US");
}

// =============================================================================
// Data Generators
// =============================================================================

/**
 * Generates simple markdown with headings and paragraphs.
 */
function generateSimpleMarkdown(lineCount: number): string {
   const lines: string[] = [];
   let currentLine = 0;

   while (currentLine < lineCount) {
      // Add a heading every 10 lines
      if (currentLine % 10 === 0) {
         const level = (Math.floor(currentLine / 100) % 6) + 1;
         lines.push(
            `${"#".repeat(level)} Section ${Math.floor(currentLine / 10) + 1}`,
         );
         lines.push("");
         currentLine += 2;
      } else {
         // Add a paragraph with some inline formatting
         const paragraphIndex = currentLine;
         lines.push(
            `This is paragraph ${paragraphIndex} with **bold** and *italic* text. ` +
               `It contains a [link](https://example.com/${paragraphIndex}) and \`inline code\`.`,
         );
         lines.push("");
         currentLine += 2;
      }
   }

   return lines.join("\n");
}

/**
 * Generates complex markdown with various block and inline elements.
 */
function generateComplexMarkdown(sectionCount: number): string {
   const lines: string[] = [];

   for (let i = 0; i < sectionCount; i++) {
      // Heading
      const level = (i % 3) + 1;
      lines.push(`${"#".repeat(level)} Section ${i + 1}`);
      lines.push("");

      // Paragraph with inline elements
      lines.push(
         `This section contains **strong text**, *emphasized text*, ` +
            `\`inline code\`, and [a link](https://example.com/section-${i}).`,
      );
      lines.push("");

      // Blockquote
      lines.push(`> This is a blockquote in section ${i + 1}.`);
      lines.push(`> It spans multiple lines.`);
      lines.push("");

      // Unordered list
      lines.push(`- Item ${i * 3 + 1}`);
      lines.push(`- Item ${i * 3 + 2} with **bold**`);
      lines.push(`- Item ${i * 3 + 3} with [link](https://example.com)`);
      lines.push("");

      // Ordered list
      lines.push("1. First step");
      lines.push("2. Second step with `code`");
      lines.push("3. Third step");
      lines.push("");

      // Code block
      lines.push("```javascript");
      lines.push(`function example${i}() {`);
      lines.push(`   return ${i};`);
      lines.push("}");
      lines.push("```");
      lines.push("");

      // Image
      lines.push(`![Image ${i}](image-${i}.png "Title ${i}")`);
      lines.push("");

      // Thematic break
      lines.push("---");
      lines.push("");
   }

   return lines.join("\n");
}

/**
 * Generates worst-case markdown with deep nesting and complex structures.
 */
function generateWorstCaseMarkdown(blockCount: number): string {
   const lines: string[] = [];

   for (let i = 0; i < blockCount; i++) {
      // Deep nested blockquote
      const depth = (i % 5) + 1;
      const prefix = "> ".repeat(depth);
      lines.push(`${prefix}Nested blockquote at depth ${depth} in block ${i}`);
      lines.push(`${prefix}With **bold**, *italic*, \`code\`, and [link](url)`);
      lines.push("");

      // Nested list
      lines.push("- Level 1");
      lines.push("   - Level 2");
      lines.push("      - Level 3");
      lines.push("         - Level 4");
      lines.push("");

      // Long paragraph with many inline elements
      lines.push(
         `Paragraph ${i} with **bold ${i}** and *italic ${i}* and \`code ${i}\` ` +
            `and [link ${i}](https://example.com/${i}) and another **bold** and ` +
            `*italic* and \`more code\` and [another link](https://test.com/${i}).`,
      );
      lines.push("");

      // Code block with language
      lines.push("```typescript");
      lines.push(`interface Block${i} {`);
      lines.push("   id: number;");
      lines.push("   name: string;");
      lines.push(`   children: Block${i}[];`);
      lines.push("}");
      lines.push("```");
      lines.push("");
   }

   return lines.join("\n");
}

/**
 * Generates markdown with many reference links.
 */
function generateReferenceLinksMarkdown(linkCount: number): string {
   const lines: string[] = [];

   // Content with reference links
   for (let i = 0; i < linkCount; i++) {
      lines.push(`Check out [Link ${i}][ref${i}] for more info.`);
   }
   lines.push("");

   // Reference definitions at the end
   for (let i = 0; i < linkCount; i++) {
      lines.push(`[ref${i}]: https://example.com/${i} "Title ${i}"`);
   }

   return lines.join("\n");
}

// =============================================================================
// Core Parsing Tests
// =============================================================================

test("performance: parse small markdown (100 lines)", () => {
   const markdown = generateSimpleMarkdown(100);
   const result = benchmark("parse-100-lines", () => parse(markdown), 20);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(10);
});

test("performance: parse medium markdown (1000 lines)", () => {
   const markdown = generateSimpleMarkdown(1000);
   const result = benchmark("parse-1000-lines", () => parse(markdown), 10);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(100);
});

test("performance: parse large markdown (5000 lines)", () => {
   const markdown = generateSimpleMarkdown(5000);
   const result = benchmark("parse-5000-lines", () => parse(markdown), 5);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(1000);
});

// =============================================================================
// Complex Content Tests
// =============================================================================

test("performance: parse complex markdown (100 sections)", () => {
   const markdown = generateComplexMarkdown(100);
   const result = benchmark("parse-complex-100", () => parse(markdown), 10);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(200);
});

test("performance: parse complex markdown (500 sections)", () => {
   const markdown = generateComplexMarkdown(500);
   const result = benchmark("parse-complex-500", () => parse(markdown), 5);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(3000);
});

// =============================================================================
// Generation Tests
// =============================================================================

test("performance: generate markdown from AST", () => {
   const markdown = generateComplexMarkdown(100);
   const doc = parseOrThrow(markdown);

   const result = benchmark("generate-from-ast", () => generate(doc), 20);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(50);
});

test("performance: round-trip parse and generate (1000 lines)", () => {
   const markdown = generateSimpleMarkdown(1000);

   const result = benchmark(
      "roundtrip-1000-lines",
      () => {
         const doc = parseOrThrow(markdown);
         generate(doc);
      },
      10,
   );

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(200);
});

// =============================================================================
// Scaling Analysis
// =============================================================================

test("performance: linear scaling analysis", () => {
   const lineCounts = [500, 1000, 2000, 4000];
   const results: { count: number; parseTime: number }[] = [];

   for (const count of lineCounts) {
      const markdown = generateSimpleMarkdown(count);

      const startTime = performance.now();
      const doc = parseOrThrow(markdown);
      const parseTime = performance.now() - startTime;

      results.push({ count, parseTime });
      expect(doc.root.children.length).toBeGreaterThan(0);
   }

   console.log("\nScaling Analysis:");
   for (const r of results) {
      console.log(
         `  ${formatNumber(r.count)} lines: ${r.parseTime.toFixed(2)}ms`,
      );
   }

   // Check scaling is reasonable (allow for some super-linear behavior)
   const ratio =
      (results[results.length - 1]?.parseTime ?? 0) /
      (results[0]?.parseTime ?? 1);
   const countRatio =
      (results[results.length - 1]?.count ?? 0) / (results[0]?.count ?? 1);
   expect(ratio).toBeLessThan(countRatio * countRatio); // Allow O(n²) scaling
});

// =============================================================================
// Concurrent Parsing
// =============================================================================

test("performance: concurrent parsing", async () => {
   const markdown = generateSimpleMarkdown(1000);
   const concurrency = 5;

   const start = performance.now();
   const promises = Array.from({ length: concurrency }, () =>
      Promise.resolve(parse(markdown)),
   );
   const results = await Promise.all(promises);
   const end = performance.now();

   const totalTime = end - start;
   const avgTimePerParse = totalTime / concurrency;

   console.log(
      `Concurrent parsing (${concurrency}x): total=${totalTime.toFixed(2)}ms, avg=${avgTimePerParse.toFixed(2)}ms`,
   );

   expect(results.every((r) => r.success)).toBe(true);
   expect(totalTime).toBeLessThan(1000);
});

// =============================================================================
// Streaming Performance
// =============================================================================

test("performance: streaming vs full parse", async () => {
   const markdown = generateSimpleMarkdown(5000);

   // Full parse
   const fullStart = performance.now();
   const fullDoc = parseOrThrow(markdown);
   const fullTime = performance.now() - fullStart;

   // Streaming parse
   async function* stringStream(): AsyncGenerator<string> {
      const chunkSize = 1024;
      for (let i = 0; i < markdown.length; i += chunkSize) {
         yield markdown.slice(i, i + chunkSize);
      }
   }

   const streamStart = performance.now();
   const streamDoc = await parseStreamToDocument(stringStream());
   const streamTime = performance.now() - streamStart;

   console.log(`Full parse: ${fullTime.toFixed(2)}ms`);
   console.log(`Stream parse: ${streamTime.toFixed(2)}ms`);
   console.log(`Ratio: ${(streamTime / fullTime).toFixed(2)}x`);

   expect(fullDoc.root.children.length).toBeGreaterThan(0);
   expect(streamDoc.root.children.length).toBeGreaterThan(0);
});

test("performance: streaming event throughput", async () => {
   const markdown = generateSimpleMarkdown(2000);
   let blockCount = 0;

   async function* stringStream(): AsyncGenerator<string> {
      const chunkSize = 512;
      for (let i = 0; i < markdown.length; i += chunkSize) {
         yield markdown.slice(i, i + chunkSize);
      }
   }

   const start = performance.now();
   for await (const event of parseStream(stringStream())) {
      if (event.type === "block") {
         blockCount++;
      }
   }
   const duration = performance.now() - start;

   console.log(
      `Streamed ${formatNumber(blockCount)} blocks in ${duration.toFixed(2)}ms (${formatNumber(Math.round(blockCount / (duration / 1000)))} blocks/s)`,
   );

   expect(blockCount).toBeGreaterThan(0);
});

// =============================================================================
// Edge Cases
// =============================================================================

test("performance: worst case - deep nesting", () => {
   const markdown = generateWorstCaseMarkdown(100);
   const fileSize = new Blob([markdown]).size;

   console.log(`Worst case file size: ${formatBytes(fileSize)}`);

   const result = benchmark("parse-worst-case-100", () => parse(markdown), 5);
   console.log(formatResult(result));

   expect(result.avgMs).toBeLessThan(500);
});

test("performance: reference links resolution (500 links)", () => {
   const markdown = generateReferenceLinksMarkdown(500);

   const result = benchmark(
      "parse-reference-links-500",
      () => parse(markdown),
      10,
   );
   console.log(formatResult(result));

   const parseResult = parse(markdown);
   expect(parseResult.success).toBe(true);
   expect(result.avgMs).toBeLessThan(200);
});

// =============================================================================
// Large Dataset Test
// =============================================================================

test("performance: large dataset single parse (10K lines)", () => {
   console.log("\n========== LARGE DATASET (10K LINES) ==========");

   const markdown = generateSimpleMarkdown(10000);
   const fileSize = new Blob([markdown]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const startTime = performance.now();
   const result = parse(markdown);
   const parseTime = performance.now() - startTime;

   expect(result.success).toBe(true);
   if (!result.success) return;

   const doc = result.data;

   console.log(`Parse time: ${parseTime.toFixed(2)}ms`);
   console.log(`Blocks: ${formatNumber(doc.root.children.length)}`);
   console.log(`Throughput: ${(fileSize / 1024 / parseTime).toFixed(2)} KB/ms`);

   expect(parseTime).toBeLessThan(3000);
});
