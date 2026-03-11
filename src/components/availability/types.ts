import { LucideIcon } from "lucide-react";

export type ViewMode = "schedule" | "availability";

export type Half = "top" | "bottom";

export interface CellAvailability {
  top: boolean;
  bottom: boolean;
}

export interface AvailabilityType {
  [dateKey: string]: {
    [hour: number]: CellAvailability;
  };
}

export type DragState = {
  active: boolean;
  targetValue: boolean;
  visited: Set<string>;
} | null;

export interface TimeBlock {
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // 24-hour format (HH:mm)
  endTime: string; // 24-hour format (HH:mm)
}

export interface PageHeaderProps {
  description: string;
  linkPath: string;
  linkText: string;
  icon: LucideIcon;
}

export interface CellProps {
  dateKey: string;
  hour: number;
  value: CellAvailability;
  onApply: (dateKey: string, hour: number, half: Half, value: boolean) => void;
  dragState: DragState;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
}
