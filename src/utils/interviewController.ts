import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

class InterviewController {
    private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  //TODO: create function for interviewer count aswell
  async getInterviewCountCandidate(userId: string): Promise<number> {
    try {
        const { count, error } = await this.supabase
        .from("interviews")
        .select("interview_id", { count: "exact", head: true })
        .eq("candidate_id", userId);

        if (error) {
        console.error("Error fetching interview count:", error.message);
        return 0;
        }

        return count || 0;
    } catch (error) {
        console.error("Unexpected error getting interview count:", error);
        return 0;
    }
  }
}

export const interviewController = new InterviewController();

export default InterviewController;