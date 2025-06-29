import { cn } from "@packages/ui/lib/utils";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@packages/ui/components/alert";

export interface SimilarityBannerProps {
  similarity: number;
  category: "success" | "info" | "warning" | "error";
  message: string;
  className?: string;
}

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
} as const;

const variantMap = {
  success: "default",
  info: "default", 
  warning: "destructive",
  error: "destructive",
} as const;

export function SimilarityBanner({ 
  similarity, 
  category, 
  message, 
  className 
}: SimilarityBannerProps) {
  const Icon = iconMap[category];
  const variant = variantMap[category];
  
  return (
    <Alert 
      variant={variant}
      className={cn(
        "border-l-4",
        {
          "border-l-green-500 bg-green-50 text-green-800": category === "success",
          "border-l-blue-500 bg-blue-50 text-blue-800": category === "info", 
          "border-l-yellow-500 bg-yellow-50 text-yellow-800": category === "warning",
          "border-l-red-500 bg-red-50 text-red-800": category === "error",
        },
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <span className="text-xs font-mono bg-black/10 px-2 py-1 rounded">
          {Math.round(similarity * 100)}% similarity
        </span>
      </AlertDescription>
    </Alert>
  );
}
