import { sdk } from "../sdk";
import type { ContentSelect } from "@packages/database/schemas/content";

// Mock agent ID for development - replace with real agent ID
const AGENT_ID = "a1a76caa-d401-4908-b6e6-f29157be5130";

// Transform ContentSelect to match blog post structure
export interface BlogPost {
   id: string;
   title: string;
   content: string;
   description: string;
   slug: string;
   pubDate: Date;
   heroImage?: string;
   author?: string;
}

export function transformContentToBlogPost(content: ContentSelect): BlogPost {
   return {
      id: content.id,
      title: content.meta?.title || "Untitled",
      content: content.body,
      description:
         content.meta?.topics?.join(", ") ||
         content.request.description ||
         "No description available",
      slug: content.meta?.slug || content.id,
      pubDate: new Date(content.createdAt),
      heroImage: `https://picsum.photos/720/360?random=${content.id.slice(0, 8)}`, // Mock image
      author: "ContentaGen", // Mock author
   };
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
   try {
      const contents = await sdk.listContentByAgent({
         agentId: AGENT_ID,
         limit: 50,
      });

      return contents.map(transformContentToBlogPost);
   } catch (error) {
      console.error("Failed to fetch blog posts:", error);
      return [];
   }
}

export async function getBlogPostBySlug(
   slug: string,
): Promise<BlogPost | null> {
   try {
      // For now, we'll get all posts and filter by slug since the SDK doesn't have a direct slug search
      const contents = await sdk.listContentByAgent({
         agentId: AGENT_ID,
         limit: 100,
      });

      const content = contents.find((c) => c.meta?.slug === slug);
      return content ? transformContentToBlogPost(content) : null;
   } catch (error) {
      console.error("Failed to fetch blog post:", error);
      return null;
   }
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
   try {
      const content = await sdk.getContentById({ id });
      return transformContentToBlogPost(content);
   } catch (error) {
      console.error("Failed to fetch blog post by ID:", error);
      return null;
   }
}
