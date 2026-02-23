import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Progress } from "@packages/ui/components/progress";
import { useParams } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Rocket, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSafeLocalStorage } from "@/hooks/use-local-storage";
import { useCompleteTask } from "../hooks/use-complete-task";
import { useOnboardingStatus } from "../hooks/use-onboarding-status";
import {
   getProductLabel,
   getTasksForProducts,
   type ProductId,
   SDK_INSTALL_TASK_IDS,
   type TaskDefinition,
} from "../task-definitions";
import { QuickStartTask } from "./quick-start-task";

const CHECKLIST_HIDDEN_STORAGE_KEY = "contentta:checklist_hidden";

/**
 * Quick Start checklist card for the home page.
 * Shows onboarding tasks grouped by product with progress tracking.
 * Only renders when onboarding is completed and tasks remain.
 */
export function QuickStartChecklist() {
   const { data: status } = useOnboardingStatus();
   const completeTaskMutation = useCompleteTask();
   const { slug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const [isCollapsed, setIsCollapsed] = useState(false);
   const [hiddenBySlug, setHiddenBySlug] = useSafeLocalStorage<
      Record<string, boolean>
   >(CHECKLIST_HIDDEN_STORAGE_KEY, {});
   const isHidden = (slug && hiddenBySlug[slug]) === true;

   const tasks = useMemo(
      () =>
         getTasksForProducts(
            (status?.project?.onboardingProducts as
               | string[]
               | null
               | undefined) ?? null,
         ),
      [status?.project?.onboardingProducts],
   );

   const tasksMap = (status?.project?.tasks ?? {}) as Record<string, boolean>;

   // Check if an SDK install task is completed - treat as linked
   const isTaskCompleted = useCallback(
      (taskId: string): boolean => {
         if (tasksMap[taskId]) return true;

         // SDK tasks are linked: completing one completes the other
         if (
            SDK_INSTALL_TASK_IDS.includes(
               taskId as (typeof SDK_INSTALL_TASK_IDS)[number],
            )
         ) {
            return SDK_INSTALL_TASK_IDS.some((id) => tasksMap[id] === true);
         }

         return false;
      },
      [tasksMap],
   );

   const isDependencyMet = useCallback(
      (task: TaskDefinition): boolean => {
         if (!task.dependsOn) return true;
         return isTaskCompleted(task.dependsOn);
      },
      [isTaskCompleted],
   );

   // Split tasks into core (setup + onboarding) and explore
   const coreTasks = useMemo(
      () => tasks.filter((t) => t.type === "setup" || t.type === "onboarding"),
      [tasks],
   );

   const exploreTasks = useMemo(
      () => tasks.filter((t) => t.type === "explore"),
      [tasks],
   );

   const completedCoreCount = coreTasks.filter((t) =>
      isTaskCompleted(t.id),
   ).length;
   const allCoreDone = completedCoreCount === coreTasks.length;

   const completedAllCount = tasks.filter((t) => isTaskCompleted(t.id)).length;
   const allDone = completedAllCount === tasks.length;

   const progressPercent =
      tasks.length > 0
         ? Math.round((completedAllCount / tasks.length) * 100)
         : 0;

   // Group tasks by product for display
   const groupedTasks = useMemo(() => {
      const displayTasks = allCoreDone ? exploreTasks : coreTasks;
      const groups = new Map<ProductId, TaskDefinition[]>();

      for (const task of displayTasks) {
         const existing = groups.get(task.product) ?? [];
         existing.push(task);
         groups.set(task.product, existing);
      }

      return groups;
   }, [allCoreDone, coreTasks, exploreTasks]);

   const handleCompleteTask = useCallback(
      (taskId: string) => {
         completeTaskMutation.mutate({ taskId });
      },
      [completeTaskMutation],
   );

   const handleHide = useCallback(() => {
      if (slug) {
         setHiddenBySlug((prev) => ({ ...prev, [slug]: true }));
      }
   }, [slug, setHiddenBySlug]);

   // Determine visibility
   if (!status?.project?.onboardingCompleted) return null;
   if (isHidden) return null;
   if (allDone) return null;

   return (
      <Card>
         <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex-1 space-y-1.5">
               <div className="flex items-center gap-2">
                  <Rocket className="size-5 text-primary" />
                  <CardTitle className="text-lg">
                     {allCoreDone ? "Continue explorando" : "Primeiros passos"}
                  </CardTitle>
               </div>
               <CardDescription>
                  {allCoreDone
                     ? "Voce concluiu os passos essenciais. Explore mais funcionalidades."
                     : `Complete as tarefas abaixo para comecar a usar o Contentta. ${completedAllCount} de ${tasks.length} concluidas.`}
               </CardDescription>

               {/* Progress bar */}
               <div className="flex items-center gap-3 pt-1">
                  <Progress className="flex-1" value={progressPercent} />
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                     {progressPercent}%
                  </span>
               </div>
            </div>

            {/* Collapse & hide buttons */}
            <div className="flex items-center gap-1 shrink-0">
               <Button
                  className="size-8"
                  onClick={() => setIsCollapsed((prev) => !prev)}
                  size="icon"
                  variant="ghost"
               >
                  {isCollapsed ? (
                     <ChevronDown className="size-4" />
                  ) : (
                     <ChevronUp className="size-4" />
                  )}
               </Button>
               <Button
                  className="size-8"
                  onClick={handleHide}
                  size="icon"
                  variant="ghost"
               >
                  <X className="size-4" />
               </Button>
            </div>
         </CardHeader>

         {!isCollapsed && (
            <CardContent className="pt-0">
               <div className="space-y-4">
                  {Array.from(groupedTasks.entries()).map(
                     ([product, productTasks]) => (
                        <div key={product}>
                           <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-3">
                              {getProductLabel(product)}
                           </h3>
                           <div className="space-y-0.5">
                              {productTasks.map((task) => {
                                 const completed = isTaskCompleted(task.id);
                                 const locked =
                                    !completed && !isDependencyMet(task);

                                 return (
                                    <QuickStartTask
                                       isAutoDetected={task.autoDetect}
                                       isCompleted={completed}
                                       isLocked={locked}
                                       key={task.id}
                                       onComplete={handleCompleteTask}
                                       task={task}
                                    />
                                 );
                              })}
                           </div>
                        </div>
                     ),
                  )}
               </div>
            </CardContent>
         )}
      </Card>
   );
}
