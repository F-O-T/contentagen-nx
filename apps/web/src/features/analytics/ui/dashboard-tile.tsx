import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { GripVertical, Pencil, X } from "lucide-react";

interface DashboardTileProps {
	id: string;
	insightName: string;
	size: "sm" | "md" | "lg" | "full";
	children: React.ReactNode;
	onEdit?: () => void;
	onRemove?: () => void;
}

const sizeClasses = {
	sm: "col-span-12 md:col-span-3",
	md: "col-span-12 md:col-span-6",
	lg: "col-span-12 md:col-span-9",
	full: "col-span-12",
};

export function DashboardTile({
	id,
	insightName,
	size,
	children,
	onEdit,
	onRemove,
}: DashboardTileProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(sizeClasses[size], isDragging && "opacity-50 z-10")}
		>
			<Card className="h-full">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<button
								type="button"
								className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
								{...attributes}
								{...listeners}
							>
								<GripVertical className="size-4" />
							</button>
							<CardTitle className="text-sm font-medium">
								{insightName}
							</CardTitle>
						</div>
						<div className="flex items-center gap-1">
							{onEdit && (
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									onClick={onEdit}
								>
									<Pencil className="size-3.5" />
								</Button>
							)}
							{onRemove && (
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									onClick={onRemove}
								>
									<X className="size-3.5" />
								</Button>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent>{children}</CardContent>
				<CardFooter className="text-xs text-muted-foreground pt-3">
					Sample data
				</CardFooter>
			</Card>
		</div>
	);
}
