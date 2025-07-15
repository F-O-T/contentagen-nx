import { ChromaClient } from "chromadb";

export const createChromaClient = (baseUrl: string): ChromaClient => {
   return new ChromaClient({ path: baseUrl });
};
