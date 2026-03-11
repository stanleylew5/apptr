export interface User {
  user_id: string;
  email: string;
  full_name: string;
  coordinator?: boolean;
  interviewer?: boolean;
  candidate?: boolean;
}

export type RawInterview = {
  interview_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  interviewer_name: string | null;
  candidate_name: string | null;
  category_name: string | null;
};

export interface Interview {
  id: string;
  title: string;
  date: string;
  timeRange: string;
  interviewerName: string;
  location: string;
  status: string;
}