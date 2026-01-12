import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { Crown, ListChecks, Pencil } from "lucide-react";
import { Feature, useFeatureAccess } from "@/hooks/use-feature-access";
import {
   type ChatMode,
   setChatMode,
   useChatState,
} from "../context/chat-context";

const modes = [
   {
      value: "plan" as const,
      label: "Planejar",
      icon: ListChecks,
      description: "Pesquisa e criação de planos",
   },
   {
      value: "writer" as const,
      label: "Escritor",
      icon: Pencil,
      description: "Modo de edição direta",
   },
] as const;

const defaultMode = modes[0];

export function ChatModeSelect() {
   const { mode, phase, executionState } = useChatState();
   const { hasFeature } = useFeatureAccess();
   const hasPlanModeFeature = hasFeature(Feature.CHAT_PLAN_MODE);

   const currentMode = modes.find((m) => m.value === mode) ?? defaultMode;
   const CurrentIcon = currentMode.icon;

   // Disable during streaming or execution
   const isDisabled = phase === "streaming" || executionState.isExecuting;

   const handleValueChange = (value: string) => {
      if (!value || isDisabled) return;
      // Prevent switching to plan mode without feature access
      if (value === "plan" && !hasPlanModeFeature) return;
      setChatMode(value as ChatMode);
   };

   const selectContent = (
      <Select
         disabled={isDisabled}
         onValueChange={handleValueChange}
         value={mode}
      >
         <SelectTrigger className="h-7 gap-1.5 text-xs" size="sm">
            <SelectValue>
               <CurrentIcon className="size-3.5" />
               {currentMode.label}
            </SelectValue>
         </SelectTrigger>
         <SelectContent>
            {modes.map(({ value, label, icon: Icon, description }) => {
               const isPlanLocked = value === "plan" && !hasPlanModeFeature;

               return (
                  <SelectItem
                     className="flex-col items-start"
                     disabled={isPlanLocked}
                     key={value}
                     value={value}
                  >
                     <div className="flex items-center gap-1.5">
                        <Icon className="size-3.5" />
                        <span>{label}</span>
                        {isPlanLocked && (
                           <Crown className="size-3 text-amber-500 ml-1" />
                        )}
                     </div>
                     <span className="text-[10px] text-muted-foreground">
                        {isPlanLocked ? "Disponível no plano Pro" : description}
                     </span>
                  </SelectItem>
               );
            })}
         </SelectContent>
      </Select>
   );

   // Wrap in tooltip when disabled to explain why
   if (isDisabled) {
      return (
         <Tooltip>
            <TooltipTrigger asChild>
               <div>{selectContent}</div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
               <p>
                  {executionState.isExecuting
                     ? "Não é possível alternar modos durante execução do plano"
                     : "Não é possível alternar modos enquanto o agente está respondendo"}
               </p>
            </TooltipContent>
         </Tooltip>
      );
   }

   return selectContent;
}
