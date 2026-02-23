import { Checkbox } from "@packages/ui/components/checkbox";
import { cn } from "@packages/ui/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import { CheckCircle2, Lock } from "lucide-react";
import type React from "react";
import { useCallback } from "react";
import type { TaskDefinition } from "../task-definitions";

interface QuickStartTaskProps {
   task: TaskDefinition;
   isCompleted: boolean;
   isLocked: boolean;
   isAutoDetected: boolean;
   onComplete: (taskId: string) => void;
}

export function QuickStartTask({
   task,
   isCompleted,
   isLocked,
   isAutoDetected,
   onComplete,
}: QuickStartTaskProps) {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   const handleClick = useCallback(() => {
      if (isLocked || isCompleted) return;
      navigate({ to: task.route, params: { slug, teamSlug } });
   }, [isLocked, isCompleted, navigate, slug, teamSlug, task.route]);

   const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
         if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
         }
      },
      [handleClick],
   );

   const handleCheckboxChange = useCallback(
      (checked: boolean | "indeterminate") => {
         if (checked === true && !isCompleted && !isLocked) {
            onComplete(task.id);
         }
      },
      [isCompleted, isLocked, onComplete, task.id],
   );

   return (
      // biome-ignore lint/a11y/useSemanticElements: Div used for flexible layout with conditional interactions
      <div
         aria-disabled={isLocked}
         className={cn(
            "flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors w-full",
            isLocked && "opacity-50 cursor-not-allowed",
            !isLocked && !isCompleted && "hover:bg-accent cursor-pointer",
            isCompleted && "opacity-60",
         )}
         onClick={handleClick}
         onKeyDown={handleKeyDown}
         role="button"
         tabIndex={isLocked ? -1 : 0}
      >
         {/* Checkbox / checkmark / lock indicator */}
         <div className="mt-0.5 shrink-0">
            {isLocked ? (
               <Lock className="size-4 text-muted-foreground" />
            ) : isCompleted ? (
               <CheckCircle2 className="size-4 text-primary" />
            ) : isAutoDetected ? (
               /* Auto-detected tasks show an empty circle until completed */
               <div className="size-4 rounded-full border-2 border-muted-foreground/40" />
            ) : (
               <Checkbox
                  checked={isCompleted}
                  onCheckedChange={handleCheckboxChange}
                  onClick={(e) => e.stopPropagation()}
               />
            )}
         </div>

         {/* Task text */}
         <div className="min-w-0 flex-1">
            <p
               className={cn(
                  "text-sm font-medium leading-tight",
                  isCompleted && "line-through text-muted-foreground",
               )}
            >
               {task.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
               {task.description}
            </p>
         </div>
      </div>
   );
}
