"use client";
import { useEffect, useState } from "react";
import { interviewProcessController } from "@/controllers/interviewprocess";
import Loading from "@/components/loading";
import { ScheduledInterview, ScheduledDashboardProps } from "@/types/interview";

export const ScheduledDashboard = ({
  organizationId,
}: ScheduledDashboardProps) => {
  const [processes, setProcesses] = useState<
    Array<{
      process_id: string;
      process_name: string;
      scheduled_interviews: ScheduledInterview[];
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScheduledInterviews = async () => {
      try {
        const orgsProcesses =
          await interviewProcessController.getProcessesByOrganization(
            organizationId,
          );

        const processesWithInterviews = await Promise.all(
          orgsProcesses.map(async (process) => ({
            process_id: process.process_id,
            process_name: process.process_name || "Unnamed Process",
            scheduled_interviews:
              await interviewProcessController.getScheduledInterviewsForProcess(
                process.process_id,
              ),
          })),
        );

        setProcesses(processesWithInterviews);
      } catch (err) {
        console.error("[scheduledDashboard] Error loading interviews:", err);
        setError("Failed to load scheduled interviews");
      } finally {
        setLoading(false);
      }
    };

    loadScheduledInterviews();
  }, [organizationId]);

  if (loading) {
    return <Loading />;
  }

  const allScheduledInterviews = processes.flatMap(
    (p) => p.scheduled_interviews,
  );
  const totalScheduled = allScheduledInterviews.length;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>
      )}

      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow">
        <h2 className="text-2xl font-bold">Scheduled Interviews</h2>
        <p className="mt-2 text-lg opacity-90">
          {totalScheduled} interviews scheduled
        </p>
      </div>

      {processes.length === 0 ? (
        <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">
            No interview processes found in this organization
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {processes.map((process) => (
            <div
              key={process.process_id}
              className="rounded-lg bg-white p-6 shadow"
            >
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                {process.process_name}
              </h3>

              {process.scheduled_interviews.length === 0 ? (
                <p className="text-gray-500">No scheduled interviews yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Candidate
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Interviewer
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Round
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Date & Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {process.scheduled_interviews.map((interview) => {
                        const startDate = new Date(interview.scheduled_start);
                        const endDate = new Date(interview.scheduled_end);
                        const dateStr = startDate.toLocaleDateString();
                        const timeStr = `${startDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} - ${endDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`;

                        return (
                          <tr
                            key={interview.interview_id}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-gray-900">
                              {interview.candidate_name}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {interview.interviewer_name}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                {interview.category_name}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                                Round {interview.round}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div>{dateStr}</div>
                              <div className="text-xs text-gray-500">
                                {timeStr}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
