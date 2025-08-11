export function creativeBlendPrompt({
   blacklistWords = [],
}: {
   blacklistWords?: string[];
}): string {
   return `# Brand Integration: Creative Blend

**How to Use the Brand Document:**
When you receive a brand document in the input, use it as creative inspiration and storytelling foundation:
1. **Extract creative elements:** Identify brand personality traits, values, and characteristics that can inspire story themes and metaphors
2. **Transform into narrative:** Convert brand features into story elements, characters, and plot devices
3. **Create authentic metaphors:** Use brand positioning and values to craft memorable analogies and comparisons
4. **Weave naturally:** Integrate brand elements so they feel like natural parts of the story, not forced insertions
5. **Show through story:** Demonstrate brand benefits and values through character actions and story outcomes rather than direct statements

**Brand Psychology & Creative Fusion:**

- **Authentic expression:** Brand personality emerges naturally through creative storytelling
- **Memorable differentiation:** Unique brand characteristics amplified through innovative narrative techniques
- **Emotional resonance:** Brand values become compelling story elements rather than corporate statements
- **Creative authority:** Brand expertise demonstrated through imaginative problem-solving approaches
- **Unexpected connections:** Brand benefits revealed through surprising analogies and metaphors

**Creative Integration Tactics:**

- **Metaphorical brand representation:** Use brand characteristics as inspiration for creative frameworks
- **Storytelling alchemy:** Transform brand features into narrative elements that entertain while educating
- **Personality amplification:** Let brand voice guide creative direction without constraining expression
- **Value demonstration through narrative:** Show brand benefits through character development and story outcomes
- **Creative problem-solving:** Use brand expertise to solve problems in unexpected, memorable ways

**Innovative Brand Communication:**

- **Narrative brand positioning:** Position brand as guide, mentor, or solution provider within stories
- **Creative authority building:** Demonstrate expertise through innovative approaches to common challenges
- **Imaginative benefit revelation:** Reveal product/service value through creative scenarios and use cases
- **Brand personality storytelling:** Let brand characteristics drive plot development and character interaction
- **Memorable brand experiences:** Create moments that stick in memory through creative presentation

**Sales Integration Through Creativity:**

- **Story-driven benefits:** Weave product advantages into compelling narratives without hard selling
- **Creative social proof:** Present testimonials and case studies through engaging story formats
- **Imaginative problem-solution dynamics:** Use creative scenarios to highlight pain points and resolutions
- **Brand affinity through entertainment:** Build emotional connection through valuable, engaging content
- **Creative urgency creation:** Generate action through compelling narrative tension rather than pressure tactics

**Advanced Creative Brand Fusion:**

- **Multi-layered storytelling:** Stories work on entertainment level while building brand authority
- **Creative expertise demonstration:** Show brand knowledge through innovative content approaches
- **Unexpected brand positioning:** Creative angles that differentiate from standard industry communication
- **Narrative brand consistency:** Maintain core brand message while allowing creative expression freedom
- **Memorable brand moments:** Create shareable, quotable content that reinforces brand identity

**Creative Language Patterns:**

- **Metaphorical brand language:** "Like a master chef, our approach to..."
- **Storytelling brand integration:** "Picture this scenario where..."
- **Creative authority positioning:** "Here's an unconventional approach that..."
- **Imaginative benefit framing:** "Imagine if you could..."
- **Brand personality narration:** Let brand voice guide creative story direction

**Implementation Guidelines:**

- **Creative brand canvas:** Use brand personality as inspiration for story themes and approaches
- **Narrative value delivery:** Ensure creative elements enhance rather than obscure brand message
- **Authentic creative expression:** Creativity should feel natural to brand personality, not forced
- **Memorable brand differentiation:** Creative approach distinguishes brand from conventional industry communication
- **Balanced integration:** Neither creativity nor brand message overwhelms the other

**Quality Creative Standards:**

- **Entertainment value:** Content engages audience while building brand affinity
- **Brand consistency:** Creative expression aligns with established brand personality and values
- **Memorable impact:** Creative elements make brand message more memorable and shareable
- **Authentic integration:** Brand presence feels natural within creative framework
- **Actionable creativity:** Creative content drives specific brand-related outcomes

**Creative Measurement:**

- **Engagement depth:** Creative content generates longer interaction times and higher sharing rates
- **Brand recall improvement:** Creative integration increases brand memory and recognition
- **Emotional connection metrics:** Content builds stronger brand affinity through creative storytelling
- **Differentiation effectiveness:** Creative approach distinguishes brand in competitive landscape
- **Conversion through creativity:** Creative content drives desired brand actions and outcomes

${blacklistWords.length
         ? `**Content Restrictions:**
Avoid using these words or phrases: ${blacklistWords.join(", ")}`
         : ""
      }
`;
}
