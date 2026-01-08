import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { TooltipProvider } from "@packages/ui/components/tooltip";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Archive, ArrowLeft, Send, Trash2 } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { ContentEditor } from "@/features/content/ui/content-editor";
import { ContentMetadataBar } from "@/features/content/ui/content-metadata-bar";
import { ContentFrontmatterPanel } from "@/features/content/ui/content-frontmatter-panel";
import { ChatSidebar } from "@/features/content/ui/chat-sidebar";
import {
	registerFrontmatterHandlers,
	unregisterFrontmatterHandlers,
} from "@/features/content/utils/frontmatter-tool-executor";
import { useChatState } from "@/features/content/context/chat-context";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type ContentDetailsPageProps = {
	contentId: string;
};

function ContentDetailsPageSkeleton() {
	return (
		<div className="flex h-[calc(100vh-4rem)] -m-4">
			<main className="flex flex-1 flex-col overflow-hidden p-4">
				{/* Header */}
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-3">
						<Skeleton className="size-9" />
						<div>
							<Skeleton className="h-7 w-48" />
							<Skeleton className="h-4 w-64 mt-1" />
						</div>
					</div>
					<Skeleton className="h-6 w-20" />
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 mb-4">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
				</div>

				{/* Metadata Bar */}
				<div className="flex items-center gap-4 border-b pb-3 mb-4">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-16" />
				</div>

				{/* Editor */}
				<div className="flex-1">
					<Skeleton className="h-full w-full" />
				</div>
			</main>

			{/* Chat Sidebar */}
			<div className="w-80 shrink-0 border-l p-4">
				<Skeleton className="h-8 w-full mb-4" />
				<Skeleton className="h-[calc(100%-8rem)] w-full" />
				<Skeleton className="h-20 w-full mt-4" />
			</div>
		</div>
	);
}

function ContentDetailsPageError({ error }: { error: Error }) {
	const { activeOrganization } = useActiveOrganization();

	return (
		<main className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Button asChild size="icon" variant="ghost">
					<Link
						to="/$slug/content"
						params={{ slug: activeOrganization.slug }}
					>
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold">
						{"Conteúdo não encontrado"}
					</h1>
				</div>
			</div>
			<div className="text-center py-8">
				<p className="text-muted-foreground">
					{"Ocorreu um erro. Por favor, tente novamente."}
				</p>
				<p className="text-xs text-muted-foreground mt-1">{error.message}</p>
			</div>
		</main>
	);
}

