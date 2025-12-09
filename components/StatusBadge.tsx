import { TaskStatus } from "@/types/models";

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<TaskStatus, string> = {
    not_started: "bg-gray-200 text-gray-700",
    in_progress: "bg-blue-200 text-blue-700",
    completed: "bg-green-200 text-green-700",
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

