import {
   Avatar,
   AvatarImage,
   AvatarFallback,
} from "@packages/ui/components/avatar";

export function AgentWriterCard({
   name,
   description,
   photo,
}: {
   name: string;
   description: string;
   photo?: string;
}) {
   return (
      <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
         <div className="relative">
            <Avatar className="w-8 h-8">
               <AvatarImage src={photo} alt={name} />
               <AvatarFallback className="bg-muted text-muted-foreground">
                  {name.charAt(0).toUpperCase()}
               </AvatarFallback>
            </Avatar>
         </div>
         <div className="flex-1">
            <p className="font-medium text-sm line-clamp-1">{name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
               {description}
            </p>
         </div>
      </div>
   );
}
