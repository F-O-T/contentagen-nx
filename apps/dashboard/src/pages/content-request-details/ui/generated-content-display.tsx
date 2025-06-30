import { useState } from "react";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { FileText, Eye, Sparkles, MoreVertical, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

// Custom components for better markdown rendering
const MarkdownComponents: Components = {
   h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-4 text-foreground border-b border-border pb-2">{children}</h1>
   ),
   h2: ({ children }) => (
      <h2 className="text-xl font-semibold mb-3 text-foreground">{children}</h2>
   ),
   h3: ({ children }) => (
      <h3 className="text-lg font-medium mb-2 text-foreground">{children}</h3>
   ),
   p: ({ children }) => (
      <p className="mb-4 text-foreground leading-relaxed">{children}</p>
   ),
   ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 text-foreground space-y-1">{children}</ul>
   ),
   ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 text-foreground space-y-1">{children}</ol>
   ),
   li: ({ children }) => (
      <li className="text-foreground">{children}</li>
   ),
   blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 mb-4 text-muted-foreground italic">{children}</blockquote>
   ),
   code: ({ children }) => (
      <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">{children}</code>
   ),
   pre: ({ children }) => (
      <pre className="bg-muted p-4 rounded mb-4 overflow-x-auto text-sm font-mono text-foreground">{children}</pre>
   ),
   a: ({ href, children }) => (
      <a href={href} className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer">{children}</a>
   ),
   strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
   ),
   em: ({ children }) => (
      <em className="italic text-foreground">{children}</em>
   ),
   hr: () => (
      <hr className="border-border my-6" />
   ),
   table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
         <table className="min-w-full border border-border">{children}</table>
      </div>
   ),
   thead: ({ children }) => (
      <thead className="bg-muted">{children}</thead>
   ),
   tbody: ({ children }) => (
      <tbody>{children}</tbody>
   ),
   tr: ({ children }) => (
      <tr className="border-b border-border">{children}</tr>
   ),
   th: ({ children }) => (
      <th className="px-4 py-2 text-left font-medium text-foreground">{children}</th>
   ),
   td: ({ children }) => (
      <td className="px-4 py-2 text-foreground">{children}</td>
   ),
};

interface GeneratedContentDisplayProps {
   generatedContent?: {
      body: string;
      wordsCount?: number;
      readTimeMinutes?: number;
      tags?: string[];
   } | null;
   isExporting: boolean;
   isGenerating?: boolean;
   onExport: (format: "html" | "markdown" | "mdx") => void;
}

export function GeneratedContentDisplay({
   generatedContent,
   isExporting,
   isGenerating = false,
   onExport,
}: GeneratedContentDisplayProps) {
   const [showFullContent, setShowFullContent] = useState(false);

   const handleCopyContent = () => {
      if (generatedContent?.body) {
         navigator.clipboard.writeText(generatedContent.body);
         toast.success("Content copied to clipboard");
      }
   };

   return (
      <Card className={`h-fit   ${isGenerating ? 'animate-pulse' : ''}`}>
         <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                     Generated Content
                     {isGenerating && (
                        <div className="flex items-center gap-1 text-blue-600">
                           <Sparkles className="h-4 w-4 animate-spin" />
                           <span className="text-sm font-normal">Generating...</span>
                        </div>
                     )}
                  </CardTitle>
                  <CardDescription>
                     Your AI-generated content with export and copy options
                  </CardDescription>
               </div>
               {generatedContent && (
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" disabled={isExporting}>
                           <MoreVertical className="h-4 w-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleCopyContent}>
                           <Copy className="h-4 w-4 mr-2" />
                           Copy Content
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport("markdown")}>
                           <Download className="h-4 w-4 mr-2" />
                           Export as Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport("mdx")}>
                           <Download className="h-4 w-4 mr-2" />
                           Export as MDX
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport("html")}>
                           <Download className="h-4 w-4 mr-2" />
                           Export as HTML
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               )}
            </div>
         </CardHeader>
         <CardContent className="bg-muted mx-4 rounded-lg py-4">
            {!generatedContent && !isGenerating ? (
               <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No content generated yet</p>
                  <p className="text-sm">
                     Content will appear here once the request is approved and generated.
                  </p>
               </div>
            ) : !generatedContent && isGenerating ? (
               <div className="text-center py-12">
                  <div className="relative">
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                     </div>
                     <div className="w-16 h-16 mx-auto mb-6"></div>
                  </div>
                  <div className="space-y-3">
                     <p className="text-lg font-medium text-blue-600">AI Content Generation in Progress</p>
                     <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Our AI agent is crafting your content. This may take a few minutes depending on the complexity and length requested.
                     </p>
                     <div className="flex justify-center space-x-1 mt-4">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="space-y-4">
                  <div className="text-sm">
                     {showFullContent ? (
                        <ReactMarkdown 
                           rehypePlugins={[rehypeRaw]}
                           components={MarkdownComponents}
                        >
                           {generatedContent?.body || ''}
                        </ReactMarkdown>
                     ) : (
                        <div className="relative">
                           <ReactMarkdown 
                              rehypePlugins={[rehypeRaw]}
                              components={MarkdownComponents}
                           >
                              {(generatedContent?.body?.length || 0) > 2000 
                                 ? generatedContent?.body?.substring(0, 2000) + '...'
                                 : generatedContent?.body || ''
                              }
                           </ReactMarkdown>
                           {(generatedContent?.body?.length || 0) > 2000 && (
                              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                           )}
                        </div>
                     )}
                  </div>
                  
               </div>
            )}
         </CardContent>
         <CardFooter>
            {(generatedContent?.body?.length || 0) > 2000 && (
                     <Button
                        variant="outline"
                        className="w-full"
                      
                        onClick={() => setShowFullContent(!showFullContent)}
                     >
                        <Eye className="h-4 w-4 mr-2" />
                        {showFullContent ? "Show Less" : "Show More"}
                     </Button>
                  )}
         </CardFooter>
      </Card>
   );
}
