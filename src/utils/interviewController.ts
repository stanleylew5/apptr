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

  //Fetch number of interviews for a candidate
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

  // Fetch all appts and appt info for a candidate and put into an interview array 
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

    return data.map((item) => this.mapRawInterview(item as RawInterview));
  }

  // Format a raw interview to be used in the frontend
  private mapRawInterview(item: RawInterview): Interview {
    const start = new Date(item.scheduled_start);
    const end = new Date(item.scheduled_end);

    return {
      id: item.interview_id,
      title:
        item.process_round?.[0]?.interview_category?.[0]?.category_name ??
        "Unknown",
      date: start.toLocaleDateString(),
      timeRange: `${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`,
      interviewerName:
        item.interviewer?.[0]?.full_name ?? "Unknown",
      location: "Virtual - Zoom Link",
      status: item.status,
    };
  }
}

export const interviewController = new InterviewController();

export default InterviewController;