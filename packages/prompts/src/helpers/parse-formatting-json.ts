// Parses and validates the formatting JSON output from the brand metadata extraction prompt
// Throws an error if invalid or missing required fields

export interface BrandMetadata {
  brand_elements: string[];
  content_guidelines: string[];
  brand_context: string;
  application_domain: string;
  source: string;
}

export function parseFormattingJson(jsonString: string): BrandMetadata {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error("Formatting output is not valid JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Formatting output is not a valid object");
  }

  const requiredFields = [
    "brand_elements",
    "content_guidelines",
    "brand_context",
    "application_domain",
    "source",
  ];

  for (const field of requiredFields) {
    if (!(field in parsed)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (
    !Array.isArray(parsed.brand_elements) ||
    !parsed.brand_elements.every((v: any) => typeof v === "string")
  ) {
    throw new Error("brand_elements must be an array of strings");
  }
  if (
    !Array.isArray(parsed.content_guidelines) ||
    !parsed.content_guidelines.every((v: any) => typeof v === "string")
  ) {
    throw new Error("content_guidelines must be an array of strings");
  }
  if (typeof parsed.brand_context !== "string") {
    throw new Error("brand_context must be a string");
  }
  if (typeof parsed.application_domain !== "string") {
    throw new Error("application_domain must be a string");
  }
  if (typeof parsed.source !== "string") {
    throw new Error("source must be a string");
  }

  return parsed as BrandMetadata;
}
