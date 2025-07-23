import { createOpenrouterClient } from "@packages/openrouter/client";
import { generateOpenRouterText } from "@packages/openrouter/helpers";

export async function chunkText(
  text: string = "",
  maxLength = 2000,
  overlap = 200,
  apiKey?: string,
): Promise<string[]> {
  if (maxLength <= 0) throw new Error("maxLength must be a positive integer");
  if (!apiKey) throw new Error("OpenRouter API key is required");
  const prompt = `You are an expert at splitting long texts into coherent, context-preserving chunks for downstream processing. Given the following text, split it into chunks of approximately ${maxLength} characters, making sure not to break sentences or paragraphs. Each chunk should be as close as possible to the target size, but always preserve the integrity of sentences and paragraphs. If possible, add a small overlap (e.g., last sentence or ${overlap} characters) between consecutive chunks to maintain context.\n\nReturn the result as a JSON array of strings, where each string is a chunk of the original text.\n\nText to chunk:\n${text}`;
  const client = createOpenrouterClient(apiKey);
  const response = await generateOpenRouterText(client, {
    prompt,
    maxTokens: 4096,
    temperature: 0.2,
  });
  let chunks: string[] = [];
  try {
    const match = response.text.match(/\[.*\]/s);
    if (match) {
      chunks = JSON.parse(match[0]);
    } else {
      throw new Error("No JSON array found in LLM response");
    }
  } catch (err) {
    throw new Error(`Failed to parse LLM chunking response: ${err}`);
  }
  return chunks;
}
