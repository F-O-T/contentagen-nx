import { describe, expect, it } from "bun:test";
import { analyzeStructure } from "../src/structure";

describe("analyzeStructure", () => {
   it("should validate good heading hierarchy", () => {
      const result = analyzeStructure(`## Introduction

Some content here.

### Sub Section

More content.

## Another Section

Final content.`);

      expect(result.structure.headingHierarchyValid).toBe(true);
      expect(result.structure.headingCount).toBe(3);
   });

   it("should detect skipped heading levels", () => {
      const result = analyzeStructure(`## Introduction

Some content.

#### Skipped H3

This skips H3.`);

      expect(result.structure.headingHierarchyValid).toBe(false);
      expect(result.issues.some((i) => i.type === "heading_hierarchy")).toBe(
         true,
      );
   });

   it("should flag H1 in content", () => {
      const result = analyzeStructure(`# Main Title

This should not be H1 in content.

## Section

Content here.`);

      expect(result.issues.some((i) => i.type === "heading_h1")).toBe(true);
   });

   it("should detect quick answers", () => {
      const withQuickAnswer = analyzeStructure(`**TL;DR** - The answer is yes.

## More Details

Here are the details.`);

      const withTldr = analyzeStructure(`Em resumo - Here's the summary.

## Full Content

The full content follows.`);

      const withoutQuickAnswer = analyzeStructure(
         `## Introduction

Long introduction without a quick answer.

## Details

More content here. ${"Word ".repeat(100)}`,
      );

      expect(withQuickAnswer.structure.hasQuickAnswer).toBe(true);
      expect(withTldr.structure.hasQuickAnswer).toBe(true);
      expect(withoutQuickAnswer.structure.hasQuickAnswer).toBe(false);
   });

   it("should check for conclusion section", () => {
      const withConclusion = analyzeStructure(`## Introduction

Content here. More words for length. ${"Word ".repeat(100)}

## Body

More content. ${"Word ".repeat(100)}

## Conclusion

Final thoughts here.`);

      const withoutConclusion = analyzeStructure(`## Introduction

Content here. More words for length. ${"Word ".repeat(100)}

## Body

More content. ${"Word ".repeat(100)}

## Another Section

No conclusion section present.`);

      expect(withConclusion.structure.hasConclusion).toBe(true);
      expect(withoutConclusion.structure.hasConclusion).toBe(false);
   });

   it("should detect tables", () => {
      const withTable = analyzeStructure(`## Comparison

| Feature | Option A | Option B |
|---------|----------|----------|
| Price   | $10      | $20      |
| Quality | Good     | Better   |`);

      expect(withTable.structure.hasTables).toBe(true);
   });

   it("should check content type specific requirements", () => {
      const howTo = analyzeStructure(
         `## Getting Started

Here's how to do it.

## The Process

Some explanation.`,
         "how-to",
      );

      expect(howTo.issues.some((i) => i.type === "how_to_structure")).toBe(
         true,
      );

      const comparison = analyzeStructure(
         `## Product A vs Product B

Let's compare these products without a table.`,
         "comparison",
      );

      expect(
         comparison.issues.some((i) => i.type === "comparison_structure"),
      ).toBe(true);
   });
});
