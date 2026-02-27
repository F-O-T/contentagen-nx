import {
   ActionBarMorePrimitive,
   ActionBarPrimitive,
   AuiIf,
   BranchPickerPrimitive,
   ComposerPrimitive,
   ErrorPrimitive,
   MessagePrimitive,
   ThreadPrimitive,
   useAui,
} from "@assistant-ui/react";
import {
   ComposerAddAttachment,
   ComposerAttachments,
   UserMessageAttachments,
} from "@packages/ui/components/assistant-ui/attachment";
import { MarkdownText } from "@packages/ui/components/assistant-ui/markdown-text";
import { ToolFallback } from "@packages/ui/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@packages/ui/components/assistant-ui/tooltip-icon-button";
import { Button } from "@packages/ui/components/button";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { cn } from "@packages/ui/lib/utils";
import { useStore } from "@tanstack/react-store";
import {
   ArrowDownIcon,
   ArrowUpIcon,
   CheckIcon,
   ChevronLeftIcon,
   ChevronRightIcon,
   CopyIcon,
   DownloadIcon,
   Loader2,
   MoreHorizontalIcon,
   PencilIcon,
   RefreshCwIcon,
   SparklesIcon,
   SquareIcon,
} from "lucide-react";
import type { FC, ReactNode } from "react";
import { useState } from "react";
import {
   AGENT_DISPLAY_NAMES,
   type AgentStatus,
   agentNetworkStore,
} from "@/features/editor/stores/agent-network-store";
import { type ContextItem, ContextPicker } from "./context-picker";

const MODES = [
   { value: "auto", label: "Auto" },
   { value: "content", label: "Conteúdo" },
] as const;

export interface QuickSuggestion {
   label: string;
   prompt: string;
}

export interface ThreadProps {
   welcomeTitle?: string;
   welcomeSubtitle?: string;
   welcomeIconUrl?: string;
   quickSuggestions?: QuickSuggestion[];
   recentThreadsSlot?: ReactNode;
   onModeChange?: (mode: string) => void;
   defaultMode?: string;
}

export const Thread: FC<ThreadProps> = ({
   welcomeTitle = "O que você quer criar?",
   welcomeSubtitle = "Pesquise, escreva, audite SEO ou revise conteúdos.",
   welcomeIconUrl,
   quickSuggestions,
   recentThreadsSlot,
   onModeChange,
   defaultMode = "auto",
}) => {
   const [mode, setMode] = useState<string>(defaultMode);

   const handleModeChange = (value: string) => {
      setMode(value);
      onModeChange?.(value);
   };

   return (
      <ThreadPrimitive.Root
         className="aui-root aui-thread-root @container flex h-full w-full flex-col bg-transparent"
         style={{
            ["--thread-max-width" as string]: "44rem",
         }}
      >
         <ThreadPrimitive.Viewport
            className="aui-thread-viewport relative flex flex-1 flex-col overflow-y-auto scroll-smooth "
            turnAnchor="top"
         >
            <AuiIf condition={(s) => s.thread.isEmpty}>
               <ThreadWelcome
                  iconUrl={welcomeIconUrl}
                  quickSuggestions={quickSuggestions}
                  recentThreadsSlot={recentThreadsSlot}
                  subtitle={welcomeSubtitle}
                  title={welcomeTitle}
               />
            </AuiIf>

            <ThreadPrimitive.Messages
               components={{
                  UserMessage,
                  EditComposer,
                  AssistantMessage,
               }}
            />

            <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible rounded-t-3xl bg-transparent pb-4 ">
               <AuiIf condition={(s) => !s.thread.isEmpty}>
                  <ThreadScrollToBottom />
                  <AgentNetworkStatus />
               </AuiIf>
               <Composer mode={mode} onModeChange={handleModeChange} />
            </ThreadPrimitive.ViewportFooter>
         </ThreadPrimitive.Viewport>
      </ThreadPrimitive.Root>
   );
};

const ThreadScrollToBottom: FC = () => {
   return (
      <ThreadPrimitive.ScrollToBottom asChild>
         <TooltipIconButton
            className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
            tooltip="Rolar para o final"
            variant="outline"
         >
            <ArrowDownIcon />
         </TooltipIconButton>
      </ThreadPrimitive.ScrollToBottom>
   );
};

