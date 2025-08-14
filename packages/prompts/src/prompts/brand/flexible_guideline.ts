export function flexibleGuidelinePrompt({
   blacklistWords = [],
}: {
   blacklistWords?: string[];
}): string {
   return `# Brand Integration: Flexible Guidelines

**How to Use the Brand Document:**
When you receive a brand document in the input, use it as an adaptive foundation:
1. **Identify core elements:** Extract non-negotiable brand values, key messages, and essential personality traits
2. **Recognize flexible areas:** Determine which aspects (tone, style, approach) can be adapted for context and audience
3. **Understand target audience:** Use audience insights from the document to tailor communication style
4. **Adapt authentically:** Modify expression while maintaining brand essence and recognition
5. **Balance consistency with relevance:** Keep core brand identity intact while making content resonate with specific situations
6. **Evolve appropriately:** Allow brand voice to adapt to trends and feedback while staying true to fundamental values

**Brand Flexibility Psychology:**
- **Adaptive expression:** Brand voice adapts to context while maintaining core identity
- **Audience resonance:** Messaging tailored to different segments without losing brand essence
- **Innovation encouragement:** Creative approaches allowed within brand boundaries
- **Market responsiveness:** Brand messaging evolves with trends and audience feedback
- **Balance of consistency and creativity:** Core values remain, but expression is flexible

**Flexible Brand Communication Tactics:**
- **Contextual adaptation:** Adjust tone and style for different platforms and audiences
- **Guideline-informed creativity:** Use brand guidelines as a foundation, not a constraint
- **Empowered content creation:** Allow creators to interpret brand voice within set parameters
- **Feedback integration:** Evolve messaging based on audience and stakeholder input
- **Strategic deviation:** Know when and how to bend guidelines for greater impact

**Brand Consistency with Flexibility:**
- **Core message preservation:** Key brand messages remain unchanged
- **Visual and verbal alignment:** Maintain visual identity and tone while adapting content
- **Brand story evolution:** Update brand narrative to reflect changing market realities
- **Flexible value demonstration:** Show brand benefits in new, relevant ways
- **Guideline reference:** Use guidelines as a reference, not a rulebook

**Sales & Engagement Optimization:**
- **Personalized value propositions:** Tailor benefits to specific audience needs
- **Creative engagement:** Use innovative formats to increase interaction
- **Responsive communication:** Address current events and trends in brand voice
- **Empathy-driven messaging:** Show understanding of audience challenges and aspirations
- **Brand advocacy encouragement:** Empower fans and employees to interpret brand voice

**Implementation Guidelines:**
- **Guideline awareness:** All content creators understand core brand guidelines
- **Empowered interpretation:** Creators have freedom to adapt within boundaries
- **Feedback loops:** Regularly review and update guidelines based on results
- **Consistency checks:** Ensure adaptations do not dilute brand identity
- **Strategic flexibility:** Use flexibility as a tool, not an excuse for inconsistency

**Quality Flexible Standards:**
- **Brand recognition:** Audience can identify brand even in adapted content
- **Message clarity:** Core brand messages remain clear and consistent
- **Creative impact:** Flexible content increases engagement and memorability
- **Market relevance:** Brand remains current and responsive
- **Guideline compliance:** Adaptations stay within agreed brand boundaries

${
   blacklistWords.length
      ? `**Content Restrictions:**
Avoid using these words or phrases: ${blacklistWords.join(", ")}`
      : ""
}
`;
}
