import { parse, renderToHtml } from "@f-o-t/markdown";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Share2 } from "lucide-react";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { RelatedPostsDisplay } from "./related-posts-display";
import { TableOfContents } from "./table-of-contents";

type SharedContentViewProps = {
   contentId: string;
};

function calculateReadTime(content: string): number {
   // Average reading speed: 200 words per minute
   const words = content.trim().split(/\s+/).length;
   return Math.max(1, Math.ceil(words / 200));
}

function SharedContentViewSkeleton() {
   return (
      <div className="min-h-screen bg-background">
         <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
               {/* Main content skeleton */}
               <article className="max-w-3xl">
                  <header className="mb-8">
                     <Skeleton className="h-10 w-3/4 mb-4" />
                     <Skeleton className="h-5 w-full mb-6" />
                     <div className="flex items-center gap-3 mb-8">
                        <Skeleton className="size-10 rounded-full" />
                        <div>
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-24 mt-1" />
                        </div>
                     </div>
                     <Skeleton className="w-full aspect-[2/1] rounded-xl" />
                  </header>
                  <div className="space-y-4">
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-3/4" />
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-5/6" />
                  </div>
               </article>

               {/* Sidebar skeleton */}
               <aside className="hidden lg:block">
                  <div className="sticky top-8 space-y-4">
                     <Skeleton className="h-5 w-24" />
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-5/6" />
                     </div>
                  </div>
               </aside>
            </div>
         </div>
      </div>
   );
}

function SharedContentViewError() {
   return (
      <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="text-center px-4">
            <h1 className="text-2xl font-bold mb-2">Conteúdo não encontrado</h1>
            <p className="text-muted-foreground">
               Este conteúdo não está disponível ou não foi compartilhado
               publicamente.
            </p>
         </div>
      </div>
   );
}

