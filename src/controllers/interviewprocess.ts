import { supabase } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { availabilityController } from "./availability";

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

export interface ScheduledInterview {
  interview_id: string;
  candidate_name: string;
  interviewer_name: string;
  category_name: string;
  round: number;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
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
        "process_round_id, process_id, round, category_id, organization_id",
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
          category_id: round.category_id,
          organization_id: round.organization_id,
          category: category || undefined,
        };
      }),
    );

    return roundsWithCategories;
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

  async getScheduledInterviewsForProcess(
    processId: string,
  ): Promise<ScheduledInterview[]> {
    // First, get all process_round_ids for this process
    const { data: roundsData, error: roundsError } = await this.supabase
      .from("process_rounds")
      .select("process_round_id")
      .eq("process_id", processId);

    if (roundsError) {
      console.error(
        "[getScheduledInterviews] Error fetching rounds:",
        roundsError,
      );
      return [];
    }

    if (!roundsData || roundsData.length === 0) {
      return [];
    }

    const roundIds = roundsData.map((r) => r.process_round_id);

    // Get all scheduled interviews for these rounds
    const { data, error } = await this.supabase
      .from("interviews")
      .select(
        `
        interview_id,
        status,
        scheduled_start,
        scheduled_end,
        process_rounds(round, interview_categories(category_name)),
        candidates(full_name),
        users(full_name)
      `,
      )
      .in("process_round_id", roundIds)
      .eq("status", "scheduled")
      .not("scheduled_start", "is", null)
      .not("scheduled_end", "is", null)
      .order("scheduled_start", { ascending: true });

    if (error) {
      console.error("[getScheduledInterviews] Error:", error);
      return [];
    }

    if (!data) return [];

    // Flatten the nested structure
    const scheduled: ScheduledInterview[] = [];

    for (const interview of data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iv = interview as any;
      const category = iv.process_rounds?.interview_categories;
      const candidate = iv.candidates;
      const interviewer = iv.users;

      if (!category || !candidate) continue;

      scheduled.push({
        interview_id: iv.interview_id,
        candidate_name: candidate?.full_name || "Unknown",
        interviewer_name: interviewer?.full_name || "Unknown",
        category_name: category?.category_name || "Unknown",
        round: iv.process_rounds?.round || 0,
        scheduled_start: iv.scheduled_start,
        scheduled_end: iv.scheduled_end,
        status: iv.status,
      });
    }

    return scheduled;
  }

  async createInterviewProcess(
    organizationId: string,
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
      console.error("Error creating interview process:", error);
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
        console.error("Error creating interview category:", error);
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
    // map to store process_round_id arrays per category
    // ex: { "HR": ["round-id-1", "round-id-2"], "Technical": ["round-id-1"] }
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
        console.warn(`No category ID found for: ${categoryName}`);
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
          console.error("Error creating process round:", error);
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
      userId?: string;
      interviewRequirements: Array<{ type: string; count: number | string }>;
    }>,
  ): Promise<Record<string, string>> {
    // Map to store candidate_id indexed by candidate name
    const candidateMap: Record<string, string> = {};

    for (const candidate of candidatesData) {
      let userId = candidate.userId || null;

      // If no userId provided, try to lookup by email in users table
      if (!userId && candidate.email) {
        console.log(
          `[createCandidates] No userId for ${candidate.name}, looking up by email: ${candidate.email}`,
        );
        const { data: userResult, error: userError } = await this.supabase
          .from("users")
          .select("id")
          .eq("email", candidate.email)
          .single();

        if (!userError && userResult) {
          userId = userResult.id;
          console.log(
            `[createCandidates] Found user_id for ${candidate.name}: ${userId}`,
          );
        } else {
          console.warn(
            `[createCandidates] Could not find user for email ${candidate.email}`,
          );
        }
      }

      const { data, error } = await this.supabase
        .from("candidates")
        .insert([
          {
            organization_id: organizationId,
            user_id: userId,
            full_name: candidate.name,
            email: candidate.email,
            process_id: processId,
          },
        ])
        .select("candidate_id")
        .single();

      if (error) {
        console.error("Error creating candidate:", error);
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
    for (const candidate of candidates) {
      const roundIndexPerCategory: Record<string, number> = {};

      for (const requirement of candidate.interviewRequirements) {
        const count = parseInt(requirement.count.toString()) || 0;
        const candidateId = candidateMap[candidate.name];
        const roundIds = processRoundsByCategory[requirement.type] || [];

        if (!candidateId) {
          console.warn(`No candidate ID found for: ${candidate.name}`);
          continue;
        }

        if (roundIds.length === 0) {
          console.warn(
            `No process rounds found for category: ${requirement.type}`,
          );
          continue;
        }

        // Create interview records for each round this candidate needs for this category
        const currentRoundIndex = roundIndexPerCategory[requirement.type] || 0;
        for (let i = 0; i < count; i++) {
          const roundIndex = currentRoundIndex + i;
          if (roundIndex >= roundIds.length) {
            console.warn(
              `Not enough process rounds for candidate ${candidate.name}, category ${requirement.type}`,
            );
            break;
          }

          const interviewData = {
            candidate_id: candidateId,
            process_round_id: roundIds[roundIndex],
            status: "unscheduled",
            scheduled_start: null,
            scheduled_end: null,
            interviewer_confirmation: false,
            candidate_confirmation: false,
          };

          const { error } = await this.supabase
            .from("interviews")
            .insert([interviewData])
            .select();
          if (error) console.error("Error creating interview:", error);
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
        console.warn(`No category found for type: ${assignment.interviewType}`);
        continue;
      }

      const { error } = await this.supabase.from("interviewers").insert([
        {
          organization_id: organizationId,
          user_id: assignment.interviewerUserId,
          category_id: categoryId,
        },
      ]);

      if (error) console.error("Error assigning interviewer:", error);
    }

    return true;
  }
  // Auto-scheduling methods

  async autoScheduleInterviews(processId: string): Promise<{
    success: boolean;
    scheduled: number;
    failed: Array<{
      candidateName: string;
      round: number;
      categoryName: string;
    }>;
    message: string;
  }> {
    try {
      console.log(
        `[autoSchedule] Starting auto-schedule for process: ${processId}`,
      );

      // Get all unscheduled interviews for this process with details
      const unscheduledInterviews =
        await this.getUnscheduledInterviewsForProcess(processId);

      console.log(
        `[autoSchedule] Found ${unscheduledInterviews.length} unscheduled interviews`,
      );
      unscheduledInterviews.forEach((iv) => {
        console.log(
          `  - Interview ${iv.interview_id}: Candidate ${iv.candidate_id}, Category ${iv.category_name}, Round ${iv.round}`,
        );
      });

      if (unscheduledInterviews.length === 0) {
        return {
          success: true,
          scheduled: 0,
          failed: [],
          message: "No unscheduled interviews found for this process",
        };
      }

      // Track interviewer loads for load balancing
      const interviewerLoadMap: Record<string, number> = {};

      // Group interviews by candidate_id to get candidate info
      const interviewsByCandidate = this.groupBy(
        unscheduledInterviews,
        "candidate_id",
      );
      console.log(
        `[autoSchedule] Grouped into ${Object.keys(interviewsByCandidate).length} candidates`,
      );

      const failed: Array<{
        candidateName: string;
        round: number;
        categoryName: string;
      }> = [];
      let scheduled = 0;

      // Process each candidate's interviews
      for (const [candidateId, candidateInterviews] of Object.entries(
        interviewsByCandidate,
      )) {
        console.log(`\n[autoSchedule] Processing candidate: ${candidateId}`);

        // Get candidate details
        const candidateData = await this.supabase
          .from("candidates")
          .select("full_name, user_id, candidate_id, email")
          .eq("candidate_id", candidateId)
          .single();

        console.log(
          `[autoSchedule] Fetching candidate data for candidate_id: ${candidateId}`,
        );
        console.log(`[autoSchedule] Candidate fetch result:`, candidateData);

        if (candidateData.error || !candidateData.data) {
          console.error(
            `[autoSchedule] Error fetching candidate ${candidateId}:`,
            candidateData.error,
          );
          continue;
        }

        const candidateName = candidateData.data.full_name;
        let candidateUserId = candidateData.data.user_id;
        const candidateEmail = candidateData.data.email;

        console.log(
          `[autoSchedule] Candidate: ${candidateName} (candidate_id: ${candidateId}, user_id: ${candidateUserId}, email: ${candidateEmail})`,
        );

        // If no user_id, try to lookup by email in the users table
        if (!candidateUserId && candidateEmail) {
          console.log(
            `[autoSchedule] No user_id found, attempting to lookup by email: ${candidateEmail}`,
          );

          const { data: userResult, error: userError } = await this.supabase
            .from("users")
            .select("id")
            .eq("email", candidateEmail)
            .single();

          console.log(`[autoSchedule] User lookup result:`, userResult);
          console.log(`[autoSchedule] User lookup error:`, userError);

          if (!userError && userResult) {
            candidateUserId = userResult.id;
            console.log(
              `[autoSchedule] ✓ Found user_id from email lookup: ${candidateUserId}`,
            );
          } else {
            console.warn(
              `[autoSchedule] ⚠️ Could not find user record for email ${candidateEmail}`,
            );
          }
        }

        if (!candidateUserId) {
          console.warn(
            `[autoSchedule] ⚠️ Candidate ${candidateName} has no user_id and could not be looked up by email!`,
          );
          (candidateInterviews as typeof unscheduledInterviews).forEach(
            (interview) => {
              failed.push({
                candidateName,
                round: interview.round,
                categoryName: interview.category_name,
              });
            },
          );
          continue;
        }

        // Get candidate availability
        console.log(
          `[autoSchedule] ========== FETCHING AVAILABILITY FOR CANDIDATE ==========`,
        );
        console.log(
          `[autoSchedule] Calling getAvailabilitySlots with userId: ${candidateUserId}`,
        );
        const candidateAvailability =
          await this.getAvailabilitySlots(candidateUserId);

        console.log(
          `[autoSchedule] Returned from getAvailabilitySlots: ${candidateAvailability.length} slots`,
        );
        candidateAvailability.forEach((slot, idx) => {
          console.log(
            `  Slot ${idx + 1}: ${slot.start.toISOString()} to ${slot.end.toISOString()}`,
          );
        });
        console.log(
          `[autoSchedule] ========== END AVAILABILITY LOOKUP ==========`,
        );

        if (candidateAvailability.length === 0) {
          console.error(
            `[autoSchedule] ⚠️ CRITICAL: No availability found for candidate ${candidateName}`,
          );
          console.error(
            `[autoSchedule] Candidate details: name=${candidateName}, user_id=${candidateUserId}, email=${candidateEmail}`,
          );
          console.error(`[autoSchedule] Possible causes:`);
          console.error(
            `  1. Candidate has not yet submitted their availability through the UI`,
          );
          console.error(
            `  2. Candidate's user_id is incorrect or doesn't match database records`,
          );
          console.error(
            `  3. Availability data is stored under a different user_id`,
          );
          // Mark all as failed
          (candidateInterviews as typeof unscheduledInterviews).forEach(
            (interview) => {
              failed.push({
                candidateName,
                round: interview.round,
                categoryName: interview.category_name,
              });
            },
          );
          continue;
        }

        // Sort interviews by round number (earlier rounds first)
        const sortedInterviews = (
          candidateInterviews as typeof unscheduledInterviews
        ).sort((a, b) => a.round - b.round);

        // Try to schedule each interview
        for (const interview of sortedInterviews) {
          console.log(
            `\n[autoSchedule] Attempting to schedule: ${interview.category_name} (Round ${interview.round})`,
          );

          const isEarlyRound = interview.round <= 2; // Rounds 1-2 are priority
          const scheduled_slot = await this.findAndScheduleInterview(
            interview,
            candidateAvailability,
            candidateName,
            interviewerLoadMap,
          );

          if (scheduled_slot) {
            scheduled++;
            console.log(`[autoSchedule] ✓ Successfully scheduled`);
          } else {
            console.warn(`[autoSchedule] ✗ Failed to schedule`);
            if (isEarlyRound) {
              console.error(`[autoSchedule] Early round failed - aborting`);
              return {
                success: false,
                scheduled,
                failed: [
                  {
                    candidateName,
                    round: interview.round,
                    categoryName: interview.category_name,
                  },
                ],
                message: `Unable to schedule ${candidateName} for Round ${interview.round} (${interview.category_name}). This is an early round so the process cannot proceed.`,
              };
            } else {
              failed.push({
                candidateName,
                round: interview.round,
                categoryName: interview.category_name,
              });
            }
          }
        }
      }

      const successMessage =
        failed.length === 0
          ? `Successfully scheduled all ${scheduled} interviews!`
          : `Scheduled ${scheduled} interviews. ${failed.length} later-round interviews could not be scheduled. Please contact the candidate to reschedule.`;

      console.log(`\n[autoSchedule] Final result: ${successMessage}`);
      console.log(`[autoSchedule] Load distribution:`);
      Object.entries(interviewerLoadMap).forEach(([interviewerId, load]) => {
        console.log(`  Interviewer ${interviewerId}: ${load} interviews`);
      });

      return {
        success: true,
        scheduled,
        failed,
        message: successMessage,
      };
    } catch (error) {
      console.error("[autoSchedule] Error during auto-scheduling:", error);
      return {
        success: false,
        scheduled: 0,
        failed: [],
        message: "An error occurred during auto-scheduling. Please try again.",
      };
    }
  }

  private async getUnscheduledInterviewsForProcess(processId: string): Promise<
    Array<{
      interview_id: string;
      candidate_id: string;
      process_round_id: string;
      round: number;
      category_id: string;
      category_name: string;
      minutes: number;
    }>
  > {
    console.log(
      `[getUnscheduledInterviews] Fetching unscheduled interviews for process: ${processId}`,
    );

    // First, get all process_round_ids for this process
    const { data: roundsData, error: roundsError } = await this.supabase
      .from("process_rounds")
      .select("process_round_id")
      .eq("process_id", processId);

    if (roundsError) {
      console.error(
        "[getUnscheduledInterviews] Error fetching rounds:",
        roundsError,
      );
      return [];
    }

    if (!roundsData || roundsData.length === 0) {
      console.warn(`[getUnscheduledInterviews] No rounds found for process`);
      return [];
    }

    const roundIds = roundsData.map((r) => r.process_round_id);
    console.log(
      `[getUnscheduledInterviews] Found ${roundIds.length} rounds for process: ${roundIds.join(", ")}`,
    );

    // Now get unscheduled interviews for these rounds
    const { data, error } = await this.supabase
      .from("interviews")
      .select(
        `
        interview_id,
        candidate_id,
        process_round_id,
        process_rounds(round, category_id, interview_categories(category_id, category_name, minutes))
      `,
      )
      .in("process_round_id", roundIds)
      .eq("status", "unscheduled")
      .is("scheduled_start", null);

    if (error) {
      console.error("[getUnscheduledInterviews] Error:", error);
      return [];
    }

    if (!data) {
      console.warn(`[getUnscheduledInterviews] No data returned from query`);
      return [];
    }

    console.log(
      `[getUnscheduledInterviews] Raw query returned ${data.length} interviews`,
    );

    // Filter to only interviews for this process and flatten nested structure
    const flattened: Array<{
      interview_id: string;
      candidate_id: string;
      process_round_id: string;
      round: number;
      category_id: string;
      category_name: string;
      minutes: number;
    }> = [];

    for (const interview of data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iv = interview as any;
      // Get the category from nested structure
      const category = iv.process_rounds?.interview_categories;
      if (!category) {
        console.warn(
          `[getUnscheduledInterviews] Skipping interview ${iv.interview_id} - no category found`,
        );
        continue;
      }

      flattened.push({
        interview_id: iv.interview_id,
        candidate_id: iv.candidate_id,
        process_round_id: iv.process_round_id,
        round: iv.process_rounds.round,
        category_id: iv.process_rounds.category_id,
        category_name: category.category_name,
        minutes: category.minutes,
      });
    }

    console.log(
      `[getUnscheduledInterviews] Flattened to ${flattened.length} interviews`,
    );

    return flattened;
  }

  private async getAvailabilitySlots(
    userId: string,
  ): Promise<Array<{ start: Date; end: Date }>> {
    console.log(
      `[getAvailabilitySlots] ========== FETCHING AVAILABILITY ==========`,
    );
    console.log(
      `[getAvailabilitySlots] Calling availabilityController.fetchAvailabilityByUserId() for user: ${userId}`,
    );

    const records =
      await availabilityController.fetchAvailabilityByUserId(userId);

    if (!records || records.length === 0) {
      console.warn(
        `[getAvailabilitySlots] ⚠️ No availability records found for user ${userId}`,
      );
      console.log(
        `[getAvailabilitySlots] Debugging: Ensure candidate has submitted availability through the UI`,
      );
      console.log(
        `[getAvailabilitySlots] ========== END AVAILABILITY FETCH ==========`,
      );
      return [];
    }

    console.log(
      `[getAvailabilitySlots] ✓ Processing ${records.length} availability records:`,
    );
    records.forEach((record, idx) => {
      console.log(
        `  Record ${idx + 1}: start_time="${record.start_time}", end_time="${record.end_time}"`,
      );
    });

    const slots = records.map((slot) => {
      const startTime = new Date(slot.start_time);
      const endTime = new Date(slot.end_time);
      console.log(
        `[getAvailabilitySlots] Converting: start_time="${slot.start_time}" -> ${startTime.toISOString()}, end_time="${slot.end_time}" -> ${endTime.toISOString()}`,
      );
      return {
        start: startTime,
        end: endTime,
      };
    });

    console.log(
      `[getAvailabilitySlots] ✓ Successfully converted ${slots.length} slots for user ${userId}:`,
    );
    slots.forEach((slot, idx) => {
      const duration = (slot.end.getTime() - slot.start.getTime()) / 60000;
      console.log(
        `  Slot ${idx + 1}: ${slot.start.toISOString()} - ${slot.end.toISOString()} (${Math.round(duration)}min)`,
      );
    });
    console.log(
      `[getAvailabilitySlots] ========== END AVAILABILITY FETCH ==========`,
    );

    return slots;
  }

  private async getInterviewersForCategory(
    categoryId: string,
  ): Promise<string[]> {
    console.log(
      `[getInterviewersForCategory] Fetching interviewers for category: ${categoryId}`,
    );

    const { data, error } = await this.supabase
      .from("interviewers")
      .select("user_id")
      .eq("category_id", categoryId);

    if (error) {
      console.error("[getInterviewersForCategory] Error:", error);
      return [];
    }

    const userIds = (data || []).map((row) => row.user_id);
    console.log(
      `[getInterviewersForCategory] Found ${userIds.length} interviewers: ${userIds.join(", ")}`,
    );

    return userIds;
  }

  private async findAndScheduleInterview(
    interview: {
      interview_id: string;
      candidate_id: string;
      round: number;
      category_id: string;
      category_name: string;
      minutes: number;
      process_round_id: string;
    },
    candidateAvailability: Array<{ start: Date; end: Date }>,
    candidateName: string,
    interviewerLoadMap: Record<string, number>,
  ): Promise<boolean> {
    console.log(
      `\n[findAndSchedule] Scheduling ${interview.category_name} (${interview.minutes}min) for ${candidateName}`,
    );
    console.log(
      `[findAndSchedule] Candidate has ${candidateAvailability.length} availability slots`,
    );

    // Get available interviewers for this category
    const interviewerIds = await this.getInterviewersForCategory(
      interview.category_id,
    );

    console.log(
      `[findAndSchedule] Found ${interviewerIds.length} interviewers for category`,
    );

    if (interviewerIds.length === 0) {
      console.warn(
        `[findAndSchedule] No interviewers assigned to category: ${interview.category_name}`,
      );
      return false;
    }

    // Sort interviewers by current load (least loaded first)
    const sortedInterviewerIds = interviewerIds.sort((a, b) => {
      const loadA = interviewerLoadMap[a] ?? 0;
      const loadB = interviewerLoadMap[b] ?? 0;
      return loadA - loadB;
    });

    console.log(`[findAndSchedule] Sorted interviewers by load (ascending)`);

    // Try to find a common time slot with an interviewer (starting with least loaded)
    for (const interviewerId of sortedInterviewerIds) {
      console.log(
        `[findAndSchedule] Trying interviewer: ${interviewerId} (load: ${interviewerLoadMap[interviewerId] ?? 0})`,
      );

      const interviewerAvailability =
        await this.getAvailabilitySlots(interviewerId);

      console.log(
        `[findAndSchedule] Interviewer has ${interviewerAvailability.length} slots`,
      );

      if (interviewerAvailability.length === 0) {
        console.log(
          `[findAndSchedule] Interviewer has no availability, skipping`,
        );
        continue;
      }

      // Log slot comparison
      console.log(
        `[findAndSchedule] Comparing slots (looking for ${interview.minutes}min overlap):`,
      );
      candidateAvailability.forEach((slot, idx) => {
        console.log(
          `  Candidate slot ${idx + 1}: ${slot.start.toISOString()} - ${slot.end.toISOString()}`,
        );
      });
      interviewerAvailability.forEach((slot, idx) => {
        console.log(
          `  Interviewer slot ${idx + 1}: ${slot.start.toISOString()} - ${slot.end.toISOString()}`,
        );
      });

      // Find a matching time slot
      const matchedSlot = this.findCommonTimeSlot(
        candidateAvailability,
        interviewerAvailability,
        interview.minutes,
      );

      if (matchedSlot) {
        console.log(
          `[findAndSchedule] ✓ Found matching slot: ${matchedSlot.start.toISOString()} - ${matchedSlot.end.toISOString()}`,
        );

        // Schedule the interview
        const { error } = await this.supabase
          .from("interviews")
          .update({
            scheduled_start: matchedSlot.start.toISOString(),
            scheduled_end: matchedSlot.end.toISOString(),
            interviewer_id: interviewerId,
            status: "scheduled",
          })
          .eq("interview_id", interview.interview_id);

        if (!error) {
          // Update load tracking
          interviewerLoadMap[interviewerId] =
            (interviewerLoadMap[interviewerId] ?? 0) + 1;
          console.log(
            `[findAndSchedule] ✓ Successfully scheduled interview ${interview.interview_id} with interviewer ${interviewerId}`,
          );
          return true;
        } else {
          console.error("[findAndSchedule] Error scheduling interview:", error);
        }
      } else {
        console.log(
          `[findAndSchedule] No matching slot found with this interviewer`,
        );
      }
    }

    console.warn(
      `[findAndSchedule] Unable to find common availability for ${candidateName} - ${interview.category_name}`,
    );
    return false;
  }

  private findCommonTimeSlot(
    slots1: Array<{ start: Date; end: Date }>,
    slots2: Array<{ start: Date; end: Date }>,
    durationMinutes: number,
  ): { start: Date; end: Date } | null {
    // Try to find overlapping time slot between two sets of availability
    console.log(
      `[findCommonTimeSlot] Looking for ${durationMinutes}min overlap between ${slots1.length} and ${slots2.length} slots`,
    );

    for (let i = 0; i < slots1.length; i++) {
      for (let j = 0; j < slots2.length; j++) {
        const slot1 = slots1[i];
        const slot2 = slots2[j];

        const overlapStart = new Date(
          Math.max(slot1.start.getTime(), slot2.start.getTime()),
        );
        const overlapEnd = new Date(
          Math.min(slot1.end.getTime(), slot2.end.getTime()),
        );

        const durationMs = durationMinutes * 60 * 1000;
        const overlapDurationMs = overlapEnd.getTime() - overlapStart.getTime();

        console.log(
          `[findCommonTimeSlot] Comparing slot1 (${slot1.start.toISOString()} - ${slot1.end.toISOString()}) with slot2 (${slot2.start.toISOString()} - ${slot2.end.toISOString()})`,
        );
        console.log(
          `[findCommonTimeSlot] Overlap: ${overlapStart.toISOString()} - ${overlapEnd.toISOString()} = ${Math.round(overlapDurationMs / 60000)}min (need ${durationMinutes}min)`,
        );

        if (overlapDurationMs >= durationMs) {
          console.log(`[findCommonTimeSlot] ✓ Valid overlap found!`);
          // Found a valid time slot
          return {
            start: overlapStart,
            end: new Date(overlapStart.getTime() + durationMs),
          };
        }
      }
    }

    console.log(`[findCommonTimeSlot] No valid overlap found`);
    return null;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
          result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
      },
      {} as Record<string, T[]>,
    );
  }
}

export const interviewProcessController = new InterviewProcessController();
