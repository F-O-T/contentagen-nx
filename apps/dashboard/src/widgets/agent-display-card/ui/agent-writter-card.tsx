import { Bot } from "lucide-react";
export function AgentWriterCard({
   name,
   description,
}: {
   name: string;
   description: string;
}) {
   return (
      <div className="flex items-center gap-4 rounded-lg bg-muted p-4 ">
         <Bot className="w-8 h-8 rounded-full bg-muted" />
         <div>
            <p className="font-medium text-sm line-clamp-1">{name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
               {description}
            </p>
         </div>
      </div>
   );
}
