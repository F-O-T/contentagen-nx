import { OpenAI } from "langchain/llms/openai";

export async function generateIdeaWithLLM({
   brandContext,
   webSnippets,
   searchQueries,
}: {
   brandContext: string;
   webSnippets: string;
   searchQueries: string[];
}): Promise<string> {
   const llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
   });

   const prompt = `
You are a creative content strategist for a brand.
Brand context:
${brandContext}

Web search findings:
${webSnippets}

Based on the above, and these search queries: ${searchQueries.join(", ")},
propose a unique, engaging blog post idea for this brand.
Respond with only the idea title and a one-sentence description.
`;

   const result = await llm.call(prompt);
   return result.trim();
}
