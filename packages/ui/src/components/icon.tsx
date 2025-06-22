// Icon component for shadcn/ui using lucide-react
import * as LucideIcons from "lucide-react";
import { cn } from "../lib/utils.js";

export type IconName = keyof typeof LucideIcons;

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className, size = 24, ...props }: IconProps) {
  const LucideIcon = LucideIcons[name];
  if (!LucideIcon || typeof LucideIcon !== "function") return null;
  // Cast to React component type to satisfy JSX
  const IconComponent = LucideIcon as React.ComponentType<any>;
  return (
    <IconComponent
      className={cn("icon", className)}
      width={size}
      height={size}
      {...props}
    />
  );
}