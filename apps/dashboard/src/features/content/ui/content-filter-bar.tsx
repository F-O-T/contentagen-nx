import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import { Search, X } from "lucide-react";

type ContentFilterBarProps = {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusFilterChange: (value: string) => void;
	hasActiveFilters: boolean;
	onClearFilters: () => void;
};

export function ContentFilterBar({
	searchTerm,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	hasActiveFilters,
	onClearFilters,
}: ContentFilterBarProps) {
	return (
		<div className="flex flex-col sm:flex-row gap-3 pt-4">
			<div className="relative flex-1 sm:max-w-md">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					className="pl-9"
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder={"Buscar conteúdos..."}
					type="search"
					value={searchTerm}
				/>
			</div>

			<Select value={statusFilter} onValueChange={onStatusFilterChange}>
				<SelectTrigger className="w-full sm:w-[150px]">
					<SelectValue placeholder={"Status"} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{"Todos os status"}
					</SelectItem>
					<SelectItem value="draft">
						<Badge className="bg-amber-500/10 text-amber-600 border-amber-200" variant="outline">
							{"Rascunho"}
						</Badge>
					</SelectItem>
					<SelectItem value="published">
						<Badge className="bg-green-500/10 text-green-600 border-green-200" variant="outline">
							{"Publicado"}
						</Badge>
					</SelectItem>
					<SelectItem value="archived">
						<Badge className="bg-slate-500/10 text-slate-600 border-slate-200" variant="outline">
							{"Arquivado"}
						</Badge>
					</SelectItem>
				</SelectContent>
			</Select>

			{hasActiveFilters && (
				<Button
					className="shrink-0"
					onClick={onClearFilters}
					size="sm"
					variant="ghost"
				>
					<X className="mr-1 size-4" />
					{"Limpar filtros"}
				</Button>
			)}
		</div>
	);
}
