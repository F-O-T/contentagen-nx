"use client";

import { cn } from "@packages/ui/lib/utils";
import { ArrowRight } from "lucide-react";

type RelatedPost = {
   id: string;
   title: string;
   description?: string | null;
   slug?: string | null;
   imageUrl?: string | null;
};

type RelatedPostsDisplayProps = {
   posts: RelatedPost[];
   className?: string;
};

export function RelatedPostsDisplay({
   posts,
   className,
}: RelatedPostsDisplayProps) {
   if (!posts || posts.length === 0) {
      return null;
   }

   return (
      <section className={cn("", className)}>
         <h3 className="text-lg font-semibold mb-4">Leia também</h3>
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
               <a
                  className="group block rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-colors"
                  href={`/share/${post.id}`}
                  key={post.id}
               >
                  {post.imageUrl && (
                     <div className="aspect-[16/9] bg-muted overflow-hidden">
                        <img
                           alt={post.title}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                           src={post.imageUrl}
                        />
                     </div>
                  )}
                  <div className="p-4">
                     <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                     </h4>
                     {post.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                           {post.description}
                        </p>
                     )}
                     <span className="inline-flex items-center gap-1 text-xs text-primary mt-3 group-hover:gap-2 transition-all">
                        Ler artigo
                        <ArrowRight className="size-3" />
                     </span>
                  </div>
               </a>
            ))}
         </div>
      </section>
   );
}
