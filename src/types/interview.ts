export interface RawInterview {
  interview_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  interviewer_name: string | null;
  candidate_name: string | null;
  category_name: string | null;
  interviewer_confirmation: boolean;
  candidate_confirmation: boolean;
  process_round_id?: string;
}

export interface Interview {
  id: string;
  title: string;
  date: string;
  timeRange: string;
  interviewerName: string;
  candidateName: string;
  location: string;
  status: string;
  full_name: string;
  interviewer_confirmation: boolean;
  candidate_confirmation: boolean;
  process_round_id?: string;
}

export interface ScheduledInterview {
  interview_id: string;
  candidate_name: string;
  interviewer_name: string;
  category_name: string;
  round: number;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
}
