"use client";
import { useEffect, useState } from "react";
import { ProcessRoundsListProps } from "@/types/process";
import { interviewProcessController } from "@/controllers/interviewprocess";
import { InterviewCard } from "./interviewcard";
import { InterviewCardProps } from "@/types/interview";

export const ProcessRoundsList = ({
  rounds,
  processId,
}: ProcessRoundsListProps) => {
  const [interviews, setInterviews] = useState<
    InterviewCardProps["interview"][]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        const allInterviews =
          await interviewProcessController.getAllInterviewsForProcess(
            processId,
          );
        setInterviews(allInterviews);
      } catch (error) {
        console.error("[ProcessRoundsList] Error loading interviews:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, [processId]);

  if (rounds.length === 0) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-600">No rounds configured for this process</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 hover:cursor-auto">
      {rounds.map((round) => {
        const roundInterviews = interviews.filter(
          (i) =>
            i.round === round.round &&
            i.category_name === round.category?.category_name,
        );
        const unscheduledCount = roundInterviews.filter(
          (i) => i.status !== "scheduled",
        ).length;

        return (
          <div
            key={round.process_round_id}
            className="rounded-lg border-2 border-blue-200 bg-white p-6 transition-all hover:border-blue-400"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-4">
                  <span className="inline-block min-w-14 rounded-full bg-blue-600 px-4 py-2 text-center font-bold text-white">
                    Round {round.round}
                  </span>
                  <h3 className="text-2xl font-bold text-blue-900">
                    {round.category?.category_name || "Unknown Category"}
                  </h3>
                </div>
                <div className="mt-4 ml-0 space-y-2">
                  <p className="text-gray-700">
                    <span className="font-semibold">Duration:</span>{" "}
                    {round.category?.minutes || "Unknown"} minutes
                  </p>
                  <p className="text-sm text-gray-600">
                    {roundInterviews.length} interview
                    {roundInterviews.length !== 1 ? "s" : ""}{" "}
                    {unscheduledCount > 0
                      ? `(${unscheduledCount} unscheduled)`
                      : "(All scheduled)"}
                  </p>
                </div>
              </div>
            </div>

            {!loading && roundInterviews.length > 0 && (
              <div className="mt-6 space-y-3 border-t-2 border-blue-100 pt-6">
                {roundInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.interview_id}
                    interview={interview}
                  />
                ))}
              </div>
            )}

            {!loading && roundInterviews.length === 0 && (
              <div className="mt-6 rounded-lg border-t-2 border-blue-100 bg-gray-50 p-4 pt-6 text-center text-gray-600">
                <p>No interviews for this round</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