function SharedContentViewContent({ contentId }: SharedContentViewProps) {
   const trpc = useTRPC();

   const { data: content } = useSuspenseQuery(
      trpc.content.getSharedContent.queryOptions({ id: contentId }),
   );

   const authorInitials = content.writer?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

   const formattedDate = new Date(content.createdAt).toLocaleDateString(
      "pt-BR",
      {
         day: "numeric",
         month: "long",
         year: "numeric",
      },
   );

   const readTime = useMemo(
      () => calculateReadTime(content.body || ""),
      [content.body],
   );

   const handleShare = async () => {
      const shareUrl = window.location.href;
      if (navigator.share) {
         try {
            await navigator.share({
               title: content.meta.title,
               text: content.meta.description,
               url: shareUrl,
            });
         } catch {
            // User cancelled or share failed, fallback to clipboard
         }
      }
      // Always copy to clipboard as fallback
      await navigator.clipboard.writeText(shareUrl);
   };

   return (
      <div className="min-h-screen bg-background">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            {/* Back link */}
            <Button asChild className="mb-8" size="sm" variant="ghost">
               <a href="https://contentta.com">
                  <ArrowLeft className="size-4" />
                  Voltar ao início
               </a>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12">
               {/* Main content */}
               <article className="max-w-3xl">
                  {/* Header */}
                  <header className="mb-8">
                     <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                        {content.meta.title}
                     </h1>
                     {content.meta.description && (
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                           {content.meta.description}
                        </p>
                     )}

                     {/* Author and meta - horizontal layout */}
                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {content.writer && (
                           <>
                              <Avatar className="size-8">
                                 <AvatarImage
                                    alt={content.writer.name}
                                    src={
                                       content.writer.avatar ??
                                       content.writer.profilePhotoUrl ??
                                       undefined
                                    }
                                 />
                                 <AvatarFallback className="text-xs">
                                    {authorInitials}
                                 </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">
                                 {content.writer.name}
                              </span>
                              <span className="text-muted-foreground/50">
                                 ·
                              </span>
                           </>
                        )}
                        <span>{formattedDate}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="flex items-center gap-1">
                           <Clock className="size-3.5" />
                           {readTime} min de leitura
                        </span>
                     </div>

                     {/* Keywords */}
                     {content.meta.keywords &&
                        content.meta.keywords.length > 0 && (
                           <div className="flex gap-2 flex-wrap mt-4">
                              {content.meta.keywords
                                 .slice(0, 5)
                                 .map((keyword) => (
                                    <Badge
                                       className="text-xs"
                                       key={keyword}
                                       variant="secondary"
                                    >
                                       {keyword}
                                    </Badge>
                                 ))}
                           </div>
                        )}
                  </header>

                  {/* Featured Image */}
                  {content.imageUrl && (
                     <figure className="mb-10 -mx-4 sm:mx-0">
                        <img
                           alt={content.meta.title}
                           className="w-full aspect-[2/1] object-cover rounded-none sm:rounded-xl bg-muted"
                           src={content.imageUrl}
                        />
                     </figure>
                  )}

                  {/* Content Body */}
                  <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-medium prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-7 prose-li:leading-7 prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-pre:bg-muted prose-code:before:content-none prose-code:after:content-none prose-img:rounded-xl">
                     <MarkdownContent content={content.body || ""} />
                  </div>

                  {/* Footer */}
                  <footer className="mt-16 pt-8 border-t">
                     {/* Author card */}
                     {content.writer && (
                        <div className="flex items-start gap-4 mb-8">
                           <Avatar className="size-14">
                              <AvatarImage
                                 alt={content.writer.name}
                                 src={
                                    content.writer.avatar ??
                                    content.writer.profilePhotoUrl ??
                                    undefined
                                 }
                              />
                              <AvatarFallback className="text-lg">
                                 {authorInitials}
                              </AvatarFallback>
                           </Avatar>
                           <div>
                              <p className="font-semibold text-lg">
                                 {content.writer.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                 {content.writer.description ||
                                    "Assistente de Escrita IA"}
                              </p>
                           </div>
                        </div>
                     )}

                     {/* Related Posts */}
                     {content.relatedPosts &&
                        content.relatedPosts.length > 0 && (
                           <RelatedPostsDisplay
                              className="mt-8"
                              posts={content.relatedPosts}
                           />
                        )}

                     <p className="text-sm text-muted-foreground text-center mt-12">
                        Criado com{" "}
                        <a
                           className="font-medium text-primary hover:underline"
                           href="https://contentta.com"
                           rel="noopener noreferrer"
                           target="_blank"
                        >
                           Contentta
                        </a>
                     </p>
                  </footer>
               </article>

               {/* Sidebar with TOC */}
               <aside className="hidden lg:block">
                  <div className="sticky top-8 space-y-6">
                     <TableOfContents
                        content={content.body || ""}
                        title="Nesta página"
                     />

                     {/* Share section */}
                     <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                           Compartilhar artigo
                        </h3>
                        <Button onClick={handleShare} size="sm" variant="ghost">
                           <Share2 className="size-4" />
                           Copiar link
                        </Button>
                     </div>
                  </div>
               </aside>
            </div>
         </div>
      </div>
   );
}

// Simple markdown to HTML converter for read-only display
function MarkdownContent({ content }: { content: string }) {
   const html = convertMarkdownToHtml(content);

   return (
      <div
         className="markdown-content"
         // biome-ignore lint/security/noDangerouslySetInnerHtml: Controlled markdown content
         dangerouslySetInnerHTML={{ __html: html }}
      />
   );
}

function convertMarkdownToHtml(markdown: string): string {
   const result = parse(markdown);
   if (!result.success) {
      return markdown; // Fallback to raw content on parse error
   }
   return renderToHtml(result.data, {
      externalLinksNewTab: true,
      sanitizeHtml: true,
   });
}

export function SharedContentView({ contentId }: SharedContentViewProps) {
   return (
      <ErrorBoundary FallbackComponent={SharedContentViewError}>
         <Suspense fallback={<SharedContentViewSkeleton />}>
            <SharedContentViewContent contentId={contentId} />
         </Suspense>
      </ErrorBoundary>
   );
}
