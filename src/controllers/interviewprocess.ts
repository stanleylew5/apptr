import { supabase } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { availabilityController } from "./availability";
import {
  InterviewProcess,
  InterviewCategory,
  ProcessRound,
} from "@/types/process";
import { ScheduledInterview } from "@/types/interview";
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
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
      console.error(roundsError);
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
        location,
        process_rounds(round, interview_categories(category_name)),
        candidates(full_name),
        interviewers(users(full_name))
      `,
      )
      .in("process_round_id", roundIds)
      .in("status", ["confirmed", "pending"])
      .not("scheduled_start", "is", null)
      .not("scheduled_end", "is", null)
      .order("scheduled_start", { ascending: true });

    if (error) {
      console.error(error);
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
      const interviewer = iv.interviewers?.users;

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
        location: iv.location || "To be updated by interviewer soon",
      });
    }

    return scheduled;
  }

  async getAllInterviewsForProcess(processId: string): Promise<
    Array<{
      interview_id: string;
      candidate_name: string;
      interviewer_name: string | null;
      category_name: string;
      round: number;
      scheduled_start: string | null;
      scheduled_end: string | null;
      status: string;
      interviewer_confirmation: boolean;
      candidate_confirmation: boolean;
    }>
  > {
    // Get all process_round_ids for this process
    const { data: roundsData, error: roundsError } = await this.supabase
      .from("process_rounds")
      .select("process_round_id")
      .eq("process_id", processId);

    if (roundsError) {
      console.error(roundsError);
      return [];
    }

    if (!roundsData || roundsData.length === 0) {
      return [];
    }

    const roundIds = roundsData.map((r) => r.process_round_id);

    // Get all interviews for these rounds (both scheduled and unscheduled)
    const { data, error } = await this.supabase
      .from("interviews")
      .select(
        `
        interview_id,
        status,
        scheduled_start,
        scheduled_end,
        interviewer_confirmation,
        candidate_confirmation,
        process_rounds(round, interview_categories(category_name)),
        candidates(full_name),
        interviewers(users(full_name))
      `,
      )
      .in("process_round_id", roundIds)
      .order("scheduled_start", { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }

    if (!data) return [];

    // Flatten the nested structure
    const interviews: Array<{
      interview_id: string;
      candidate_name: string;
      interviewer_name: string | null;
      category_name: string;
      round: number;
      scheduled_start: string | null;
      scheduled_end: string | null;
      status: string;
      interviewer_confirmation: boolean;
      candidate_confirmation: boolean;
    }> = [];

    for (const interview of data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iv = interview as any;
      const category = iv.process_rounds?.interview_categories;
      const candidate = iv.candidates;
      const interviewer = iv.interviewers?.users;

      if (!category || !candidate) continue;

      interviews.push({
        interview_id: iv.interview_id,
        candidate_name: candidate?.full_name || "Unknown",
        interviewer_name: interviewer?.full_name || null,
        category_name: category?.category_name || "Unknown",
        round: iv.process_rounds?.round || 0,
        scheduled_start: iv.scheduled_start,
        scheduled_end: iv.scheduled_end,
        status: iv.status,
        interviewer_confirmation: iv.interviewer_confirmation || false,
        candidate_confirmation: iv.candidate_confirmation || false,
      });
    }

    return interviews;
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
        const { data: userResult, error: userError } = await this.supabase
          .from("users")
          .select("user_id")
          .eq("email", candidate.email)
          .single();

        if (!userError && userResult) userId = userResult.user_id;
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

        if (!candidateId) continue;

        if (roundIds.length === 0) continue;

        // Create interview records for each round this candidate needs for this category
        const currentRoundIndex = roundIndexPerCategory[requirement.type] || 0;
        for (let i = 0; i < count; i++) {
          const roundIndex = currentRoundIndex + i;
          if (roundIndex >= roundIds.length) {
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
          if (error)
            console.error(
              "[createInterviews] Error creating interview:",
              error,
            );
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
      if (!categoryId) continue;

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
      // Get all unscheduled interviews for this process with details
      const unscheduledInterviews =
        await this.getUnscheduledInterviewsForProcess(processId);

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

      const failed: Array<{
        candidateName: string;
        round: number;
        categoryName: string;
      }> = [];
      let scheduled = 0;

      for (const [candidateId, candidateInterviews] of Object.entries(
        // Process each candidate's interviews
        interviewsByCandidate,
      )) {
        const candidateData = await this.supabase
          .from("candidates")
          .select("full_name, user_id, candidate_id, email")
          .eq("candidate_id", candidateId)
          .single();

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

        // If no user_id, try to lookup by email in the users table
        if (!candidateUserId && candidateEmail) {
          const { data: userResult, error: userError } = await this.supabase
            .from("users")
            .select("id")
            .eq("email", candidateEmail)
            .single();

          if (!userError && userResult) candidateUserId = userResult.id;
        }

        if (!candidateUserId) {
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
        const candidateAvailability =
          await this.getAvailabilitySlots(candidateUserId);

        if (candidateAvailability.length === 0) {
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
          const isEarlyRound = interview.round <= 2; // Rounds 1-2 are priority
          const scheduled_slot = await this.findAndScheduleInterview(
            interview,
            candidateAvailability,
            candidateUserId,
            interviewerLoadMap,
          );

          if (scheduled_slot) {
            scheduled++;
          } else {
            if (isEarlyRound) {
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

      return {
        success: true,
        scheduled,
        failed,
        message: successMessage,
      };
    } catch (error) {
      console.error(error);
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
    // First, get all process_round_ids for this process
    const { data: roundsData, error: roundsError } = await this.supabase
      .from("process_rounds")
      .select("process_round_id")
      .eq("process_id", processId);

    if (roundsError) {
      console.error(roundsError);
      return [];
    }

    if (!roundsData || roundsData.length === 0) return [];

    const roundIds = roundsData.map((r) => r.process_round_id);

    const { data, error } = await this.supabase
      .from("interviews")
      .select(
        "interview_id, candidate_id, process_round_id, process_rounds(round, category_id, interview_categories(category_name, minutes))",
      )
      .in("process_round_id", roundIds)
      .eq("status", "unscheduled")
      .is("scheduled_start", null);

    if (error) {
      console.error(error);
      return [];
    }

    if (!data) return [];

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
      if (!category) continue;

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

    return flattened;
  }

  private async getAvailabilitySlots(
    userId: string,
  ): Promise<Array<{ start: Date; end: Date }>> {
    const records =
      await availabilityController.fetchAvailabilityByUserId(userId);

    if (!records || records.length === 0) return [];

    // Convert database timestamps directly to Date objects for scheduling
    // The database already stores these as UTC timestamps with timezone offset applied
    const slots = records.map((record) => ({
      start: new Date(record.start_time),
      end: new Date(record.end_time),
    }));

    return slots;
  }

  private async getInterviewersForCategory(
    categoryId: string,
  ): Promise<Array<{ interviewer_id: string; user_id: string }>> {
    const { data, error } = await this.supabase
      .from("interviewers")
      .select("interviewer_id, user_id")
      .eq("category_id", categoryId);

    if (error) {
      console.error(error);
      return [];
    }

    return (data || []).map((row) => ({
      interviewer_id: row.interviewer_id,
      user_id: row.user_id,
    }));
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
    candidateUserId: string,
    interviewerLoadMap: Record<string, number>,
  ): Promise<boolean> {
    // Get available interviewers for this category
    const interviewers = await this.getInterviewersForCategory(
      interview.category_id,
    );

    // Sort interviewers by current load (least loaded first)
    const sortedInterviewers = interviewers.sort((a, b) => {
      const loadA = interviewerLoadMap[a.interviewer_id] ?? 0;
      const loadB = interviewerLoadMap[b.interviewer_id] ?? 0;
      return loadA - loadB;
    });

    // Try to find a common time slot with an interviewer (starting with least loaded)
    for (const { interviewer_id, user_id } of sortedInterviewers) {
      const interviewerAvailability = await this.getAvailabilitySlots(user_id);
      if (interviewerAvailability.length === 0) continue;

      // Find a matching time slot
      const matchedSlot = this.findCommonTimeSlot(
        candidateAvailability,
        interviewerAvailability,
        interview.minutes,
      );

      if (matchedSlot) {
        const { error } = await this.supabase // Schedule the interview bam!
          .from("interviews")
          .update({
            scheduled_start: matchedSlot.start.toISOString(),
            scheduled_end: matchedSlot.end.toISOString(),
            interviewer_id: interviewer_id,
            status: "confirmed",
          })
          .eq("interview_id", interview.interview_id)
          .select();

        if (error) {
          console.error(error);
        } else {
          // Remove the booked slot from both candidate and interviewer availability
          await this.removeBookedSlotFromAvailability(
            candidateUserId,
            matchedSlot.start,
            matchedSlot.end,
          );
          await this.removeBookedSlotFromAvailability(
            user_id,
            matchedSlot.start,
            matchedSlot.end,
          );

          // Update load tracking
          interviewerLoadMap[interviewer_id] =
            (interviewerLoadMap[interviewer_id] ?? 0) + 1;
          return true;
        }
      }
    }

    return false;
  }

  private findCommonTimeSlot(
    slots1: Array<{ start: Date; end: Date }>,
    slots2: Array<{ start: Date; end: Date }>,
    durationMinutes: number,
  ): { start: Date; end: Date } | null {
    // Try to find overlapping time slot between two sets of availability
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

        if (overlapDurationMs >= durationMs) {
          return {
            // valid time slot has been found
            start: overlapStart,
            end: new Date(overlapStart.getTime() + durationMs),
          };
        }
      }
    }

    return null;
  }

  private async removeBookedSlotFromAvailability(
    userId: string,
    bookedStart: Date,
    bookedEnd: Date,
  ): Promise<void> {
    try {
      const records =
        await availabilityController.fetchAvailabilityByUserId(userId);

      if (!records || records.length === 0) return;

      const bookedStartTime = bookedStart.getTime();
      const bookedEndTime = bookedEnd.getTime();

      // Process each availability record
      for (const record of records) {
        const recordStart = new Date(record.start_time).getTime();
        const recordEnd = new Date(record.end_time).getTime();

        // Check if there's an overlap
        const overlapStart = Math.max(bookedStartTime, recordStart);
        const overlapEnd = Math.min(bookedEndTime, recordEnd);

        if (overlapStart >= overlapEnd) continue; // No overlap, js skip

        // Case 1: Booked time completely covers this availability slot - DELETE it
        if (bookedStartTime <= recordStart && bookedEndTime >= recordEnd) {
          const { error: deleteError } = await this.supabase
            .from("availability")
            .delete()
            .eq("availability_id", record.availability_id);

          if (deleteError) console.error(deleteError);
        }
        // Case 2: Booked time is IN THE MIDDLE -- SPLIT into before and after
        else if (bookedStartTime > recordStart && bookedEndTime < recordEnd) {
          // Update the original record to END before the booking
          const newEndTime = new Date(bookedStartTime).toISOString();

          const { error: updateError } = await this.supabase
            .from("availability")
            .update({ end_time: newEndTime })
            .eq("availability_id", record.availability_id);

          if (updateError) console.error(updateError);
          // Create NEW record for time AFTER the booking
          const newStartTime = new Date(bookedEndTime).toISOString();

          const { error: insertError } = await this.supabase
            .from("availability")
            .insert([
              {
                user_id: userId,
                start_time: newStartTime,
                end_time: record.end_time,
              },
            ]);

          if (insertError) console.error(insertError);
        }
        // Case 3: Booked time covers the START of availability - update start time
        else if (bookedStartTime <= recordStart && bookedEndTime < recordEnd) {
          const newStartTime = new Date(bookedEndTime).toISOString();

          const { error: updateError } = await this.supabase
            .from("availability")
            .update({ start_time: newStartTime })
            .eq("availability_id", record.availability_id);

          if (updateError) console.error(updateError);
        }
        // Case 4: Booked time covers the END of availability - update end time
        else if (bookedStartTime > recordStart && bookedEndTime >= recordEnd) {
          const newEndTime = new Date(bookedStartTime).toISOString();

          const { error: updateError } = await this.supabase
            .from("availability")
            .update({ end_time: newEndTime })
            .eq("availability_id", record.availability_id);

          if (updateError) {
            console.error(updateError);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
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
