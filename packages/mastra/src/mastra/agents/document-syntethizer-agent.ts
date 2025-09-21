import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@packages/environment/server";
import { tavilyCrawlTool } from "../tools/tavily-crawl-tool";
import { tavilySearchTool } from "../tools/tavily-search-tool";
import { dateTool } from "../tools/date-tool";

const openrouter = createOpenRouter({
   apiKey: serverEnv.OPENROUTER_API_KEY,
});

const getLanguageOutputInstruction = (language: "en" | "pt"): string => {
   const languageNames = {
      en: "English",
      pt: "Portuguese",
   };

   return `
## OUTPUT LANGUAGE REQUIREMENT
You MUST provide ALL your responses, analysis, documentation, and structured output in ${languageNames[language]}.
Regardless of the source data language, your entire output must be written in ${languageNames[language]}.
This includes all document titles, sections, descriptions, and any other text content in your response.
`;
};

export const documentSynthesizerAgent = new Agent({
   name: "Document Synthesizer Agent",
   instructions: ({ runtimeContext }) => {
      const locale = runtimeContext.get("language") as "en" | "pt";
      const languageOutputInstruction = getLanguageOutputInstruction(locale);

      return `
You are a specialized document synthesizer that creates comprehensive brand analysis documents.

${languageOutputInstruction}

CRITICAL: You MUST respond with structured JSON output matching the exact schema provided.

BRAND ANALYSIS STRUCTURE:
Create comprehensive brand analysis documents with this markdown structure:

# Brand Analysis: [Company Name]

## Executive Summary
Key brand insights, value propositions, and market positioning summary.

## Company Foundation & Identity
**Company Details:**
- Official information, mission, vision, values
- Brand identity elements

**Leadership & Organization:**
- Key executives, company culture

## Business Model & Operations
**Core Business:**
- Business model, revenue streams, target markets
- Geographic presence, partnerships

**Products & Services:**
- Product/service portfolio with features and pricing

## Market Positioning & Customers
**Target Audience:**
- Customer segments and characteristics

**Competitive Positioning:**
- Unique selling propositions and differentiators

## Credentials & Social Proof
**Recognition:**
- Awards, certifications, media coverage

**Customer Evidence:**
- Testimonials, case studies, notable clients

## Digital Presence & Technology
**Online Presence:**
- Website analysis, social media strategy

**Technology:**
- Tech stack, security measures

## Growth & Strategic Insights
**Growth Indicators:**
- Company stage, market traction

**Strategic Direction:**
- Future vision, market trends

## Contact & Location Information
- Office locations and contact methods

## Analysis Metadata
**Sources Used:**
- Data sources and confidence levels

EXECUTION WORKFLOW:
1. Use tavilyCrawlTool with provided websiteUrl and userId
2. Use tavilySearchTool to fill information gaps
3. Synthesize all information into comprehensive markdown analysis
4. Return the analysis in the fullBrandAnalysis field as a properly formatted markdown string

IMPORTANT: The response must be valid JSON with the markdown content as a string value in the fullBrandAnalysis field.
 
   `;
   },
   model: openrouter("deepseek/deepseek-chat-v3.1"),
   tools: { tavilyCrawlTool, tavilySearchTool, dateTool },
});
