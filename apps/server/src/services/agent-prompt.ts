import type {
   ContentType,
   VoiceTone,
   TargetAudience,
   FormattingStyle,
   knowledgeChunk,
   agent,
} from "../schemas/agent-schema";

// --- CORE TYPES ---
type KnowledgeChunk = typeof knowledgeChunk.$inferSelect;
type AgentConfig = typeof agent.$inferSelect;

export interface ContentRequest {
   topic: string;
   briefDescription: string;
}

export interface AgentPromptOptions {
   contentRequest: ContentRequest;
   knowledgeChunks?: KnowledgeChunk[];
   additionalContext?: string;
   specificRequirements?: string[];
}

function getContentTypeSection(
   contentType: ContentType,
   request: ContentRequest,
): string {
   const { topic, briefDescription } = request;

   switch (contentType) {
      case "blog_posts":
         return `## Content Type: Blog Post

**Objective**: Create a comprehensive, SEO-optimized blog article about "${topic}"
**Brief**: ${briefDescription}

**Optimal Length**: 1,200-2,000 words for maximum SEO impact and reader engagement

**Structure Requirements**:
- Compelling headline with primary keyword integration
- Hook-driven introduction (problem/question/statistic) within first 100 words
- 5-8 main sections with descriptive H2 subheadings
- Each section should be 200-300 words with supporting details
- Conclusion with key takeaways and next steps
- Natural keyword integration throughout content

**Quality Standards**:
- Provide actionable insights, not just information
- Include relevant examples, case studies, or data points
- Address common questions and pain points
- Write for featured snippet optimization where applicable
- Ensure content depth that establishes topical authority`;

      case "social_media":
         return `## Content Type: Social Media Content

**Objective**: Create engaging, platform-optimized social media content about "${topic}"
**Brief**: ${briefDescription}

**Optimal Length**: 
- Primary post: 150-300 characters for maximum engagement
- Supporting caption: 80-150 words with compelling hook
- Include 3-5 relevant hashtags

**Content Requirements**:
- Lead with attention-grabbing first line (under 125 characters)
- Focus on single, clear message or takeaway
- Include emotional triggers or curiosity gaps
- End with clear call-to-action (like, share, comment, visit)
- Write for mobile-first consumption
- Create thumb-stopping, scroll-stopping content

**Engagement Optimization**:
- Use questions to encourage comments
- Include relatable scenarios or pain points
- Reference current trends or timely topics when relevant
- Create content that begs to be shared`;

      case "marketing_copy":
         return `## Content Type: Marketing Copy

**Objective**: Write high-converting marketing copy for "${topic}"
**Brief**: ${briefDescription}

**Optimal Length**: 300-800 words (landing page style) with modular sections

**Conversion Framework**:
- Headline: Clear value proposition in 10 words or less
- Subheadline: Elaborate benefit in 15-20 words
- Problem agitation: 100-150 words identifying pain points
- Solution presentation: 200-300 words showcasing benefits
- Social proof: 50-100 words (testimonials/stats)
- Call-to-action: Multiple CTAs throughout, primary CTA emphasis

**Psychological Triggers**:
- Urgency and scarcity elements
- Benefit-focused language (not feature-heavy)
- Risk reversal and guarantee mentions
- Authority and credibility indicators
- Emotional connection points before logical justification`;

      case "technical_docs":
         return `## Content Type: Technical Documentation

**Objective**: Create clear, comprehensive technical documentation for "${topic}"
**Brief**: ${briefDescription}

**Optimal Length**: 800-1,500 words with modular, scannable sections

**Documentation Structure**:
- Overview: What it is and why it matters (100 words)
- Prerequisites: Required knowledge/tools (50-100 words)
- Step-by-step implementation: Main content (500-800 words)
- Examples: Practical use cases (200-300 words)
- Troubleshooting: Common issues and solutions (100-200 words)
- References: Additional resources (50 words)

**Technical Writing Standards**:
- Use imperative mood for instructions ("Click the button")
- Define technical terms on first use
- Include code snippets with proper formatting
- Use consistent terminology throughout
- Write for copy-paste functionality where applicable
- Anticipate user questions at each step`;

      default:
         return `## Content Type: General Content\nCreate comprehensive content about "${topic}" based on: ${briefDescription}`;
   }
}

