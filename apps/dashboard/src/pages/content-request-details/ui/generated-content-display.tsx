import { useState } from "react";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
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
import {
   FileText,
   Eye,
   Sparkles,
   MoreVertical,
   Copy,
   Download,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

function GenerationLoadingState() {
   return (
      <div className="text-center py-12">
         <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
            <div className="w-16 h-16 mx-auto mb-6"></div>
         </div>
         <div className="space-y-3">
            <p className="text-lg font-medium text-primary">
               AI Content Generation in Progress
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
               Our AI agent is crafting your content. This may take a few
               minutes depending on the complexity and length requested.
            </p>
            <div className="flex justify-center space-x-1 mt-4">
               <div
                  className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
               ></div>
               <div
                  className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
               ></div>
               <div
                  className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
               ></div>
            </div>
         </div>
      </div>
   );
}

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
      <Card className={`h-fit   ${isGenerating ? "animate-pulse" : ""}`}>
         <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               Generated Content
               {isGenerating && (
                  <div className="flex items-center gap-1 text-primary">
                     <Sparkles className="h-4 w-4 animate-spin" />
                     <span className="text-sm font-normal">Generating...</span>
                  </div>
               )}
            </CardTitle>
            <CardDescription>
               Your AI-generated content with export and copy options
            </CardDescription>

            {generatedContent && (
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           size="sm"
                           variant="outline"
                           disabled={isExporting}
                        >
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
               </CardAction>
            )}
         </CardHeader>
         <CardContent className="bg-muted mx-4 rounded-lg py-4">
            {!generatedContent && !isGenerating ? (
               <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No content generated yet</p>
                  <p className="text-sm">
                     Content will appear here once the request is approved and
                     generated.
                  </p>
               </div>
            ) : !generatedContent && isGenerating ? (
               <GenerationLoadingState />
            ) : (
               <div className="space-y-4">
                  <div className="text-sm">
                     {showFullContent ? (
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                           {generatedContent?.body || ""}
                        </ReactMarkdown>
                     ) : (
                        <div className="relative">
                           <ReactMarkdown
                        
                 
                           >
                              {(generatedContent?.body?.length || 0) > 2000
                                 ? generatedContent?.body?.substring(0, 2000) +
                                   "..."
                                 : generatedContent?.body || ""}
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
