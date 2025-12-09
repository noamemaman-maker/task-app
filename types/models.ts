import { Database } from "@/lib/database.types";

// Task Status type
export type TaskStatus = 
  | "not_started" 
  | "in_progress" 
  | "completed";

// Database Models
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Extended User type that includes additional fields not in the database
export type User = Profile & {
  email: string;
  tasks_created: number;
};
