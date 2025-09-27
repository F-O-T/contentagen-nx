import ReactMarkdown from "react-markdown";
import { ScrollArea } from "./scroll-area";
export function Markdown({ content }: { content: string }) {
   return (
      <div className="prose h-full prose-sm max-w-none  dark:prose-invert border-primary/30 rounded-lg border bg-muted p-2 overflow-hidden">
         <ScrollArea className="h-full">
            <ReactMarkdown>{content}</ReactMarkdown>
         </ScrollArea>
      </div>
   );
}