// --- ENHANCED VOICE TONE PROMPTS ---
function getVoiceToneSection(voiceTone: VoiceTone): string {
   switch (voiceTone) {
      case "professional":
         return `## Voice & Tone: Professional Authority

**Writing Characteristics**:
- Use confident, declarative statements
- Employ industry-standard terminology with precision
- Maintain formal but accessible sentence structure
- Support claims with data, research, or credible sources
- Avoid contractions and casual language
- Use third-person perspective when appropriate
- Structure arguments logically with clear evidence

**Language Patterns**:
- "Research indicates..." / "Studies demonstrate..."
- "Best practices recommend..." / "Industry standards require..."
- Focus on facts, methodologies, and proven approaches
- Maintain objectivity while showing expertise`;

      case "conversational":
         return `## Voice & Tone: Friendly Conversation

**Writing Characteristics**:
- Write directly to the reader using "you" and "your"
- Use contractions naturally (you'll, don't, it's)
- Include rhetorical questions to create engagement
- Share relatable examples and personal anecdotes
- Use shorter paragraphs (2-4 sentences max)
- Include transitional phrases that feel natural in speech
- Allow personality to show through word choice

**Language Patterns**:
- "You know how..." / "Here's the thing..."
- "Let me share..." / "You might be wondering..."
- Use analogies that relate to everyday experiences
- Include conversational connectors ("So," "Now," "Plus")`;

      case "educational":
         return `## Voice & Tone: Clear Teacher

**Writing Characteristics**:
- Break complex concepts into digestible chunks
- Use the "preview-explain-review" teaching method
- Define terms immediately when first introduced
- Provide context for why information matters
- Use numbered steps and logical progression
- Include memory aids and summarization
- Anticipate and address common misconceptions

**Language Patterns**:
- "First, let's understand..." / "The key concept here is..."
- "To put this simply..." / "Here's what this means..."
- Use progressive disclosure (simple to complex)
- Include checkpoint questions and summaries`;

      case "creative":
         return `## Voice & Tone: Engaging Storyteller

**Writing Characteristics**:
- Use vivid imagery and sensory language
- Employ metaphors and analogies creatively
- Vary sentence length for rhythm and flow
- Include unexpected angles or unique perspectives
- Use active voice predominantly
- Create emotional connection through storytelling
- Balance creativity with clarity and purpose

**Language Patterns**:
- "Imagine..." / "Picture this..."
- Use descriptive adjectives and strong verbs
- Include narrative elements and character development
- Create tension and resolution within content`;

      default:
         return `## Voice & Tone: Balanced Approach\nUse clear, engaging language appropriate for the content and audience.`;
   }
}

