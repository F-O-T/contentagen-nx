import type { AgentSelect } from "@api/schemas/agent-schema";

export function getContentTypeSection(
   contentType: AgentSelect["contentType"],
): string {
   switch (contentType) {
      case "blog_posts":
         return `## Content Type: Blog Post

**Objective**: Create a comprehensive, SEO-optimized blog article.

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

**Objective**: Create engaging, platform-optimized social media content.

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

**Objective**: Write high-converting marketing copy.

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

**Objective**: Create clear, comprehensive technical documentation.

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
         return `## Content Type: General Content\nCreate comprehensive content.`;
   }
}
