import ReactMarkdown from "react-markdown";
export function Markdown({ content }: { content: string }) {
   return (
      <div className="prose prose-sm max-w-none  dark:prose-invert border-primary/30 rounded-lg border bg-muted p-2 overflow-hidden">
         <ReactMarkdown>{content}</ReactMarkdown>
      </div>
   );
}
