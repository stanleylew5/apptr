export type RawInterview = {
  interview_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  interviewer: { full_name: string }[];
  process_round: {
    interview_category: { category_name: string }[];
  }[];
};

export interface Interview {
  interview_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  interviewer: {
    full_name: string;
  };
  process_round: {
    interview_category: {
      category_name: string;
    };
  };
}