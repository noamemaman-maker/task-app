import { TaskStatus } from "@/types/models";

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<TaskStatus, string> = {
    not_started: "bg-[hsl(30,15%,85%)] text-[hsl(30,15%,30%)]",      // Light taupe
    in_progress: "bg-[hsl(106,20%,75%)] text-[hsl(106,25%,30%)]",  // Medium sage green
    completed: "bg-[hsl(140,15%,70%)] text-[hsl(140,20%,25%)]",    // Dark forest green
  };

  const displayText = status.replace("_", " ");

  return (
    <span
      className={`px-2 py-1 rounded text-sm font-medium ${styles[status]}`}
    >
      {displayText}
    </span>
  );
}

