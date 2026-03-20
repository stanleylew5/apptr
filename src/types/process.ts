export interface InterviewCategory {
  category_id: string;
  category_name: string;
  minutes: number;
  organization_id: string;
  process_id: string;
}

export interface ProcessRound {
  process_round_id: string;
  process_id: string;
  round: number;
  category_id: string;
  organization_id: string;
  category?: InterviewCategory;
}

export interface ProcessRoundsListProps {
  rounds: ProcessRound[];
  processId: string;
}

export interface InterviewProcess {
  process_id: string;
  organization_id: string;
  process_name?: string;
  rounds?: ProcessRound[];
}

export interface InterviewProcessCardProps {
  process: InterviewProcess;
  onScheduleComplete?: () => Promise<void> | void;
}

export interface SchedulingResult {
  success: boolean;
  scheduled: number;
  failed: Array<{ candidateName: string; round: number; categoryName: string }>;
  message: string;
}
