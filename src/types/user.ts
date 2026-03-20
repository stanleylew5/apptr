export interface User {
  user_id: string;
  email: string;
  full_name: string;
  coordinator?: boolean;
  interviewer?: boolean;
  candidate?: boolean;
}

export type ViewMode = "schedule" | "availability";
