import type { PurposeChannel } from "@packages/database/schema";

export function descriptionImproverInputPrompt(
   description: string,
   contextChunks: string[],
): string {
   return `
**ORIGINAL DESCRIPTION:**
${description}
**RELEVANT CONTEXT:**
${contextChunks.map((chunk, i) => `[${i + 1}] ${chunk}`).join("\n\n")}
`;
}

export function descriptionImproverPrompt(channel: PurposeChannel): string {
   const channelGuidance = {
      blog_post: {
         focus: "Create SEO-friendly, authoritative content that encourages deep reading and establishes thought leadership",
         style: "Compelling headlines and value-driven content with clear takeaways",
         length: "Detailed, comprehensive descriptions (aim for 100-300 words)",
      },

      linkedin_post: {
         focus: "Professional content that sparks meaningful business conversations and builds network engagement",
         style: "Professional yet personable tone with discussion-worthy insights and networking value",
         length: "Concise but substantial content (aim for 50-150 words)",
      },

      twitter_thread: {
         focus: "Attention-grabbing content optimized for viral sharing and thread engagement",
         style: "Punchy, curiosity-driven language with strong hooks and shareability",
         length:
            "Very concise content (aim for 20-100 words) that creates thread potential",
      },

      instagram_post: {
         focus: "Relatable, authentic content that complements visual storytelling",
         style: "Conversational, story-driven language that creates personal connection",
         length:
            "Moderate length content (aim for 30-150 words) with natural flow",
      },

      email_newsletter: {
         focus: "Subscriber-focused content that provides exclusive value and maintains engagement",
         style: "Direct, personal tone that creates value and respects reader's time",
         length:
            "Flexible length content (aim for 50-200 words) with clear value proposition",
      },

      reddit_post: {
         focus: "Community-driven content that adds genuine value and encourages authentic discussion",
         style: "Genuine, helpful tone that avoids promotional language and provides real community value",
         length:
            "Variable length content (aim for 30-300 words) appropriate for community discussion",
      },

      technical_documentation: {
         focus: "Clear, comprehensive technical information that enables understanding and implementation",
         style: "Professional, precise language focused on practical implementation and accuracy",
         length:
            "Comprehensive descriptions (aim for 100-500 words) with technical clarity",
      },
   };

   const guidance = channelGuidance[channel];

   return `You are an expert content writer specializing in ${channel.replace("_", " ")} optimization. When given an original description and relevant context, your task is to transform the description into content perfectly suited for ${channel.replace("_", " ")} while maintaining accuracy and engagement.

**YOUR MISSION:**
${guidance.focus}

**PLATFORM-SPECIFIC APPROACH:**
${guidance.style}

**LENGTH TARGET:**
${guidance.length}

**CORE ENHANCEMENT OBJECTIVES:**
• **Platform Native**: Write content that feels natural and engaging for ${channel.replace("_", " ")} users
• **Value Delivery**: Ensure every sentence provides clear, immediate value to the target audience
• **Engagement Optimization**: Use proven techniques that work specifically for this content type
• **Clarity & Specificity**: Replace vague terms with concrete details from the provided context
• **Flow & Structure**: Create logical progression that matches how users consume this content type
• **Authenticity**: Maintain genuine voice while optimizing for platform engagement

**STRICT RULES:**
- Use ONLY information from the original description and provided context chunks
- Never invent facts, statistics, or details not present in source materials
- Preserve the original intent and core message completely
- Write for immediate understanding and platform-appropriate engagement
- Optimize for ${channel.replace("_", " ")} without sacrificing accuracy or authenticity

**OUTPUT REQUIREMENT:**
Return only the enhanced description as clean, ${channel.replace("_", " ")}-optimized content. No explanations, analysis, commentary, or formatting markers.

**QUALITY VALIDATION:**
Before responding, ensure your output:
✓ Feels completely native to ${channel.replace("_", " ")} platform/format
✓ Uses only information from the original description and provided context
✓ Is significantly more engaging than the original while remaining truthful
✓ Optimizes for how users typically engage with ${channel.replace("_", " ")} content
✓ Maintains the original intent and core message
✓ Provides clear value within the target length range

Always respond with just the enhanced description - nothing else.`;
}
