import type { ReactNode, HTMLAttributes } from "react";

interface WazeCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
}

export function WazeCard({
  children,
  className = "",
  elevated,
  ...props
}: WazeCardProps) {
  return (
    <div
      className={`${elevated ? "waze-panel-elevated" : "waze-panel"} p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
