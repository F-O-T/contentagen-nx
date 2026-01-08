import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Cpu, Sparkles, Zap } from "lucide-react";
import {
   type ChatModel,
   setChatModel,
   useChatState,
} from "../context/chat-context";

const models = [
   {
      value: "grok-4.1-fast" as const,
      label: "Grok 4.1 Fast",
      icon: Zap,
      description: "Fast & capable",
   },
   {
      value: "glm-4.7" as const,
      label: "GLM 4.7",
      icon: Cpu,
      description: "Balanced performance",
   },
   {
      value: "mistral-small-creative" as const,
      label: "Mistral Small",
      icon: Sparkles,
      description: "Creative writing",
   },
] as const;

const defaultModel = models[0];

export function ChatModelSelect() {
   const { model } = useChatState();
   const currentModel = models.find((m) => m.value === model) ?? defaultModel;
   const CurrentIcon = currentModel.icon;

   return (
      <Select
         onValueChange={(value) => {
            if (value) {
               setChatModel(value as ChatModel);
            }
         }}
         value={model}
      >
         <SelectTrigger className="h-7 w-auto gap-1.5 text-xs" size="sm">
            <SelectValue>
               <CurrentIcon className="size-3.5" />
               {currentModel.label}
            </SelectValue>
         </SelectTrigger>
         <SelectContent>
            {models.map(({ value, label, icon: Icon, description }) => (
               <SelectItem
                  className="flex-col items-start"
                  key={value}
                  value={value}
               >
                  <div className="flex items-center gap-1.5">
                     <Icon className="size-3.5" />
                     <span>{label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                     {description}
                  </span>
               </SelectItem>
            ))}
         </SelectContent>
      </Select>
   );
}