// --- ENHANCED AUDIENCE TARGETING ---
function getTargetAudienceSection(audience: TargetAudience): string {
   switch (audience) {
      case "general_public":
         return `## Target Audience: Informed General Public

**Reader Profile**:
- Educated adults with diverse professional backgrounds
- Consuming content during busy schedules (mobile-friendly)
- Looking for practical value and actionable insights
- May encounter this topic casually or through search
- Appreciate clear explanations without condescension

**Content Adaptation**:
- Explain technical concepts using familiar analogies
- Provide context for industry-specific information
- Use inclusive language that doesn't assume expertise
- Structure content for easy scanning and quick consumption
- Include real-world applications and benefits`;

      case "professionals":
         return `## Target Audience: Industry Professionals

**Reader Profile**:
- 3+ years experience in relevant field
- Stay current with industry trends and best practices
- Value time-efficient, high-density information
- Often consume content to solve specific problems
- Appreciate advanced insights and strategic perspectives

**Content Adaptation**:
- Use industry terminology confidently and precisely
- Reference current market conditions and trends
- Focus on implementation details and advanced strategies
- Include ROI considerations and business impact
- Address common professional challenges with solutions`;

      case "beginners":
         return `## Target Audience: Motivated Beginners

**Reader Profile**:
- New to the topic but eager to learn
- May feel overwhelmed by information complexity
- Need foundational knowledge before advanced concepts
- Appreciate encouragement and confidence-building
- Value step-by-step guidance and clear next steps

**Content Adaptation**:
- Start with fundamental concepts and build progressively
- Avoid jargon or define terms immediately
- Use encouraging language and acknowledge learning challenges
- Provide clear action steps and beginner-friendly resources
- Include common mistakes to avoid and why`;

      case "customers":
         return `## Target Audience: Existing Customers

**Reader Profile**:
- Already familiar with your brand/product/service
- Seeking to maximize value from their investment
- May need help with specific features or advanced usage
- Interested in optimization and best practices
- Value ongoing education and support

**Content Adaptation**:
- Reference specific product features and capabilities
- Provide advanced tips and optimization strategies
- Address common customer questions and use cases
- Include success stories and proven methodologies
- Focus on value maximization and ROI improvement`;

      default:
         return `## Target Audience: General Audience\nTailor content appropriately for the intended readers.`;
   }
}

// --- ENHANCED FORMATTING STYLES ---
function getFormattingStyleSection(style: FormattingStyle): string {
   switch (style) {
      case "structured":
         return `## Formatting Style: Clear Structure

**Organization Framework**:
- Use descriptive, keyword-rich headings (H2, H3)
- Implement logical information hierarchy
- Create scannable content with strategic white space
- Use bullet points for lists and key benefits
- Include summary boxes or key takeaway sections
- Employ consistent formatting patterns throughout

**Visual Hierarchy**:
- Introduction with clear purpose and preview
- Main sections with 2-4 supporting subsections each
- Conclusion with actionable next steps
- Use bold text sparingly for emphasis on key points
- Include transition sentences between major sections`;

      case "narrative":
         return `## Formatting Style: Story Flow

**Narrative Structure**:
- Create compelling opening that establishes stakes
- Develop logical story progression with clear transitions
- Use case studies, examples, or scenarios as narrative vehicles
- Build tension through problem/solution dynamics
- Include character development (user personas, customer stories)
- Maintain reader engagement through strategic pacing

**Story Elements**:
- Setup: Establish context and relevance
- Conflict: Present challenges or problems
- Resolution: Provide solutions and outcomes
- Conclusion: Tie themes together with clear takeaways`;

      case "list_based":
         return `## Formatting Style: Scannable Lists

**List Organization**:
- Prioritize information by importance or sequence
- Use parallel structure for all list items
- Include brief explanations (1-2 sentences) for each point
- Group related items under themed subsections
- Use action-oriented language in list items
- Employ nested lists for complex information hierarchies

**List Variety**:
- Numbered lists for processes and sequential steps
- Bullet points for features, benefits, and options
- Checkboxes for actionable items and requirements
- Comparison formats for alternatives and choices`;

      default:
         return `## Formatting Style: Appropriate Format\nOrganize content in the most effective way for the topic and audience.`;
   }
}

