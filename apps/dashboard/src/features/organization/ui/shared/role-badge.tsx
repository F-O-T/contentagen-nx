import { Badge } from "@packages/ui/components/badge";
import { cn } from "@packages/ui/lib/utils";
import { Crown, Shield, User } from "lucide-react";

type Role = "owner" | "admin" | "member";

interface RoleBadgeProps {
   role: Role | string;
   showIcon?: boolean;
   className?: string;
}

const roleConfig: Record<
   Role,
   {
      icon: typeof Crown;
      className: string;
      label: string;
   }
> = {
   owner: {
      icon: Crown,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      label: "Proprietário",
   },
   admin: {
      icon: Shield,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      label: "Administrador",
   },
   member: {
      icon: User,
      className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
      label: "Membro",
   },
};

export function RoleBadge({
   role,
   showIcon = true,
   className,
}: RoleBadgeProps) {
   const normalizedRole = role.toLowerCase() as Role;
   const config = roleConfig[normalizedRole] || roleConfig.member;
   const Icon = config.icon;

   return (
      <Badge className={cn(config.className, className)} variant="outline">
         {showIcon && <Icon className="size-3" />}
         <span>{config.label}</span>
      </Badge>
   );
}

export { roleConfig };
