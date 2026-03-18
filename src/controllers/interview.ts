import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Interview } from "@/types/interview";

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
      const { data: candidateData, error: candidateError } = await this.supabase
        .from("candidates")
        .select("candidate_id")
        .eq("user_id", userId);

      if (candidateError) {
        console.error("Error fetching candidate_id:", candidateError.message);
        throw candidateError;
      }

      if (!candidateData || candidateData.length === 0) {
        return 0;
      }

      const candidateIds = candidateData.map((c) => c.candidate_id);
      const { count, error } = await this.supabase
        .from("interviews")
        .select("interview_id", { count: "exact", head: true })
        .in("candidate_id", candidateIds);

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
      const { data: interviewerData, error: interviewerError } =
        await this.supabase
          .from("interviewers")
          .select("interviewer_id")
          .eq("user_id", userId);

      if (interviewerError) {
        console.error(
          "Error fetching interviewer_id:",
          interviewerError.message,
        );
        throw interviewerError;
      }

      if (!interviewerData || interviewerData.length === 0) {
        return 0;
      }

      const interviewerIds = interviewerData.map((i) => i.interviewer_id);
      const { count, error } = await this.supabase
        .from("interviews")
        .select("interview_id", { count: "exact", head: true })
        .in("interviewer_id", interviewerIds);

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

  // Fetch all appts and appt info for a user and put into an interview array
  async getUserInterviews(userId: string, role: string): Promise<Interview[]> {
    try {
      let recordIds: string[] = [];

      // Get the candidate_id or interviewer_id for this user_id
      if (role === "candidate") {
        const { data: candidateData, error: candidateError } =
          await this.supabase
            .from("candidates")
            .select("candidate_id")
            .eq("user_id", userId);

        if (candidateError) throw candidateError;
        recordIds = candidateData?.map((c) => c.candidate_id) || [];
      } else if (role === "interviewer") {
        const { data: interviewerData, error: interviewerError } =
          await this.supabase
            .from("interviewers")
            .select("interviewer_id")
            .eq("user_id", userId);

        if (interviewerError) throw interviewerError;
        recordIds = interviewerData?.map((i) => i.interviewer_id) || [];
      }

      if (recordIds.length === 0) return [];

      // Now fetch interviews using the record IDs
      let query = this.supabase
        .from("interviews")
        .select(
          `
          interview_id,
          status,
          scheduled_start,
          scheduled_end,
          candidates(full_name),
          interviewers(users(full_name))
        `,
        )
        .order("scheduled_start", { ascending: true });

      if (role === "candidate") {
        query = query.in("candidate_id", recordIds);
      } else if (role === "interviewer") {
        query = query.in("interviewer_id", recordIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return [];

      return data.map((item) => this.mapRawInterview(item, role));
    } catch (error) {
      console.error(`[getUserInterviews] Unexpected error:`, error);
      throw error;
    }
  }

  // Format a raw interview to be used in the frontend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRawInterview(item: any, role: string): Interview {
    try {
      const start = new Date(item.scheduled_start);
      const end = new Date(item.scheduled_end);

      const candidateName = item.candidates?.full_name ?? "Unknown";
      const interviewerName = item.interviewers?.users?.full_name ?? "Unknown";

      const interview: Interview = {
        id: item.interview_id,
        title: interviewerName + " & " + candidateName,
        date: start.toLocaleDateString(),
        timeRange: `${start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        interviewerName: role === "candidate" ? interviewerName : candidateName,
        candidateName: candidateName,
        location: "Virtual - Zoom Link",
        status: item.status,
        full_name: interviewerName,
        interviewer_confirmation: item.interviewer_confirmation ?? false,
        candidate_confirmation: item.candidate_confirmation ?? false,
      };

      return interview;
    } catch (error) {
      console.error(`[mapRawInterview] Error mapping interview:`, error, item);
      throw error;
    }
  }
}

export const interviewController = new InterviewController();

export default InterviewController;