// --- BRAND-FOCUSED KNOWLEDGE INTEGRATION ---
function getKnowledgeSection(knowledgeChunks?: KnowledgeChunk[]): string {
   // Only use brand knowledge chunks
   const brandChunks: KnowledgeChunk[] =
      knowledgeChunks?.filter(
         (chunk: KnowledgeChunk) => chunk.source === "brand_knowledge",
      ) ?? [];

   if (brandChunks.length === 0) {
      return `## ⚠️ BRAND KNOWLEDGE: MISSING CRITICAL INFORMATION

**MAJOR LIMITATION**: No brand knowledge has been provided. This severely limits the content's value and authenticity.

**What this means**:
- Content will be generic and lack brand personality
- No unique insights or perspectives can be included
- Brand voice and messaging cannot be maintained
- Content will sound like any competitor could have written it

**INSTRUCTION**: Create the best possible content using general best practices, but note that brand-specific knowledge would significantly improve quality and uniqueness.`;
   }

   let knowledgeSection = `## 🎯 BRAND KNOWLEDGE & VOICE (PRIORITY #1)

**CRITICAL MANDATE**: The brand knowledge below is your PRIMARY SOURCE OF TRUTH. You must weave this information throughout the entire content. Generic, non-branded content is UNACCEPTABLE.

**BRAND INTEGRATION REQUIREMENTS**:
- Minimum 3-5 direct references to brand knowledge per major section
- Use brand-specific examples, case studies, or data points
- Apply the brand's unique perspective to every main point
- Include brand terminology and concepts naturally
- Reference brand methodologies, frameworks, or approaches

**Available Brand Knowledge**:\n`;

   // Group brand knowledge chunks by category for better organization
   const categorizedChunks: Record<string, KnowledgeChunk[]> =
      brandChunks.reduce(
         (acc: Record<string, KnowledgeChunk[]>, chunk: KnowledgeChunk) => {
            const category = chunk.category || "Brand Guidelines";
            if (!acc[category]) acc[category] = [];
            acc[category].push(chunk);
            return acc;
         },
         {} as Record<string, KnowledgeChunk[]>,
      );

   Object.entries(categorizedChunks).forEach(
      ([category, chunks]: [string, KnowledgeChunk[]]) => {
         knowledgeSection += `\n### 📋 ${category}\n`;
         chunks.forEach((chunk: KnowledgeChunk, index: number) => {
            knowledgeSection += `\n**Brand Source ${index + 1}**:`;
            if (chunk.sourceType) knowledgeSection += ` (${chunk.sourceType})`;
            knowledgeSection += `\n`;
            if (chunk.summary) {
               knowledgeSection += `**Key Points**: ${chunk.summary}\n`;
            }
            if (chunk.keywords && chunk.keywords.length > 0) {
               knowledgeSection += `**Brand Keywords to Use**: ${chunk.keywords.join(", ")}\n`;
            }
            knowledgeSection += `**Brand Content to Reference**: ${chunk.content}\n\n`;
         });
      },
   );

   knowledgeSection += `**🚨 MANDATORY BRAND INTEGRATION CHECKLIST**:
✅ **Brand Voice**: Every paragraph should reflect the brand's unique voice and perspective
✅ **Specific Examples**: Include at least 2-3 specific examples, case studies, or data from the brand knowledge
✅ **Brand Terminology**: Use brand-specific terms, methodologies, and concepts throughout
✅ **Unique Insights**: Provide insights that ONLY this brand could offer based on their knowledge
✅ **Consistent Messaging**: Ensure all points align with the brand's established messaging and values
✅ **Authentic Authority**: Write as if you ARE the brand, not writing ABOUT the brand

**❌ AVOID AT ALL COSTS**:
- Generic advice that any competitor could write
- Industry platitudes without brand-specific backing
- Content that could be copy-pasted between different brands
- Vague references to "best practices" without brand context

**💡 INTEGRATION TECHNIQUES TO USE**:
- "In our experience at [Brand]..." / "We've found that..."
- "Our [proprietary method/framework/approach]..."
- "Based on our work with [specific examples from knowledge]..."
- "Unlike traditional approaches, we [brand-specific differentiation]..."
- Direct quotes or paraphrases from brand materials`;

   return knowledgeSection;
}

