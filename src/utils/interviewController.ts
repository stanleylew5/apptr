import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Interview, RawInterview } from "../components/schedule/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

class InterviewController {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  //TODO: create function for interviewer appt count aswell
  async getInterviewCountCandidate(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("interviews")
        .select("interview_id", { count: "exact", head: true })
        .eq("candidate_id", userId);

      if (error) {
        console.error("Error fetching interview count:", error.message);
        // return 0;
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error("Unexpected error getting interview count:", error);
      // return 0;
      throw error;
    }
  }

  async getCandidateInterviews(userId: string): Promise<Interview[]> {
    const { data, error } = await this.supabase
      .from("interviews")
      .select(`
        interview_id,
        scheduled_start,
        scheduled_end,
        status,
        interviewer:users!interviews_interviewer_id_fkey (
          full_name
        ),
        process_round:process_rounds (
          interview_category:interview_categories (
            category_name
          )
        )
      `)
      .eq("candidate_id", userId)
      .order("scheduled_start", { ascending: true });

    if (error) throw error;

    if (!data) return [];

    const raw = data as RawInterview[];

    const formatted: Interview[] = raw.map((item) => ({
      interview_id: item.interview_id,
      scheduled_start: item.scheduled_start,
      scheduled_end: item.scheduled_end,
      status: item.status,
      interviewer: {
        full_name: item.interviewer?.[0]?.full_name ?? "Unknown",
      },
      process_round: {
        interview_category: {
          category_name:
            item.process_round?.[0]?.interview_category?.[0]?.category_name ??
            "Unknown",
        },
      },
    }));

    return formatted;
  }
}

export const interviewController = new InterviewController();

export default InterviewController;