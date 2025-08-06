import { ChromaClient as InternalChromaCLient } from "chromadb";
export const createChromaClient = (baseUrl: string): InternalChromaCLient => {
   return new InternalChromaCLient({
      path: baseUrl,
   });
};

export type ChromaClient = ReturnType<typeof createChromaClient>;
