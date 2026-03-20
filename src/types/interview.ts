export interface RawInterview {
  interview_id: string;
  candidate_id: string;
  interviewer_id: string;

  candidate_user_id: string;
  interviewer_user_id: string;

  scheduled_start: string;
  scheduled_end: string;
  status: string;
  location: string | null;

  candidate_name: string | null;
  interviewer_name: string | null;

  category_name: string | null;

  interviewer_confirmation: boolean | null;
  candidate_confirmation: boolean | null;
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
  location: string | null;
}

export interface InterviewCardProps {
  interview: {
    interview_id: string;
    candidate_name: string;
    interviewer_name: string | null;
    category_name: string;
    round: number;
    scheduled_start: string | null;
    scheduled_end: string | null;
    status: string;
    interviewer_confirmation: boolean;
    candidate_confirmation: boolean;
  };
}

export interface ScheduledDashboardProps {
  organizationId: string;
}
