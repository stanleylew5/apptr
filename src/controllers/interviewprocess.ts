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

  async createInterviewProcess(
    organizationId: string,
    organizationName: string,
    processName: string,
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("interview_process")
      .insert([
        {
          organization_id: organizationId,
          process_name: processName,
        },
      ])
      .select("process_id")
      .single();

    if (error) {
      console.error(
        "[interviewProcessController] Error creating interview process:",
        error,
      );
      return null;
    }

    return data?.process_id || null;
  }

  async createInterviewCategories(
    organizationId: string,
    processId: string,
    categories: Array<{ name: string; duration: number }>,
  ): Promise<Record<string, string>> {
    const categoryMap: Record<string, string> = {};

    for (const category of categories) {
      const { data, error } = await this.supabase
        .from("interview_categories")
        .insert([
          {
            organization_id: organizationId,
            process_id: processId,
            category_name: category.name,
            minutes: category.duration,
          },
        ])
        .select("category_id, category_name")
        .single();

      if (error) {
        console.error(
          "[interviewProcessController] Error creating interview category:",
          error,
        );
      } else if (data) {
        categoryMap[category.name] = data.category_id;
      }
    }

    return categoryMap;
  }

  async createProcessRounds(
    organizationId: string,
    processId: string,
    candidates: Array<{
      name: string;
      email: string;
      interviewRequirements: Array<{ type: string; count: number | string }>;
    }>,
    categoryMap: Record<string, string>,
  ): Promise<Record<string, string[]>> {
    // Map to store process_round_id arrays per category (indexed by category name)
    // e.g., { "HR": ["round-id-1", "round-id-2"], "Technical": ["round-id-1"] }
    const processRoundsByCategory: Record<string, string[]> = {};

    // Count total interviews needed per category
    const interviewCountByCategory: Record<string, number> = {};
    for (const candidate of candidates) {
      for (const requirement of candidate.interviewRequirements) {
        const count = parseInt(requirement.count.toString()) || 0;
        if (count > 0) {
          interviewCountByCategory[requirement.type] =
            (interviewCountByCategory[requirement.type] || 0) + count;
        }
      }
    }

    // Create process_round rows for each interview round needed per category
    for (const [categoryName, totalCount] of Object.entries(
      interviewCountByCategory,
    )) {
      const categoryId = categoryMap[categoryName];
      if (!categoryId) {
        console.warn(
          `[interviewProcessController] No category ID found for: ${categoryName}`,
        );
        continue;
      }

      const roundIds: string[] = [];
      for (let round = 1; round <= totalCount; round++) {
        const { data, error } = await this.supabase
          .from("process_rounds")
          .insert([
            {
              organization_id: organizationId,
              process_id: processId,
              category_id: categoryId,
              round: round,
            },
          ])
          .select("process_round_id")
          .single();

        if (error) {
          console.error(
            "[interviewProcessController] Error creating process round:",
            error,
          );
        } else if (data) {
          roundIds.push(data.process_round_id);
        }
      }

      processRoundsByCategory[categoryName] = roundIds;
    }

    return processRoundsByCategory;
  }

  async createCandidates(
    organizationId: string,
    processId: string,
    candidatesData: Array<{
      name: string;
      email: string;
      interviewRequirements: Array<{ type: string; count: number | string }>;
    }>,
  ): Promise<Record<string, string>> {
    // Map to store candidate_id indexed by candidate name
    const candidateMap: Record<string, string> = {};

    for (const candidate of candidatesData) {
      const { data, error } = await this.supabase
        .from("candidates")
        .insert([
          {
            organization_id: organizationId,
            full_name: candidate.name,
            email: candidate.email,
            process_id: processId,
          },
        ])
        .select("candidate_id")
        .single();

      if (error) {
        console.error(
          "[interviewProcessController] Error creating candidate:",
          error,
        );
      } else if (data) {
        candidateMap[candidate.name] = data.candidate_id;
      }
    }

    return candidateMap;
  }

  async createInterviews(
    organizationId: string,
    candidates: Array<{
      name: string;
      email: string;
      interviewRequirements: Array<{ type: string; count: number | string }>;
    }>,
    candidateMap: Record<string, string>,
    processRoundsByCategory: Record<string, string[]>,
  ): Promise<boolean> {
    // For each candidate, create interview records for their requirements
    for (const candidate of candidates) {
      const roundIndexPerCategory: Record<string, number> = {};

      for (const requirement of candidate.interviewRequirements) {
        const count = parseInt(requirement.count.toString()) || 0;
        const candidateId = candidateMap[candidate.name];
        const roundIds = processRoundsByCategory[requirement.type] || [];

        if (!candidateId) {
          console.warn(
            `[interviewProcessController] No candidate ID found for: ${candidate.name}`,
          );
          continue;
        }

        if (roundIds.length === 0) {
          console.warn(
            `[interviewProcessController] No process rounds found for category: ${requirement.type}`,
          );
          continue;
        }

        // Create interview records for each round this candidate needs for this category
        const currentRoundIndex = roundIndexPerCategory[requirement.type] || 0;
        for (let i = 0; i < count; i++) {
          const roundIndex = currentRoundIndex + i;
          if (roundIndex >= roundIds.length) {
            console.warn(
              `[interviewProcessController] Not enough process rounds for candidate ${candidate.name}, category ${requirement.type}`,
            );
            break;
          }

          const { error } = await this.supabase.from("interviews").insert([
            {
              organization_id: organizationId,
              candidate_id: candidateId,
              process_round_id: roundIds[roundIndex],
              status: "unscheduled",
              scheduled_start: null,
              scheduled_end: null,
              interview_confirmation: false,
              candidate_confirmation: false,
            },
          ]);

          if (error) {
            console.error(
              "[interviewProcessController] Error creating interview:",
              error,
            );
          }
        }

        roundIndexPerCategory[requirement.type] = currentRoundIndex + count;
      }
    }

    return true;
  }

  async assignInterviewersToCategories(
    organizationId: string,
    interviewerAssignments: Array<{
      interviewerUserId: string;
      interviewType: string;
    }>,
    categoryMap: Record<string, string>,
  ): Promise<boolean> {
    for (const assignment of interviewerAssignments) {
      const categoryId = categoryMap[assignment.interviewType];
      if (!categoryId) {
        console.warn(
          `[interviewProcessController] No category found for type: ${assignment.interviewType}`,
        );
        continue;
      }

      const { error } = await this.supabase.from("interviewers").insert([
        {
          organization_id: organizationId,
          user_id: assignment.interviewerUserId,
          category_id: categoryId,
        },
      ]);

      if (error) {
        console.error(
          "[interviewProcessController] Error assigning interviewer:",
          error,
        );
      }
    }

    return true;
  }
}

export const interviewProcessController = new InterviewProcessController();
