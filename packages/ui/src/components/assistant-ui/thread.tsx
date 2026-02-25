import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@packages/ui/components/assistant-ui/attachment";
import { MarkdownText } from "@packages/ui/components/assistant-ui/markdown-text";
import { ToolFallback } from "@packages/ui/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@packages/ui/components/assistant-ui/tooltip-icon-button";
import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
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
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react";
import type { FC } from "react";

export interface RecentThread {
  id: string;
  title: string;
  updatedAt: Date | string;
  onClick: () => void;
}

export interface QuickSuggestion {
  label: string;
  prompt: string;
}

export interface ThreadProps {
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  quickSuggestions?: QuickSuggestion[];
  recentThreads?: RecentThread[];
}

export const Thread: FC<ThreadProps> = ({
  welcomeTitle = "Hello there!",
  welcomeSubtitle = "How can I help you today?",
  quickSuggestions,
  recentThreads,
}) => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full w-full flex-col bg-background"
      style={{
        ["--thread-max-width" as string]: "44rem",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-4"
      >
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome
            title={welcomeTitle}
            subtitle={welcomeSubtitle}
            quickSuggestions={quickSuggestions}
            recentThreads={recentThreads}
          />
        </AuiIf>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6">
          <ThreadScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Rolar para o final"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

function formatTimeAgo(date: Date | string): string {
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
  quickSuggestions?: QuickSuggestion[];
  recentThreads?: RecentThread[];
}

const ThreadWelcome: FC<ThreadWelcomeProps> = ({
  title,
  subtitle,
  quickSuggestions,
  recentThreads,
}) => {
  return (
    <div className="aui-thread-welcome-root mx-auto flex w-full max-w-(--thread-max-width) grow flex-col">
      {/* Center — icon + title + subtitle */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-muted/40 shadow-sm">
          <SparklesIcon className="size-8 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm italic text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Quick suggestion chips */}
      {quickSuggestions && quickSuggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 px-4 pb-6">
          {quickSuggestions.map((s) => (
            <QuickChip key={s.label} label={s.label} prompt={s.prompt} />
          ))}
        </div>
      )}

      {/* Recent threads */}
      {recentThreads && recentThreads.length > 0 && (
        <div className="w-full border-t px-4 py-4">
          <p className="mb-2 text-sm font-medium">Conversas recentes</p>
          <div className="flex flex-col">
            {recentThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={thread.onClick}
                className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
              >
                <span className="truncate text-sm">{thread.title}</span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                  {formatTimeAgo(thread.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const QuickChip: FC<{ label: string; prompt: string }> = ({ label, prompt }) => {
  const api = useAui();
  return (
    <button
      type="button"
      onClick={() =>
        api.thread().append({
          role: "user",
          content: [{ type: "text", text: prompt }],
        })
      }
      className="rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
    >
      {label}
    </button>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone className="aui-composer-attachment-dropzone flex w-full flex-col rounded-2xl border border-input bg-background px-1 pt-2 outline-none transition-shadow has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring/20 data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50">
        <ComposerAttachments />
        <ComposerPrimitive.Input
          placeholder="Envie uma mensagem..."
          className="aui-composer-input mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          rows={1}
          autoFocus
          aria-label="Campo de mensagem"
        />
        <ComposerAction />
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
            tooltip="Enviar mensagem"
            side="bottom"
            type="submit"
            variant="default"
            size="icon"
            className="aui-composer-send size-8 rounded-full"
            aria-label="Enviar mensagem"
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-8 rounded-full"
            aria-label="Parar geração"
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
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
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
            tooltip="Mais"
            className="data-[state=open]:bg-accent"
          >
            <MoreHorizontalIcon />
          </TooltipIconButton>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          className="aui-action-bar-more-content z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
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
        <div className="aui-user-message-content wrap-break-word rounded-2xl bg-muted px-4 py-2.5 text-foreground">
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
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Editar" className="aui-user-action-edit p-4">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-3">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm">
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
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
        className,
      )}
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
