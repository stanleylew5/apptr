export interface User {
  user_id: string;
  email: string;
  full_name: string;
  coordinator?: boolean;
  interviewer?: boolean;
  candidate?: boolean;
}

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
  interviewer_confirmation: boolean;
  candidate_confirmation: boolean;
  process_round_id?: string;
}

export interface Organization {
  organization_id: string;
  organization_name: string;
  created_by: string;
}

export type OrganizationMemberRow = {
  organizations: {
    organization_id: string;
    organization_name: string;
    created_by: string;
  } | null;
};
