import { type VariantProps } from "class-variance-authority";
import type * as React from "react";
declare const buttonVariants: (
   props?:
      | ({
           size?: "default" | "icon" | "lg" | "sm" | null | undefined;
           variant?:
              | "default"
              | "destructive"
              | "ghost"
              | "link"
              | "outline"
              | "secondary"
              | null
              | undefined;
        } & import("class-variance-authority/types").ClassProp)
      | undefined,
) => string;
declare function Button({
   className,
   variant,
   size,
   asChild,
   ...props
}: React.ComponentProps<"button"> &
   VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
   }): import("react/jsx-runtime").JSX.Element;
export { Button, buttonVariants };
//# sourceMappingURL=button.d.ts.map
