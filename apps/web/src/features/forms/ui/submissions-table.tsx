import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
	Card,
	CardContent,
} from "@packages/ui/components/card";
import {
	CredenzaBody,
	CredenzaDescription,
	CredenzaHeader,
	CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@packages/ui/components/empty";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@packages/ui/components/table";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Eye,
	Inbox,
} from "lucide-react";
import { useState } from "react";
import { useCredenza } from "@/hooks/use-credenza";
import { orpc } from "@/integrations/orpc/client";

// =============================================================================
// Types
// =============================================================================

interface FormField {
	id: string;
	type: string;
	label: string;
}

interface SubmissionMetadata {
	ipAddress?: string;
	userAgent?: string;
	referrer?: string;
	visitorId?: string;
	sessionId?: string;
}

interface Submission {
	id: string;
	formId: string;
	organizationId: string;
	data: Record<string, unknown>;
	metadata: SubmissionMetadata | null;
	submittedAt: Date;
}

// =============================================================================
// Helpers
// =============================================================================

function formatSubmittedAt(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function extractHostname(url: string | undefined): string {
	if (!url) return "-";
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}

function formatFieldValue(value: unknown): string {
	if (value === null || value === undefined) return "-";
	if (typeof value === "boolean") return value ? "Sim" : "Não";
	if (typeof value === "string") return value || "-";
	return String(value);
}

// =============================================================================
// Submission Detail Modal Content
// =============================================================================

function SubmissionDetail({
	submission,
	fields,
}: {
	submission: Submission;
	fields: FormField[];
}) {
	return (
		<>
			<CredenzaHeader>
				<CredenzaTitle>Detalhes da submissão</CredenzaTitle>
				<CredenzaDescription>
					Enviado em {formatSubmittedAt(submission.submittedAt)}
				</CredenzaDescription>
			</CredenzaHeader>
			<CredenzaBody className="space-y-6">
				{/* Form data */}
				<div>
					<h4 className="text-sm font-medium mb-3">Dados do formulário</h4>
					<div className="space-y-3">
						{fields.map((field) => (
							<div key={field.id} className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">
									{field.label}
								</p>
								<p className="text-sm">
									{formatFieldValue(submission.data[field.id])}
								</p>
							</div>
						))}
					</div>
				</div>

				<Separator />

				{/* Metadata */}
				<div>
					<h4 className="text-sm font-medium mb-3">Metadados</h4>
					<div className="space-y-3">
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground font-medium">
								Referência
							</p>
							<p className="text-sm">
								{submission.metadata?.referrer
									? extractHostname(submission.metadata.referrer)
									: "-"}
							</p>
						</div>
						{submission.metadata?.visitorId && (
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">
									ID do visitante
								</p>
								<p className="text-xs font-mono break-all">
									{submission.metadata.visitorId}
								</p>
							</div>
						)}
						{submission.metadata?.userAgent && (
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">
									User Agent
								</p>
								<p className="text-xs break-all text-muted-foreground">
									{submission.metadata.userAgent}
								</p>
							</div>
						)}
					</div>
				</div>
			</CredenzaBody>
		</>
	);
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function SubmissionsTableSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			{/* Header skeleton */}
			<div className="flex items-center gap-3">
				<Skeleton className="size-8 rounded-md" />
				<div className="space-y-1">
					<Skeleton className="h-7 w-48" />
					<Skeleton className="h-4 w-72" />
				</div>
			</div>

			{/* Table skeleton */}
			<Card>
				<CardContent className="p-0">
					<div className="p-4 space-y-3">
						<Skeleton className="h-10 w-full" />
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton
								key={`submission-skeleton-${i + 1}`}
								className="h-12 w-full"
							/>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// =============================================================================
// Empty State
// =============================================================================

function SubmissionsEmptyState() {
	return (
		<Card>
			<CardContent className="py-12">
				<Empty>
					<EmptyContent>
						<EmptyMedia variant="icon">
							<Inbox className="size-12" />
						</EmptyMedia>
						<EmptyTitle>Nenhuma submissão ainda</EmptyTitle>
						<EmptyDescription>
							Este formulário ainda não recebeu nenhuma submissão.
						</EmptyDescription>
					</EmptyContent>
				</Empty>
			</CardContent>
		</Card>
	);
}

// =============================================================================
// Pagination
// =============================================================================

function SubmissionsPagination({
	page,
	pages,
	total,
	onPrevious,
	onNext,
}: {
	page: number;
	pages: number;
	total: number;
	onPrevious: () => void;
	onNext: () => void;
}) {
	if (pages <= 1) return null;

	return (
		<div className="flex items-center justify-between">
			<p className="text-sm text-muted-foreground">
				Página {page} de {pages} ({total}{" "}
				{total === 1 ? "submissão" : "submissões"})
			</p>
			<div className="flex items-center gap-2">
				<Button
					disabled={page <= 1}
					onClick={onPrevious}
					size="sm"
					variant="outline"
				>
					<ChevronLeft className="size-4 mr-1" />
					Anterior
				</Button>
				<Button
					disabled={page >= pages}
					onClick={onNext}
					size="sm"
					variant="outline"
				>
					Próxima
					<ChevronRight className="size-4 ml-1" />
				</Button>
			</div>
		</div>
	);
}

// =============================================================================
// Main Component
// =============================================================================

interface SubmissionsTableProps {
	formId: string;
}

export function SubmissionsTable({ formId }: SubmissionsTableProps) {
	const { slug } = useParams({ strict: false });
	const { openCredenza } = useCredenza();
	const [page, setPage] = useState(1);

	// Fetch form details for field labels
	const { data: form, isLoading: isFormLoading } = useQuery({
		...orpc.forms.getById.queryOptions({ input: { id: formId } }),
	});

	// Fetch paginated submissions
	const { data: submissionsData, isLoading: isSubmissionsLoading } = useQuery({
		...orpc.forms.getSubmissions.queryOptions({
			input: { formId, page, limit: 50 },
		}),
		placeholderData: keepPreviousData,
	});

	const isLoading = isFormLoading || isSubmissionsLoading;

	// Show skeleton while loading initial data
	if (isLoading && !submissionsData) {
		return <SubmissionsTableSkeleton />;
	}

	const fields = (form?.fields as FormField[]) ?? [];
	const submissions = (submissionsData?.submissions as Submission[]) ?? [];
	const total = submissionsData?.total ?? 0;
	const pages = submissionsData?.pages ?? 1;

	const handleViewDetail = (submission: Submission) => {
		openCredenza({
			children: <SubmissionDetail submission={submission} fields={fields} />,
		});
	};

	// Limit displayed field columns to avoid excessive width
	const displayFields = fields.slice(0, 4);
	const hasMoreFields = fields.length > 4;

	return (
		<div className="flex flex-col gap-6">
			{/* Page header */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Button
						className="size-8"
						size="icon"
						variant="ghost"
						asChild
					>
						<Link
							to="/$slug/forms"
							params={{ slug: slug || "" }}
						>
							<ArrowLeft className="size-4" />
							<span className="sr-only">Voltar</span>
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-bold tracking-tight font-serif">
							{form?.name ?? "Submissões"}
						</h1>
						<p className="text-sm text-muted-foreground mt-0.5">
							Visualize e gerencie as submissões do formulário
						</p>
					</div>
				</div>
				{total > 0 && (
					<Badge variant="secondary">
						{total} {total === 1 ? "submissão" : "submissões"}
					</Badge>
				)}
			</div>

			{/* Empty state */}
			{submissions.length === 0 && !isLoading ? (
				<SubmissionsEmptyState />
			) : (
				<>
					{/* Submissions table */}
					<Card>
						<CardContent className="p-0 overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="min-w-[160px]">
											Data
										</TableHead>
										{displayFields.map((field) => (
											<TableHead
												className="min-w-[120px]"
												key={field.id}
											>
												{field.label}
											</TableHead>
										))}
										{hasMoreFields && (
											<TableHead className="min-w-[80px]">
												...
											</TableHead>
										)}
										<TableHead className="min-w-[120px]">
											Referência
										</TableHead>
										<TableHead className="w-[60px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{submissions.map((submission) => (
										<TableRow key={submission.id}>
											<TableCell className="whitespace-nowrap text-sm tabular-nums">
												{formatSubmittedAt(submission.submittedAt)}
											</TableCell>
											{displayFields.map((field) => (
												<TableCell
													className="max-w-[200px] truncate text-sm"
													key={`${submission.id}-${field.id}`}
												>
													{formatFieldValue(submission.data[field.id])}
												</TableCell>
											))}
											{hasMoreFields && (
												<TableCell className="text-sm text-muted-foreground">
													+{fields.length - 4}
												</TableCell>
											)}
											<TableCell className="text-sm text-muted-foreground">
												{extractHostname(
													submission.metadata?.referrer,
												)}
											</TableCell>
											<TableCell>
												<Button
													className="size-8"
													onClick={() => handleViewDetail(submission)}
													size="icon"
													variant="ghost"
												>
													<Eye className="size-4" />
													<span className="sr-only">
														Ver detalhes
													</span>
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* Pagination */}
					<SubmissionsPagination
						onNext={() => setPage((p) => Math.min(p + 1, pages))}
						onPrevious={() => setPage((p) => Math.max(p - 1, 1))}
						page={page}
						pages={pages}
						total={total}
					/>
				</>
			)}
		</div>
	);
}
