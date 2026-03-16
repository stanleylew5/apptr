import { supabase } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export interface InterviewCategory {
  category_id: string;
  category_name: string;
  minutes: number;
  organization_id: string;
  process_id: string;
}

export interface ProcessRound {
  process_round_id: string;
  process_id: string;
  round: number;
  required_count: number;
  category_id: string;
  organization_id: string;
  category?: InterviewCategory;
}

export interface InterviewProcess {
  process_id: string;
  organization_id: string;
  process_name?: string;
  rounds?: ProcessRound[];
}

class InterviewProcessController {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase;
  }

  async getProcessesByOrganization(
    organizationId: string,
  ): Promise<InterviewProcess[]> {
    const { data, error } = await this.supabase
      .from("interview_process")
      .select("process_id, organization_id, process_name")
      .eq("organization_id", organizationId);

    if (error) {
      console.error(
        "[interviewProcessController] Error fetching interview processes:",
        error,
      );
      return [];
    }
    return data || [];
  }

  async getInterviewCategory(
    categoryId: string,
  ): Promise<InterviewCategory | null> {
    const { data, error } = await this.supabase
      .from("interview_categories")
      .select(
        "category_id, category_name, minutes, organization_id, process_id",
      )
      .eq("category_id", categoryId)
      .single();

    if (error) {
      console.error(
        "[interviewProcessController] Error fetching interview category:",
        error,
      );
      return null;
    }
    return data;
  }

  async getProcessRoundsByProcessId(
    processId: string,
  ): Promise<ProcessRound[]> {
    const { data, error } = await this.supabase
      .from("process_rounds")
      .select(
        "process_round_id, process_id, round, required_count, category_id, organization_id",
      )
      .eq("process_id", processId)
      .order("round", { ascending: true });

    if (error) {
      console.error(
        "[interviewProcessController] Error fetching process rounds:",
        error,
      );
      return [];
    }

    const roundsWithCategories = await Promise.all(
      (data || []).map(async (round) => {
        const category = await this.getInterviewCategory(round.category_id);
        return {
          process_round_id: round.process_round_id,
          process_id: round.process_id,
          round: round.round,
          required_count: round.required_count,
          category_id: round.category_id,
          organization_id: round.organization_id,
          category: category || undefined,
        };
      }),
    );

    return roundsWithCategories;
  }

  async getProcessWithRounds(
    processId: string,
  ): Promise<InterviewProcess | null> {
    const process = await this.supabase
      .from("interview_process")
      .select("process_id, organization_id, process_name")
      .eq("process_id", processId)
      .single();

    if (process.error || !process.data) {
      console.error("Error fetching process:", process.error);
      return null;
    }

    const rounds = await this.getProcessRoundsByProcessId(processId);

    return {
      ...process.data,
      rounds,
    };
  }

  async getProcessesWithRoundsByOrganization(
    organizationId: string,
  ): Promise<InterviewProcess[]> {
    const processes = await this.getProcessesByOrganization(organizationId);

    const processesWithRounds = await Promise.all(
      processes.map(async (process) => {
        const rounds = await this.getProcessRoundsByProcessId(
          process.process_id,
        );
        return {
          ...process,
          rounds,
        };
      }),
    );
    return processesWithRounds;
  }
}

export const interviewProcessController = new InterviewProcessController();
