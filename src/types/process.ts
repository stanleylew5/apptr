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

export interface InterviewProcess {
  process_id: string;
  organization_id: string;
  process_name?: string;
  rounds?: ProcessRound[];
}
