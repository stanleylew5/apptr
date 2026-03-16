import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Interview, RawInterview } from "@/types/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

class InterviewController {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Fetch number of interviews for a candidate
  async getInterviewCountCandidate(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("interviews")
        .select("interview_id", { count: "exact", head: true })
        .eq("candidate_id", userId);

      if (error) {
        console.error("Error fetching interview count:", error.message);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error("Unexpected error getting interview count:", error);
      throw error;
    }
  }

  async getInterviewCountInterviewer(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("interviews")
        .select("interview_id", { count: "exact", head: true })
        .eq("interviewer_id", userId);

      if (error) {
        console.error("Error fetching interview count:", error.message);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error("Unexpected error getting interview count:", error);
      throw error;
    }
  }

  // Fetch all appts and appt info for a candidate and put into an interview array
  async getCandidateInterviews(
    userId: string,
    role: string,
  ): Promise<Interview[]> {
    const { data, error } = await this.supabase
      .from("interview_details")
      .select("*")
      .eq("candidate_id", userId)
      .order("scheduled_start", { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map((item) => this.mapRawInterview(item, role));
  }

  // Format a raw interview to be used in the frontend
  private mapRawInterview(item: RawInterview, role: string): Interview {
    const start = new Date(item.scheduled_start);
    const end = new Date(item.scheduled_end);

    return {
      id: item.interview_id,
      title:
        (item.interviewer_name ?? "Unknown") +
        " & " +
        (item.candidate_name ?? "Unknown"),
      date: start.toLocaleDateString(),
      timeRange: `${start.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${end.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      interviewerName:
        role === "candidate"
          ? (item.interviewer_name ?? "Unknown")
          : (item.candidate_name ?? "Unknown"),
      candidateName: item.candidate_name ?? "Unknown",
      location: "Virtual - Zoom Link",
      status: item.status,
      interviewer_confirmation: item.interviewer_confirmation ?? false,
      candidate_confirmation: item.candidate_confirmation ?? false,
    };
  }
}

export const interviewController = new InterviewController();

export default InterviewController;
