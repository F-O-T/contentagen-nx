"use client";

import { useAui } from "@assistant-ui/react";
import { CheckIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import {
	createContext,
	memo,
	useContext,
	useEffect,
	useState,
} from "react";
import type { ComponentPropsWithoutRef } from "react";
import {
	Select,
	SelectContent,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import { cn } from "@packages/ui/lib/utils";

export type ModelOption = {
	id: string;
	name: string;
	description?: string;
};

const ModelSelectorContext = createContext<{ models: ModelOption[] } | null>(
	null,
);

type RootProps = ComponentPropsWithoutRef<typeof Select> & {
	models: ModelOption[];
};

function ModelSelectorRoot({ models, children, ...props }: RootProps) {
	return (
		<ModelSelectorContext.Provider value={{ models }}>
			<Select {...props}>{children}</Select>
		</ModelSelectorContext.Provider>
	);
}

function ModelSelectorTrigger({
	className,
	...props
}: ComponentPropsWithoutRef<typeof SelectTrigger>) {
	return (
		<SelectTrigger className={cn("aui-model-selector-trigger", className)} {...props}>
			<SelectValue />
		</SelectTrigger>
	);
}

function ModelSelectorContent({
	className,
	children,
	...props
}: ComponentPropsWithoutRef<typeof SelectContent>) {
	const ctx = useContext(ModelSelectorContext);
	const models = ctx?.models ?? [];
	return (
		<SelectContent className={cn("min-w-[200px]", className)} {...props}>
			{children ??
				models.map((m) => <ModelSelectorItem key={m.id} model={m} />)}
		</SelectContent>
	);
}

type ItemProps = { model: ModelOption; className?: string };

function ModelSelectorItem({ model, className }: ItemProps) {
	return (
		<SelectPrimitive.Item
			className={cn(
				"relative flex w-full cursor-default select-none flex-col rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden",
				"focus:bg-accent focus:text-accent-foreground",
				"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className,
			)}
			textValue={model.name}
			value={model.id}
		>
			<span className="absolute right-2 flex size-3.5 items-center justify-center">
				<SelectPrimitive.ItemIndicator>
					<CheckIcon className="size-4" />
				</SelectPrimitive.ItemIndicator>
			</span>
			<SelectPrimitive.ItemText>
				<span className="font-medium">{model.name}</span>
			</SelectPrimitive.ItemText>
			{model.description && (
				<span className="mt-0.5 text-muted-foreground text-xs">
					{model.description}
				</span>
			)}
		</SelectPrimitive.Item>
	);
}

type ModelSelectorImplProps = RootProps & {
	defaultValue?: string;
	triggerClassName?: string;
};

const ModelSelectorImpl = ({
	value,
	onValueChange,
	defaultValue,
	models,
	triggerClassName,
	children,
	...props
}: ModelSelectorImplProps) => {
	const isControlled = value !== undefined;
	const [internal, setInternal] = useState(
		() => defaultValue ?? models[0]?.id ?? "",
	);
	const resolved = isControlled ? value : internal;
	const onChange = onValueChange ?? setInternal;

	const api = useAui();
	useEffect(() => {
		return api.modelContext().register({
			getModelContext: () => ({ config: { modelName: resolved } }),
		});
	}, [api, resolved]);

	return (
		<ModelSelectorRoot
			models={models}
			onValueChange={onChange}
			value={resolved}
			{...props}
		>
			{children ?? (
				<>
					<ModelSelectorTrigger className={triggerClassName} />
					<ModelSelectorContent />
				</>
			)}
		</ModelSelectorRoot>
	);
};

export const ModelSelector = Object.assign(memo(ModelSelectorImpl), {
	displayName: "ModelSelector",
	Root: ModelSelectorRoot,
	Trigger: ModelSelectorTrigger,
	Content: ModelSelectorContent,
	Item: ModelSelectorItem,
});
