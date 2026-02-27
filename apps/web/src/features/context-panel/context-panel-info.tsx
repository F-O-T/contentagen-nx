import { Button, type buttonVariants } from "@packages/ui/components/button";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import type { VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function ContextPanelAction({
   icon: Icon,
   label,
   onClick,
   variant = "ghost",
}: {
   icon: LucideIcon;
   label: string;
   onClick: () => void;
   variant?: VariantProps<typeof buttonVariants>["variant"];
}) {
   return (
      <Button
         className="w-full justify-start"
         onClick={onClick}
         size="sm"
         type="button"
         variant={variant}
      >
         <Icon className="size-4 shrink-0" />
         {label}
      </Button>
   );
}

export function ContextPanelMeta({
   icon: Icon,
   label,
   value,
}: {
   icon: LucideIcon;
   label: string;
   value: ReactNode;
}) {
   return (
      <Item className="px-0" size="sm">
         <ItemMedia variant="icon">
            <Icon />
         </ItemMedia>
         <ItemContent>
            <ItemTitle>{label}</ItemTitle>
         </ItemContent>
         <ItemActions>
            <span className="text-sm text-muted-foreground">{value}</span>
         </ItemActions>
      </Item>
   );
}

export function ContextPanelDivider() {
   return <ItemSeparator className="mx-2 my-1" />;
}
