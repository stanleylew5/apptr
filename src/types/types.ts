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
  candidate_id: string;
  interviewer_id: string;

  candidate_user_id: string;
  interviewer_user_id: string;

  scheduled_start: string;
  scheduled_end: string;
  status: string;

  candidate_name: string | null;
  interviewer_name: string | null;

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
