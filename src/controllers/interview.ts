import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Interview } from "@/types/interview";
import { createCalendarEvent } from "@/lib/googleCalendar";

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
          location,
          interviewer_confirmation,
          candidate_confirmation,
          candidates(full_name),
          interviewers(users(full_name))
        `,
        )
        .neq("status", "unscheduled")
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
        location: item.location ?? "To be updated by interviewer",
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

  // Confirm an interview for a user
  async confirmInterview(interviewId: string, role: string): Promise<boolean> {
    try {
      const updateData: Record<string, boolean> = {};

      if (role === "candidate") {
        updateData.candidate_confirmation = true;
      } else if (role === "interviewer") {
        updateData.interviewer_confirmation = true;
      }

      const { error, data } = await this.supabase
        .from("interviews")
        .update(updateData)
        .eq("interview_id", interviewId)
        .select("status, interviewer_confirmation, candidate_confirmation")
        .single();

      if (error) {
        console.error(`[confirmInterview] Error confirming interview:`, error);
        throw error;
      }

      if (data?.interviewer_confirmation && data?.candidate_confirmation) {
        // const { error: statusError } = await this.supabase
        await this.supabase
          .from("interviews")
          .update({ status: "confirmed" })
          .eq("interview_id", interviewId);

        if (role === "interviewer") {
          const { data: fullInterview } = await this.supabase
            .from("interviews")
            .select(
              `
              *,
              candidates(email)
            `,
            )
            .eq("interview_id", interviewId)
            .single();

          if (fullInterview && !fullInterview.calendar_event_created) {
            await createCalendarEvent({
              scheduled_start: fullInterview.scheduled_start,
              scheduled_end: fullInterview.scheduled_end,
              location: fullInterview.location,
              candidate: {
                email: fullInterview.candidates?.email,
              },
            });

            await this.supabase
              .from("interviews")
              .update({ calendar_event_created: true })
              .eq("interview_id", interviewId);

            console.log(`[confirmInterview] Calendar event created`);
          }
        }
      }

      return true;
    } catch (error) {
      console.error(`[confirmInterview] Unexpected error:`, error);
      throw error;
    }
  }

  // Reject an interview for a user
  async rejectInterview(interviewId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("interviews")
        .update({ status: "rejected" })
        .eq("interview_id", interviewId)
        .select("status, interviewer_confirmation, candidate_confirmation")
        .single();

      //const { error } = await this.supabase
      //  .from("interviews")
      //  .update(updateData)
      //  .eq("interview_id", interviewId)
      //  .select("status, interviewer_confirmation, candidate_confirmation")
      //  .single();

      if (error) {
        console.error(`[rejectInterview] Error Rejecting Interview`, error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`[rejectInterview] Unexpected error`, error);
      throw error;
    }
  }

  // Update interview location
  async updateInterviewLocation(
    interviewId: string,
    newLocation: string,
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("interviews")
        .update({ location: newLocation })
        .eq("interview_id", interviewId);

      if (error) {
        console.error(
          `[updateInterviewLocation] Error updating location:`,
          error,
        );
        throw error;
      }
      return true;
    } catch (error) {
      console.error(`[updateInterviewLocation] Unexpected error:`, error);
      throw error;
    }
  }
}

export const interviewController = new InterviewController();

export default InterviewController;
