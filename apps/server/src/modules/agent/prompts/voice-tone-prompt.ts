import type { AgentSelect } from "@api/schemas/agent-schema";

export function getVoiceToneSection(
   voiceTone: AgentSelect["voiceTone"],
): string {
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
