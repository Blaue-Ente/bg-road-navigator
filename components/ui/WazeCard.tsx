import type { ReactNode } from "react";

interface WazeCardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
}

export function WazeCard({ children, className = "", elevated }: WazeCardProps) {
  return (
    <div
      className={`${elevated ? "waze-panel-elevated" : "waze-panel"} p-4 ${className}`}
    >
      {children}
    </div>
  );
}
