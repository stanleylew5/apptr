"use client";
import { useEffect, useState } from "react";
import { interviewProcessController } from "@/controllers/interviewprocess";
import { ProcessRoundsList } from "./processroundslist";
import { InterviewProcess } from "@/types/process";

interface InterviewProcessCardProps {
  process: InterviewProcess;
  onScheduleComplete?: () => Promise<void> | void;
}

interface SchedulingResult {
  success: boolean;
  scheduled: number;
  failed: Array<{ candidateName: string; round: number; categoryName: string }>;
  message: string;
}

export const InterviewProcessCard = ({
  process,
  onScheduleComplete,
}: InterviewProcessCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schedulingResult, setSchedulingResult] =
    useState<SchedulingResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [unscheduledCount, setUnscheduledCount] = useState(0);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  useEffect(() => {
    const checkUnscheduledInterviews = async () => {
      try {
        const allInterviews =
          await interviewProcessController.getAllInterviewsForProcess(
            process.process_id,
          );
        const unscheduled = allInterviews.filter(
          (i) => i.status !== "scheduled",
        ).length;
        setUnscheduledCount(unscheduled);
      } catch (error) {
        console.error(
          "[InterviewProcessCard] Error fetching interviews:",
          error,
        );
      } finally {
        setLoadingInterviews(false);
      }
    };

    checkUnscheduledInterviews();
  }, [process.process_id]);

  const handleAutoSchedule = async () => {
    setIsLoading(true);
    try {
      const result = await interviewProcessController.autoScheduleInterviews(
        process.process_id,
      );
      setSchedulingResult(result);
      setShowResultModal(true);
      // Refresh unscheduled count after scheduling
      const allInterviews =
        await interviewProcessController.getAllInterviewsForProcess(
          process.process_id,
        );
      const unscheduled = allInterviews.filter(
        (i) => i.status !== "scheduled",
      ).length;
      setUnscheduledCount(unscheduled);

      // Call parent callback to refresh the process list
      if (onScheduleComplete) {
        await onScheduleComplete();
      }
    } catch (error) {
      console.error("[autoSchedule] Error:", error);
      setSchedulingResult({
        success: false,
        scheduled: 0,
        failed: [],
        message: "An unexpected error occurred during scheduling.",
      });
      setShowResultModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border-2 border-purple-200 bg-white p-6 hover:cursor-pointer">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left transition-opacity hover:cursor-pointer hover:opacity-80"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-purple-900">
                {process.process_name || "Unnamed Process"}
              </h3>
              {/* <p className="text-sm text-gray-500 mt-1">
                Process ID: {process.process_id}
              </p> */}
            </div>
            <div className="ml-4">
              <svg
                className={`h-6 w-6 transform text-purple-600 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="mt-6 border-t-2 border-purple-100 pt-6">
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800">
                Interview Rounds ({process.rounds?.length || 0})
              </h4>
              {!loadingInterviews && unscheduledCount > 0 && (
                <button
                  onClick={handleAutoSchedule}
                  disabled={isLoading}
                  className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading
                    ? "Scheduling..."
                    : `Auto Schedule (${unscheduledCount})`}
                </button>
              )}
              {!loadingInterviews && unscheduledCount === 0 && (
                <div className="rounded-lg bg-green-100 px-4 py-2 font-semibold text-green-800">
                  All Scheduled ✓
                </div>
              )}
            </div>
            {process.rounds ? (
              <ProcessRoundsList
                rounds={process.rounds}
                processId={process.process_id}
              />
            ) : (
              <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-gray-600">No rounds data available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scheduling Result Modal */}
      {showResultModal && schedulingResult && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center">
          <div className="mx-4 max-h-96 w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Scheduling Results
            </h2>

            <div
              className={`mb-6 rounded-lg p-4 ${
                schedulingResult.success
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <p className="font-semibold">{schedulingResult.message}</p>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                <span className="font-semibold">Scheduled:</span>{" "}
                {schedulingResult.scheduled} interviews
              </p>
              {schedulingResult.failed.length > 0 && (
                <div className="mt-4">
                  <p className="mb-3 font-semibold text-gray-900">
                    Unable to Schedule ({schedulingResult.failed.length}):
                  </p>
                  <ul className="space-y-2">
                    {schedulingResult.failed.map((item, idx) => (
                      <li
                        key={idx}
                        className="rounded-lg bg-gray-100 p-3 text-sm text-gray-700"
                      >
                        <span className="font-semibold">
                          {item.candidateName}
                        </span>{" "}
                        - Round {item.round} ({item.categoryName})
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm text-gray-600 italic">
                    Please reach out to the candidate to reschedule these
                    interviews.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResultModal(false)}
                className="rounded-lg bg-gray-300 px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