// --- AI PERSONA SECTION ---
function getAIPersonaSection(agent: AgentConfig): string {
   return `## AI Assistant Identity: ${agent.name}

**Your Role**: You are ${agent.name}, a specialized content creation expert with deep expertise in ${agent.contentType.replace("_", " ")}.
${agent.description ? `\n**Your Background**: ${agent.description}` : ""}

**Your Specialization**:
- Master of ${agent.contentType.replace("_", " ")} creation and optimization
- Expert in ${agent.voiceTone} communication that resonates with ${agent.targetAudience.replace("_", " ")}
- Skilled in ${agent.formattingStyle} content organization and presentation
- Knowledgeable about current best practices and industry standards

**Your Approach**:
- Always prioritize the reader's needs and desired outcomes
- Integrate brand knowledge seamlessly and naturally
- Create content that provides genuine value and actionable insights
- Maintain consistency in voice, tone, and quality across all content
- Focus on creating content that achieves specific business objectives

**Success Criteria**:
Your content succeeds when it:
- Engages the target audience from the first sentence
- Provides clear, actionable value
- Reflects the brand's unique expertise and perspective
- Achieves the intended business or educational outcome
- Maintains professional quality while being accessible`;
}

function getLanguageSection(language: AgentConfig["language"]): string {
   const capitalizedLanguage =
      language.charAt(0).toUpperCase() + language.slice(1);

   return `## Language & Communication Standards
**Primary Language**: Write exclusively in **${capitalizedLanguage}**
- Use natural, native-level fluency with appropriate idioms and expressions
- Employ cultural references and examples that resonate with ${capitalizedLanguage} speakers
- Apply region-specific spelling, grammar, and punctuation conventions

**Quality Requirements**:
- Write original content, not translations - think directly in ${capitalizedLanguage}
- Use terminology and concepts familiar to native speakers
- Explain foreign terms or technical jargon when necessary
- Maintain consistent tone and style throughout all interactions

**Cultural Adaptation**:
- Adjust communication style to match ${capitalizedLanguage} cultural norms
- Use appropriate levels of formality for the context
- Reference relevant cultural touchstones, holidays, or shared experiences when helpful
`;
}

// --- BRAND INTEGRATION SECTION ---
function getBrandIntegrationSection(
   brandIntegration: AgentConfig["brandIntegration"],
): string {
   let approachDetails = "";
   let sellingBehavior = "";

   switch (brandIntegration) {
      case "strict_guideline":
         approachDetails = `- Follow brand guidelines exactly with no creative interpretation
- Use only pre-approved messaging, terminology, and positioning
- Reference brand values and mission in every relevant interaction
- Maintain consistent brand voice across all communications`;
         sellingBehavior = `- Actively promote brand products/services when contextually appropriate
- Use approved sales messaging and value propositions
- Direct users toward brand solutions for their needs
- Emphasize brand differentiators and competitive advantages`;
         break;

      case "flexible_guideline":
         approachDetails = `- Use brand guidelines as foundation while adapting to context
- Blend brand voice with audience-appropriate communication
- Reference brand values naturally without forcing mentions
- Allow creative interpretation within brand boundaries`;
         sellingBehavior = `- Suggest brand solutions when genuinely relevant to user needs
- Balance helpful advice with subtle brand promotion
- Focus on value delivery while maintaining brand awareness
- Avoid pushy sales tactics - prioritize relationship building`;
         break;

      case "reference_only":
         approachDetails = `- Use brand knowledge as background context only
- Avoid direct brand mentions unless specifically relevant
- Focus on providing value without overt brand promotion
- Maintain professional neutrality while being brand-informed`;
         sellingBehavior = `- Do not actively sell or promote brand products/services
- Provide unbiased advice even if it doesn't favor the brand
- Only mention brand solutions if directly asked or highly relevant
- Prioritize user needs over brand promotion`;
         break;

      case "creative_blend":
         approachDetails = `- Integrate brand personality through storytelling and metaphors
- Use brand values as inspiration for creative communication
- Highlight unique brand characteristics through engaging narratives
- Balance brand representation with creative freedom`;
         sellingBehavior = `- Weave brand benefits into creative content naturally
- Use storytelling to demonstrate brand value without hard selling
- Create memorable brand experiences through innovative approaches
- Build brand affinity through engaging, value-driven interactions`;
         break;

      default:
         approachDetails = `- Integrate brand according to its unique style and requirements
- Balance brand representation with user value delivery`;
         sellingBehavior = `- Adapt selling approach based on brand strategy and user context`;
   }

   const formatIntegrationStyle = (style: string) =>
      style
         .split("_")
         .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
         .join(" ");

   return `## Brand Integration & Sales Approach
**Integration Style**: **${formatIntegrationStyle(brandIntegration)}**

**Brand Communication Strategy**:
${approachDetails}

**Sales & Promotion Behavior**:
${sellingBehavior}

**Key Reminders**:
- Always prioritize user value and genuine helpfulness
- Build trust through authentic, helpful interactions
- Adapt brand mentions to conversation context and user needs
- Maintain professional integrity while representing the brand
`;
}