export function formatTimeAgo(date: Date | string): string {
   const d = typeof date === "string" ? new Date(date) : date;
   const diffMs = Date.now() - d.getTime();
   const diffDays = Math.floor(diffMs / 86400000);
   if (diffDays === 0) return "hoje";
   if (diffDays === 1) return "ontem";
   if (diffDays < 7) return `${diffDays}d`;
   if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
   return `${Math.floor(diffDays / 30)}m`;
}

interface ThreadWelcomeProps {
   title: string;
   subtitle: string;
   iconUrl?: string;
   quickSuggestions?: QuickSuggestion[];
   recentThreadsSlot?: ReactNode;
}

const ThreadWelcome: FC<ThreadWelcomeProps> = ({
   title,
   subtitle,
   iconUrl,
   quickSuggestions,
   recentThreadsSlot,
}) => {
   return (
      <div className="aui-thread-welcome-root mx-auto flex w-full max-w-(--thread-max-width) grow flex-col">
         {/* Centered main content */}
         <div className="flex flex-1 flex-col items-center justify-center px-3 py-8">
            {/* Icon + title + subtitle */}
            <div className="flex flex-col items-center gap-3 px-3 pb-6 text-center">
               <div className="relative flex items-center justify-center">
                  <div className="absolute size-24 rounded-full bg-primary/10 blur-xl" />
                  {iconUrl ? (
                     <div
                        className="size-20 bg-foreground"
                        style={{
                           maskImage: `url(${iconUrl})`,
                           maskSize: "contain",
                           maskRepeat: "no-repeat",
                           maskPosition: "center",
                        }}
                     />
                  ) : (
                     <SparklesIcon className="relative size-10 text-foreground" />
                  )}
               </div>
               <div className="flex flex-col items-center gap-1.5">
                  <h2 className="text-2xl font-semibold tracking-tight">
                     {title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
               </div>
            </div>

            {/* Quick suggestion chips — flex wrap, centered */}
            {quickSuggestions && quickSuggestions.length > 0 && (
               <div className="flex flex-wrap justify-center gap-2">
                  {quickSuggestions.map((s) => (
                     <QuickChip
                        key={s.label}
                        label={s.label}
                        prompt={s.prompt}
                     />
                  ))}
               </div>
            )}
         </div>

         {/* Recent threads — pushed to bottom */}
         {recentThreadsSlot && (
            <div className="w-full border-t border-border/60 px-3 pt-3 pb-2">
               <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Conversas recentes
               </p>
               <div className="flex flex-col">{recentThreadsSlot}</div>
            </div>
         )}
      </div>
   );
};

const QuickChip: FC<{ label: string; prompt: string }> = ({
   label,
   prompt,
}) => {
   const api = useAui();
   return (
      <button
         className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
         onClick={() => {
            api.composer().setText(prompt);
         }}
         type="button"
      >
         {label}
      </button>
   );
};

interface ComposerProps {
   mode: string;
   onModeChange: (value: string) => void;
}

const Composer: FC<ComposerProps> = ({ mode, onModeChange }) => {
   const [contextItems, setContextItems] = useState<ContextItem[]>([]);
   const aui = useAui();

   const handleContextSelect = (item: ContextItem) => {
      setContextItems((prev) =>
         prev.some((i) => i.id === item.id) ? prev : [...prev, item],
      );
   };

   const removeContextItem = (id: string) => {
      setContextItems((prev) => prev.filter((i) => i.id !== id));
   };

   const handleSubmit = () => {
      if (contextItems.length === 0) return;
      const contextBlock = contextItems
         .map((item) => `@${item.label}`)
         .join(", ");
      const currentText = aui.composer().getState().text;
      const separator = currentText.trim() ? "\n\n" : "";
      aui.composer().setText(
         `[Contexto: ${contextBlock}]${separator}${currentText}`,
      );
      setContextItems([]);
   };

   return (
      <ComposerPrimitive.Root
         className="aui-composer-root relative flex w-full flex-col"
         onSubmit={handleSubmit}
      >
         <ComposerPrimitive.AttachmentDropzone className="aui-composer-attachment-dropzone flex w-full flex-col rounded-xl border border-border/60 bg-background/80 px-1 pt-2 shadow-sm outline-none backdrop-blur-sm transition-all has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:shadow-md has-[textarea:focus-visible]:ring-1 has-[textarea:focus-visible]:ring-ring/20 data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50">
            <ComposerAttachments />
            {contextItems.length > 0 && (
               <div className="flex flex-wrap gap-1 px-3 pt-2">
                  {contextItems.map((item) => (
                     <span
                        className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs"
                        key={item.id}
                     >
                        @{item.label}
                        <button
                           aria-label="Remover contexto"
                           className="ml-0.5 text-muted-foreground hover:text-foreground"
                           onClick={() => removeContextItem(item.id)}
                           type="button"
                        >
                           &times;
                        </button>
                     </span>
                  ))}
               </div>
            )}
            <ComposerPrimitive.Input
               aria-label="Campo de mensagem"
               autoFocus
               className="aui-composer-input mb-1 max-h-32 min-h-12 w-full resize-none bg-transparent px-3 pt-2 pb-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
               placeholder="Envie uma mensagem..."
               rows={1}
            />
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 px-1 pb-2">
                  <Select onValueChange={onModeChange} value={mode}>
                     <SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-accent">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent align="start">
                        {MODES.map((m) => (
                           <SelectItem
                              className="text-xs"
                              key={m.value}
                              value={m.value}
                           >
                              {m.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  <ContextPicker onSelect={handleContextSelect} />
               </div>
               <ComposerAction />
            </div>
         </ComposerPrimitive.AttachmentDropzone>
      </ComposerPrimitive.Root>
   );
};

const ComposerAction: FC = () => {
   return (
      <div className="aui-composer-action-wrapper relative mx-2 mb-2 flex items-center justify-between">
         <ComposerAddAttachment />
         <AuiIf condition={(s) => !s.thread.isRunning}>
            <ComposerPrimitive.Send asChild>
               <TooltipIconButton
                  aria-label="Enviar mensagem"
                  className="aui-composer-send size-8 rounded-full"
                  side="bottom"
                  size="icon"
                  tooltip="Enviar mensagem"
                  type="submit"
                  variant="default"
               >
                  <ArrowUpIcon className="aui-composer-send-icon size-4" />
               </TooltipIconButton>
            </ComposerPrimitive.Send>
         </AuiIf>
         <AuiIf condition={(s) => s.thread.isRunning}>
            <ComposerPrimitive.Cancel asChild>
               <Button
                  aria-label="Parar geração"
                  className="aui-composer-cancel size-8 rounded-full"
                  size="icon"
                  type="button"
                  variant="default"
               >
                  <SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
               </Button>
            </ComposerPrimitive.Cancel>
         </AuiIf>
      </div>
   );
};

const MessageError: FC = () => {
   return (
      <MessagePrimitive.Error>
         <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
            <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
         </ErrorPrimitive.Root>
      </MessagePrimitive.Error>
   );
};

const AssistantMessage: FC = () => {
   return (
      <MessagePrimitive.Root
         className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-3 duration-150"
         data-role="assistant"
      >
         <div className="aui-assistant-message-content wrap-break-word px-2 text-foreground leading-relaxed">
            <MessagePrimitive.Parts
               components={{
                  Text: MarkdownText,
                  tools: { Fallback: ToolFallback },
               }}
            />
            <MessageError />
         </div>

         <div className="aui-assistant-message-footer mt-1 ml-2 flex">
            <BranchPicker />
            <AssistantActionBar />
         </div>
      </MessagePrimitive.Root>
   );
};

const AssistantActionBar: FC = () => {
   return (
      <ActionBarPrimitive.Root
         autohide="not-last"
         autohideFloat="single-branch"
         className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
         hideWhenRunning
      >
         <ActionBarPrimitive.Copy asChild>
            <TooltipIconButton tooltip="Copiar">
               <AuiIf condition={(s) => s.message.isCopied}>
                  <CheckIcon />
               </AuiIf>
               <AuiIf condition={(s) => !s.message.isCopied}>
                  <CopyIcon />
               </AuiIf>
            </TooltipIconButton>
         </ActionBarPrimitive.Copy>
         <ActionBarPrimitive.Reload asChild>
            <TooltipIconButton tooltip="Gerar novamente">
               <RefreshCwIcon />
            </TooltipIconButton>
         </ActionBarPrimitive.Reload>
         <ActionBarMorePrimitive.Root>
            <ActionBarMorePrimitive.Trigger asChild>
               <TooltipIconButton
                  className="data-[state=open]:bg-accent"
                  tooltip="Mais"
               >
                  <MoreHorizontalIcon />
               </TooltipIconButton>
            </ActionBarMorePrimitive.Trigger>
            <ActionBarMorePrimitive.Content
               align="start"
               className="aui-action-bar-more-content z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
               side="bottom"
            >
               <ActionBarPrimitive.ExportMarkdown asChild>
                  <ActionBarMorePrimitive.Item className="aui-action-bar-more-item flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                     <DownloadIcon className="size-4" />
                     Exportar como Markdown
                  </ActionBarMorePrimitive.Item>
               </ActionBarPrimitive.ExportMarkdown>
            </ActionBarMorePrimitive.Content>
         </ActionBarMorePrimitive.Root>
      </ActionBarPrimitive.Root>
   );
};

const UserMessage: FC = () => {
   return (
      <MessagePrimitive.Root
         className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 duration-150 [&:where(>*)]:col-start-2"
         data-role="user"
      >
         <UserMessageAttachments />

         <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
            <div className="aui-user-message-content wrap-break-word rounded-2xl bg-accent px-4 py-2.5 text-accent-foreground">
               <MessagePrimitive.Parts />
            </div>
            <div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
               <UserActionBar />
            </div>
         </div>

         <BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
      </MessagePrimitive.Root>
   );
};

const UserActionBar: FC = () => {
   return (
      <ActionBarPrimitive.Root
         autohide="not-last"
         className="aui-user-action-bar-root flex flex-col items-end"
         hideWhenRunning
      >
         <ActionBarPrimitive.Edit asChild>
            <TooltipIconButton
               className="aui-user-action-edit p-4"
               tooltip="Editar"
            >
               <PencilIcon />
            </TooltipIconButton>
         </ActionBarPrimitive.Edit>
      </ActionBarPrimitive.Root>
   );
};

const EditComposer: FC = () => {
   return (
      <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-3">
         <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-accent">
            <ComposerPrimitive.Input
               autoFocus
               className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
            />
            <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
               <ComposerPrimitive.Cancel asChild>
                  <Button size="sm" variant="ghost">
                     Cancelar
                  </Button>
               </ComposerPrimitive.Cancel>
               <ComposerPrimitive.Send asChild>
                  <Button size="sm">Atualizar</Button>
               </ComposerPrimitive.Send>
            </div>
         </ComposerPrimitive.Root>
      </MessagePrimitive.Root>
   );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
   className,
   ...rest
}) => {
   return (
      <BranchPickerPrimitive.Root
         className={cn(
            "aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
            className,
         )}
         hideWhenSingleBranch
         {...rest}
      >
         <BranchPickerPrimitive.Previous asChild>
            <TooltipIconButton tooltip="Anterior">
               <ChevronLeftIcon />
            </TooltipIconButton>
         </BranchPickerPrimitive.Previous>
         <span className="aui-branch-picker-state font-medium">
            <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
         </span>
         <BranchPickerPrimitive.Next asChild>
            <TooltipIconButton tooltip="Próximo">
               <ChevronRightIcon />
            </TooltipIconButton>
         </BranchPickerPrimitive.Next>
      </BranchPickerPrimitive.Root>
   );
};

const AgentNetworkStatus: FC = () => {
   const { isActive, agents } = useStore(agentNetworkStore);

   if (!isActive || agents.length === 0) return null;

   const activeAgent = agents.find((a) => a.status === "running");
   const routerDone = agents.length > 0;

   return (
      <div className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2.5">
         <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <span className="text-xs font-medium text-muted-foreground">
               Agent Network
            </span>
            {activeAgent && (
               <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-xs text-foreground">
                     {AGENT_DISPLAY_NAMES[activeAgent.id] ?? activeAgent.id}
                  </span>
               </>
            )}
         </div>

         <div className="mb-1.5 flex items-center gap-2 text-xs">
            {routerDone ? (
               <CheckIcon className="h-3 w-3 shrink-0 text-green-500" />
            ) : (
               <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />
            )}
            <span className="text-muted-foreground">Content Router</span>
         </div>

         <div className="ml-3 flex flex-col gap-1 border-l border-border/40 pl-2.5">
            {agents.map((agent) => (
               <AgentRow id={agent.id} key={agent.id} status={agent.status} />
            ))}
         </div>
      </div>
   );
};

const AgentRow: FC<{ id: string; status: AgentStatus }> = ({ id, status }) => (
   <div className="flex items-center gap-2 text-xs">
      {status === "running" ? (
         <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />
      ) : (
         <CheckIcon className="h-3 w-3 shrink-0 text-green-500" />
      )}
      <span
         className={
            status === "running" ? "text-foreground" : "text-muted-foreground"
         }
      >
         {AGENT_DISPLAY_NAMES[id] ?? id}
      </span>
   </div>
);