function ContentDetailsPageContent({ contentId }: ContentDetailsPageProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { activeOrganization } = useActiveOrganization();
	const { openAlertDialog } = useAlertDialog();
	const [isSaving, setIsSaving] = useState(false);
	const [isSavingMeta, setIsSavingMeta] = useState(false);

	// Get chat mode from context
	const { mode: chatMode } = useChatState();

	const { data: content } = useSuspenseQuery(
		trpc.content.getById.queryOptions({ id: contentId }),
	);

	// Determine if we're in planning mode (full-page chat) or editing mode (split view)
	// Planning mode: content body is empty AND chat mode is still "plan"
	// - When content exists: show editor (handles refresh case)
	// - When chatMode becomes "writer": show editor (handles Execute Plan click)
	const isPlanning = (!content.body || content.body.trim() === "") && chatMode === "plan";

	const updateMutation = useMutation(
		trpc.content.update.mutationOptions({
			onSuccess: () => {
				setIsSaving(false);
				queryClient.invalidateQueries({
					queryKey: trpc.content.getById.queryKey({ id: contentId }),
				});
			},
			onError: (error) => {
				setIsSaving(false);
				toast.error(error.message || "Ocorreu um erro. Por favor, tente novamente.");
			},
		}),
	);

	const updateMetaMutation = useMutation(
		trpc.content.update.mutationOptions({
			onSuccess: () => {
				setIsSavingMeta(false);
				queryClient.invalidateQueries({
					queryKey: trpc.content.getById.queryKey({ id: contentId }),
				});
			},
			onError: (error) => {
				setIsSavingMeta(false);
				toast.error(error.message || "Ocorreu um erro. Por favor, tente novamente.");
			},
		}),
	);

	const deleteMutation = useMutation(
		trpc.content.delete.mutationOptions({
			onSuccess: () => {
				toast.success("Conteúdo excluído com sucesso");
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
				navigate({
					to: "/$slug/content",
					params: { slug: activeOrganization.slug },
				});
			},
			onError: (error) => {
				toast.error(error.message || "Ocorreu um erro. Por favor, tente novamente.");
			},
		}),
	);

	const publishMutation = useMutation(
		trpc.content.publish.mutationOptions({
			onSuccess: () => {
				toast.success("Conteúdo publicado com sucesso");
				queryClient.invalidateQueries({
					queryKey: trpc.content.getById.queryKey({ id: contentId }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message || "Ocorreu um erro. Por favor, tente novamente.");
			},
		}),
	);

	const archiveMutation = useMutation(
		trpc.content.archive.mutationOptions({
			onSuccess: () => {
				toast.success("Conteúdo arquivado com sucesso");
				queryClient.invalidateQueries({
					queryKey: trpc.content.getById.queryKey({ id: contentId }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message || "Ocorreu um erro. Por favor, tente novamente.");
			},
		}),
	);

	const { call: debouncedSave, flush: flushContentSave } = useDebouncedCallback((body: string) => {
		setIsSaving(true);
		updateMutation.mutate({
			id: contentId,
			data: { body },
		});
	}, 1000);

	const handleContentChange = useCallback(
		(body: string) => {
			debouncedSave(body);
		},
		[debouncedSave],
	);

	// Callback when agent completes - flush any pending content save
	const handleAgentComplete = useCallback(() => {
		flushContentSave();
	}, [flushContentSave]);

	const handleMetaChange = useCallback(
		(metaUpdates: Partial<typeof content.meta>) => {
			setIsSavingMeta(true);
			updateMetaMutation.mutate({
				id: contentId,
				data: {
					meta: metaUpdates, // Only send changed fields, server merges with existing
				},
			});
		},
		[contentId, updateMetaMutation],
	);

	// Register frontmatter handlers for agent tool execution
	useEffect(() => {
		const optimisticUpdate = (updates: Partial<typeof content.meta>) => {
			// Immediately update the cache for instant UI feedback
			queryClient.setQueryData(
				trpc.content.getById.queryKey({ id: contentId }),
				(old: typeof content | undefined) => 
					old ? { ...old, meta: { ...old.meta, ...updates } } : old
			);
		};

		registerFrontmatterHandlers({
			updateTitle: (title) => {
				optimisticUpdate({ title });
				handleMetaChange({ title });
			},
			updateDescription: (description) => {
				optimisticUpdate({ description });
				handleMetaChange({ description });
			},
			updateSlug: (slug) => {
				optimisticUpdate({ slug });
				handleMetaChange({ slug });
			},
			updateKeywords: (keywords) => {
				optimisticUpdate({ keywords });
				handleMetaChange({ keywords });
			},
		});

		return () => {
			unregisterFrontmatterHandlers();
		};
	}, [handleMetaChange, queryClient, trpc.content.getById, contentId]);

	const handleDelete = () => {
		openAlertDialog({
			actionLabel: "Excluir",
			cancelLabel: "Cancelar",
			description: `${"Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."} "${content.meta.title}"?`,
			onAction: () => deleteMutation.mutate({ id: contentId }),
			title: "Confirmar Exclusão",
			variant: "destructive",
		});
	};

	const handlePublish = () => {
		publishMutation.mutate({ id: contentId });
	};

	const handleArchive = () => {
		archiveMutation.mutate({ id: contentId });
	};

	const STATUS_COLORS: Record<string, string> = {
		archived: "bg-slate-500/10 text-slate-600 border-slate-200",
		draft: "bg-amber-500/10 text-amber-600 border-amber-200",
		published: "bg-green-500/10 text-green-600 border-green-200",
	};

	// Full-page chat layout (planning mode)
	if (isPlanning) {
		return (
			<TooltipProvider>
				<div className="flex h-[calc(100vh-4rem)] -m-4">
					{/* Minimal header */}
					<div className="absolute top-4 left-4 z-10">
						<Button asChild size="icon" variant="ghost">
							<Link
								to="/$slug/content"
								params={{ slug: activeOrganization.slug }}
							>
								<ArrowLeft className="size-4" />
							</Link>
						</Button>
					</div>

					{/* Full-page Chat */}
					<ChatSidebar
						contentId={contentId}
						contentMeta={{
							title: content.meta.title,
							description: content.meta.description,
							slug: content.meta.slug,
							keywords: content.meta.keywords,
							status: content.status,
						}}
						fullPage
						onAgentComplete={handleAgentComplete}
					/>
				</div>
			</TooltipProvider>
		);
	}

	// Split view layout (editing mode)
	return (
		<TooltipProvider>
			<div className="flex h-[calc(100vh-4rem)] -m-4">
				{/* Main Content */}
				<main className="flex flex-1 flex-col overflow-hidden p-4">
					{/* Header */}
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-3">
							<Button asChild size="icon" variant="ghost">
								<Link
									to="/$slug/content"
									params={{ slug: activeOrganization.slug }}
								>
									<ArrowLeft className="size-4" />
								</Link>
							</Button>
							<div>
								<h1 className="text-2xl font-bold">
									{content.meta.title || "Sem título"}
								</h1>
								<p className="text-muted-foreground text-sm flex items-center gap-2">
									{content.meta.description || "Detalhes do conteúdo"}
									{isSaving && (
										<span className="text-xs text-amber-600">
											{"Salvando..."}
										</span>
									)}
								</p>
							</div>
						</div>
						<Badge className={STATUS_COLORS[content.status]} variant="outline">
							{content.status}
						</Badge>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2 mb-4">
						<Button
							onClick={handleDelete}
							variant="outline"
							size="sm"
							className="text-destructive hover:text-destructive"
						>
							<Trash2 className="size-4 mr-2" />
							{"Excluir"}
						</Button>
						{content.status === "draft" && (
							<Button
								onClick={handlePublish}
								variant="outline"
								size="sm"
								disabled={publishMutation.isPending}
							>
								<Send className="size-4 mr-2" />
								{"Publicar"}
							</Button>
						)}
						{content.status !== "archived" && (
							<Button
								onClick={handleArchive}
								variant="outline"
								size="sm"
								disabled={archiveMutation.isPending}
							>
								<Archive className="size-4 mr-2" />
								{"Arquivar"}
							</Button>
						)}
					</div>

					{/* Frontmatter Panel */}
					<ContentFrontmatterPanel
						contentId={contentId}
						meta={content.meta}
						body={content.body || ""}
						onMetaChange={handleMetaChange}
						isSaving={isSavingMeta}
						disabled={content.status === "archived"}
						className="mb-4"
					/>

					{/* Metadata Bar */}
					<ContentMetadataBar
						content={content}
						slug={activeOrganization.slug}
						className="mb-4"
					/>

					{/* Editor - fills remaining space */}
					<div className="flex-1 overflow-hidden min-h-0">
						<ContentEditor
							key={contentId}
							initialContent={content.body || ""}
							onChange={handleContentChange}
							placeholder={"Comece a escrever..."}
							disabled={content.status === "archived"}
							className="h-full"
						/>
					</div>
				</main>

				{/* Chat Sidebar */}
				<ChatSidebar
					contentId={contentId}
					contentMeta={{
						title: content.meta.title,
						description: content.meta.description,
						slug: content.meta.slug,
						keywords: content.meta.keywords,
						status: content.status,
					}}
					onAgentComplete={handleAgentComplete}
				/>
			</div>
		</TooltipProvider>
	);
}

export function ContentDetailsPage({ contentId }: ContentDetailsPageProps) {
	return (
		<ErrorBoundary FallbackComponent={ContentDetailsPageError}>
			<Suspense fallback={<ContentDetailsPageSkeleton />}>
				<ContentDetailsPageContent contentId={contentId} />
			</Suspense>
		</ErrorBoundary>
	);
}