// --- COMMUNICATION STYLE SECTION ---
function getCommunicationStyleSection(
   communicationStyle: AgentConfig["communicationStyle"],
): string {
   switch (communicationStyle) {
      case "first_person":
         return `## Communication Style: First Person Perspective

**Core Approach**:
- Write as the brand or individual, using "I", "me", and "my" throughout all content
- Present insights, experiences, and recommendations as if they are coming directly from the brand or expert
- Use a personal, authentic, and authoritative voice that builds trust and connection
- Share stories, lessons, and opinions from a first-hand point of view
- Take ownership of statements, advice, and brand promises

**Example Language Patterns**:
- "In my experience..."
- "I recommend..."
- "We've found that..."
- "My approach is..."
- "I believe..."

**Key Reminders**:
- Avoid referring to the brand or individual in the third person
- Maintain consistency in first-person language across all sections
- Use direct, confident statements that reflect personal expertise and accountability`;
      case "third_person":
         return `## Communication Style: Third Person Perspective

**Core Approach**:
- Communicate from an external viewpoint, referring to the brand or individual by name or as "they", "he", "she", or "it"
- Present information, insights, and recommendations as observations about the brand or expert
- Maintain a professional, objective, and slightly detached tone
- Attribute actions, beliefs, and expertise to the brand or individual, not the writer
- Use third-person pronouns and proper nouns consistently

**Example Language Patterns**:
- "[Brand] recommends..."
- "They have found that..."
- "According to [Brand], ..."
- "Their approach is..."
- "[Brand] believes..."

**Key Reminders**:
- Avoid using "I", "me", or "my" in any context
- Ensure all statements are attributed to the brand or individual, not the writer
- Maintain third-person perspective throughout the content`;
      default:
         return "";
   }
}

// --- ENHANCED PROMPT GENERATOR ---
export function generateAgentPrompt(
   agent: AgentConfig,
   opts: AgentPromptOptions,
): string {
   const sections = [
      getAIPersonaSection(agent),
      getContentTypeSection(agent.contentType, opts.contentRequest),
      getVoiceToneSection(agent.voiceTone),
      getTargetAudienceSection(agent.targetAudience),
      getFormattingStyleSection(agent.formattingStyle ?? "structured"),
      getLanguageSection(agent.language), // NEW
      getCommunicationStyleSection(agent.communicationStyle), // NEW
      getBrandIntegrationSection(agent.brandIntegration), // NEW
      getKnowledgeSection(opts.knowledgeChunks),
   ];

   // Add base prompt if exists (custom agent instructions)
   if (agent.basePrompt) {
      sections.push(`## Custom Agent Instructions\n\n${agent.basePrompt}`);
   }

   // Add additional context if provided
   if (opts.additionalContext) {
      sections.push(`## Additional Context\n\n${opts.additionalContext}`);
   }

   // Add specific requirements if provided
   if (opts.specificRequirements && opts.specificRequirements.length > 0) {
      sections.push(
         `## Specific Requirements\n\n${opts.specificRequirements.map((req: string) => `- ${req}`).join("\n")}`,
      );
   }

   // Final execution instruction
   sections.push(`## Content Creation Task

**Topic**: ${opts.contentRequest.topic}
**Brief**: ${opts.contentRequest.briefDescription}

Create content that perfectly matches all the above specifications. The content should be:
- Complete and ready to publish
- Optimized for the specified content type and length
- Written in the exact voice and tone specified
- Targeted precisely to the intended audience
- Formatted according to the specified style
- Rich with insights from the brand knowledge base
- Valuable and actionable for the reader

Begin creating the content now.`);

   return sections
      .filter((section) => section.trim().length > 0)
      .join(`\n\n${"=".repeat(50)}\n\n`);
}

