import type { PropsWithChildren } from "react";

interface WorkflowCardProps extends PropsWithChildren {
  startIndex: number;
  endIndex: number;
}

export function WorkflowCard({ children }: WorkflowCardProps) {
  return <div className="flex flex-col gap-0.5 py-0.5">{children}</div>;
}
