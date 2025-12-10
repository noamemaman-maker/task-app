export const labels = [
  {
    value: "work",
    label: "Work",
    "bg-color": "bg-[hsl(30,15%,85%)]",      // Light taupe
    "text-color": "text-[hsl(30,15%,25%)]", // Dark taupe
    "border-color": "border-[hsl(30,15%,70%)]",
  },
  {
    value: "personal",
    label: "Personal",
    "bg-color": "bg-[hsl(106,20%,75%)]",    // Medium sage green
    "text-color": "text-[hsl(106,25%,30%)]", // Dark sage
    "border-color": "border-[hsl(106,20%,65%)]",
  },
  {
    value: "shopping",
    label: "Shopping",
    "bg-color": "bg-[hsl(40,25%,92%)]",     // Warm cream
    "text-color": "text-[hsl(30,15%,35%)]", // Warm brown
    "border-color": "border-[hsl(40,20%,80%)]",
  },
  {
    value: "home",
    label: "Home",
    "bg-color": "bg-[hsl(140,15%,70%)]",    // Dark forest green
    "text-color": "text-[hsl(140,20%,25%)]", // Very dark green
    "border-color": "border-[hsl(140,15%,60%)]",
  },
  {
    value: "priority",
    label: "Priority",
    "bg-color": "bg-[hsl(30,25%,25%)]",     // Rich dark brown
    "text-color": "text-[hsl(40,20%,95%)]", // Cream white
    "border-color": "border-[hsl(30,25%,20%)]",
  },
] as const;

export type LabelType = (typeof labels)[number]["value"];

export const getLabelColors = (label: string) => {
  const labelObj = labels.find((l) => l.value === label);
  return {
    "bg-color": labelObj?.["bg-color"] || "bg-gray-500",
    "text-color": labelObj?.["text-color"] || "text-gray-500",
    "border-color": labelObj?.["border-color"] || "border-gray-500",
  };
};