// --- DEFAULT BASE PROMPT GENERATOR ---
export function generateDefaultBasePrompt(agent: AgentConfig): string {
   const sections = [
      getAIPersonaSection(agent),
      getContentTypeSection(agent.contentType, {
         briefDescription: "",
         topic: "",
      }),
      getVoiceToneSection(agent.voiceTone),
      getTargetAudienceSection(agent.targetAudience),
      getFormattingStyleSection(agent.formattingStyle ?? "structured"),
      getCommunicationStyleSection(agent.communicationStyle),
      getLanguageSection(agent.language), // Added language section
      getBrandIntegrationSection(agent.brandIntegration), // Added brand integration section
   ];
   if (agent.basePrompt) {
      sections.push(`## Custom Agent Instructions\n\n${agent.basePrompt}`);
   }

   return sections
      .filter((section) => section.trim().length > 0)
      .join(`\n\n${"=".repeat(50)}\n\n`);
}

// --- UTILITY FUNCTIONS ---
export function validateContentRequest(request: ContentRequest): string[] {
   const errors: string[] = [];

   if (!request.topic || request.topic.trim().length === 0) {
      errors.push("Topic is required");
   }

   if (
      !request.briefDescription ||
      request.briefDescription.trim().length === 0
   ) {
      errors.push("Brief description is required");
   }

   if (request.topic && request.topic.length > 200) {
      errors.push("Topic should be under 200 characters for clarity");
   }

   if (request.briefDescription && request.briefDescription.length > 1000) {
      errors.push("Brief description should be under 1000 characters");
   }

   return errors;
}

export function getPromptTokenEstimate(prompt: string): number {
   // More accurate estimation: 1 token ≈ 3.5 characters for mixed content
   return Math.ceil(prompt.length / 3.5);
}

