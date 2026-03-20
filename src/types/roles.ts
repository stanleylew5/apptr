import { LucideIcon } from "lucide-react";

export interface RoleCardProps {
  title: string;
  description: string;
  bullets: string[];
  roleType: "coordinator" | "interviewer" | "candidate";
  linkText: string;
  icon: LucideIcon;
  onSelectRole: (role: "coordinator" | "interviewer" | "candidate") => void;
  isLoading?: boolean;
}
