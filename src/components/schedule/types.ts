//TODO: Add location column to interviews table in DB and add it to this type
export type RawInterview = {
  interview_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  interviewer_name: string | null;
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