export function optimizeKnowledgeChunks(
   chunks: KnowledgeChunk[],
   topic: string,
   briefDescription: string,
   maxTokens: number = 8000,
): KnowledgeChunk[] {
   // Always prioritize brand guidelines and voice documents
   const BRAND_PRIORITY_KEYWORDS = [
      "brand guidelines",
      "brand voice",
      "brand values",
      "company values",
      "brand personality",
      "tone of voice",
      "messaging guidelines",
      "brand story",
      "mission statement",
      "vision statement",
      "about us",
   ];

   // Score chunks based on brand importance and topic relevance
   const scoredChunks = chunks.map((chunk) => {
      let relevanceScore = 0;
      const topicLower = topic.toLowerCase();
      const descriptionLower = briefDescription.toLowerCase();
      const chunkText = (
         chunk.content +
         " " +
         (chunk.summary || "") +
         " " +
         (chunk.keywords?.join(" ") || "") +
         " " +
         (chunk.category || "") +
         " " +
         (chunk.source || "")
      ).toLowerCase();

      // CRITICAL: Brand guidelines get massive priority boost
      const isBrandGuideline = BRAND_PRIORITY_KEYWORDS.some(
         (keyword) =>
            chunkText.includes(keyword) ||
            chunk.category?.toLowerCase().includes("brand") ||
            chunk.source?.toLowerCase().includes("brand"),
      );

      if (isBrandGuideline) {
         relevanceScore += 100; // Huge boost for brand content
      }

      // Topic keyword matching
      if (chunk.keywords) {
         relevanceScore +=
            chunk.keywords.filter(
               (keyword: string) =>
                  topicLower.includes(keyword.toLowerCase()) ||
                  descriptionLower.includes(keyword.toLowerCase()),
            ).length * 15;
      }

      // Content relevance to topic
      const allSearchTerms = [
         ...topicLower.split(/\s+/),
         ...descriptionLower.split(/\s+/),
      ];
      relevanceScore +=
         allSearchTerms.filter(
            (word) => word.length > 3 && chunkText.includes(word),
         ).length * 8;

      // Category matching bonus
      if (chunk.category) {
         if (
            topicLower.includes(chunk.category.toLowerCase()) ||
            descriptionLower.includes(chunk.category.toLowerCase())
         ) {
            relevanceScore += 20;
         }
      }

      // Source type bonuses (some source types are more valuable)
      if (chunk.sourceType) {
         const sourceType = chunk.sourceType.toLowerCase();
         if (
            ["brand_guidelines", "style_guide", "brand_book"].includes(
               sourceType,
            )
         ) {
            relevanceScore += 50;
         } else if (
            ["case_study", "success_story", "testimonial"].includes(sourceType)
         ) {
            relevanceScore += 30;
         } else if (["blog_post", "article", "content"].includes(sourceType)) {
            relevanceScore += 20;
         }
      }

      return { ...chunk, relevanceScore };
   });

   // Sort by relevance (brand guidelines will naturally float to top)
   const sortedChunks = scoredChunks.sort(
      (a, b) => b.relevanceScore - a.relevanceScore,
   );

   // Always include top brand guidelines chunks, then fill with most relevant
   let currentTokens = 0;
   const optimizedChunks: KnowledgeChunk[] = [];

   // First pass: Include all high-priority brand content
   const brandChunks = sortedChunks.filter(
      (chunk) => chunk.relevanceScore >= 100,
   );
   for (const chunk of brandChunks) {
      const chunkTokens = getPromptTokenEstimate(
         chunk.content + (chunk.summary || ""),
      );
      if (currentTokens + chunkTokens <= maxTokens * 0.6) {
         // Reserve 60% tokens for brand content
         optimizedChunks.push(chunk);
         currentTokens += chunkTokens;
      }
   }

   // Second pass: Fill remaining space with topic-relevant content
   const remainingChunks = sortedChunks.filter(
      (chunk) => chunk.relevanceScore < 100,
   );
   for (const chunk of remainingChunks) {
      const chunkTokens = getPromptTokenEstimate(
         chunk.content + (chunk.summary || ""),
      );
      if (currentTokens + chunkTokens <= maxTokens) {
         optimizedChunks.push(chunk);
         currentTokens += chunkTokens;
      } else {
         break;
      }
   }

   return optimizedChunks;
}

// Helper function to get ALL knowledge chunks for an agent (not just 5)
export function getAllAgentKnowledgeChunks(
   allChunks: KnowledgeChunk[],
   agentId: string,
   contentRequest: ContentRequest,
): KnowledgeChunk[] {
   // This would typically be called from your database layer
   // Filter chunks by agentId only (isActive removed)
   const agentChunks = allChunks.filter((chunk) => chunk.agentId === agentId);

   // Optimize and return the best chunks for this specific request
   return optimizeKnowledgeChunks(
      agentChunks,
      contentRequest.topic,
      contentRequest.briefDescription,
   );
}

// --- AGENT ENHANCEMENT SUGGESTIONS ---
export interface AgentEnhancement {
   field: keyof AgentConfig;
   suggestion: string;
   priority: "high" | "medium" | "low";
}

export function generateAgentEnhancements(
   agent: AgentConfig,
): AgentEnhancement[] {
   const enhancements: AgentEnhancement[] = [];

   if (!agent.description || agent.description.length < 20) {
      enhancements.push({
         field: "description",
         suggestion:
            "Add a detailed description (50-200 words) explaining the agent's expertise, focus area, and unique value proposition.",
         priority: "high",
      });
   }

   if (!agent.basePrompt || agent.basePrompt.length < 50) {
      enhancements.push({
         field: "basePrompt",
         suggestion:
            "Add custom instructions (100-500 words) with specific guidelines, brand voice examples, or unique requirements for this agent.",
         priority: "medium",
      });
   }

   return enhancements;
}
