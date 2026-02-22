"use client";

import type { ContentMeta } from "@packages/database/schemas/content";
import { Badge } from "@packages/ui/components/badge";
import { Input } from "@packages/ui/components/input";
import { Separator } from "@packages/ui/components/separator";
import { X } from "lucide-react";
import { type KeyboardEvent, useCallback, useState } from "react";

interface FrontmatterSectionProps {
	meta: ContentMeta;
	onChange: (meta: ContentMeta) => void;
	readOnly?: boolean;
}

export function FrontmatterSection({
	meta,
	onChange,
	readOnly = false,
}: FrontmatterSectionProps) {
	const [keywordInput, setKeywordInput] = useState("");

	const handleField = useCallback(
		(field: keyof ContentMeta, value: string | string[]) => {
			onChange({ ...meta, [field]: value });
		},
		[meta, onChange],
	);

	const handleAddKeyword = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				const kw = keywordInput.trim().replace(/,$/, "");
				if (kw && !(meta.keywords ?? []).includes(kw)) {
					handleField("keywords", [...(meta.keywords ?? []), kw]);
				}
				setKeywordInput("");
			}
		},
		[keywordInput, meta.keywords, handleField],
	);

	const handleRemoveKeyword = useCallback(
		(kw: string) => {
			handleField(
				"keywords",
				(meta.keywords ?? []).filter((k) => k !== kw),
			);
		},
		[meta.keywords, handleField],
	);

	return (
		<div className="border-b bg-muted/20 px-6 py-4 space-y-3">
			{/* Title */}
			<Input
				className="text-2xl font-bold h-auto border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
				placeholder="Título do post"
				value={meta.title ?? ""}
				readOnly={readOnly}
				onChange={(e) => handleField("title", e.target.value)}
			/>

			{/* Description */}
			<Input
				className="h-auto border-0 bg-transparent p-0 text-sm text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/30"
				placeholder="Meta description…"
				value={meta.description ?? ""}
				readOnly={readOnly}
				onChange={(e) => handleField("description", e.target.value)}
			/>

			{/* Slug + Keywords row */}
			<div className="flex items-center gap-3 flex-wrap">
				<div className="flex items-center gap-1 text-sm text-muted-foreground">
					<span className="shrink-0">/conteudo/</span>
					<Input
						className="h-auto w-40 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/30"
						placeholder="meu-slug"
						value={meta.slug ?? ""}
						readOnly={readOnly}
						onChange={(e) => handleField("slug", e.target.value)}
					/>
				</div>
				<Separator orientation="vertical" className="h-4" />
				<div className="flex items-center gap-1.5 flex-wrap">
					{(meta.keywords ?? []).map((kw) => (
						<Badge
							key={kw}
							variant="secondary"
							className="gap-1 pl-2 pr-1 h-5 text-[10px]"
						>
							{kw}
							{!readOnly && (
								<button
									type="button"
									onClick={() => handleRemoveKeyword(kw)}
									className="hover:text-destructive ml-0.5"
								>
									<X className="size-2.5" />
								</button>
							)}
						</Badge>
					))}
					{!readOnly && (
						<Input
							className="h-auto w-24 border-0 bg-transparent p-0 text-xs text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/30"
							placeholder="+ keyword"
							value={keywordInput}
							onChange={(e) => setKeywordInput(e.target.value)}
							onKeyDown={handleAddKeyword}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
