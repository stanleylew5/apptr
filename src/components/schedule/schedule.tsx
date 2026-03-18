"use client";

import { useEffect, useState } from "react";
import { PendingApptCard } from "../appointments/pendingCard";
import { ConfirmedApptCard } from "../appointments/confirmedCard";
import { interviewController } from "@/controllers/interview";
import { Interview } from "@/types/interview";
import { authController } from "@/controllers/auth";

export function Schedule({ forceRole }: { forceRole?: string | null }) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [role, setRole] = useState<string>("");
  const [loadingInterviewId, setLoadingInterviewId] = useState<string | null>(
    null,
  );

  // Helper function to check if user has confirmed based on their role
  const hasUserConfirmed = (interview: Interview): boolean => {
    if (role === "candidate") {
      return interview.candidate_confirmation || false;
    } else if (role === "interviewer") {
      return interview.interviewer_confirmation || false;
    }
    return false;
  };

  // Helper function to determine who we're waiting on
  const getWaitingFor = (interview: Interview): string => {
    if (
      interview.candidate_confirmation &&
      interview.interviewer_confirmation
    ) {
      return "Both confirmed";
    } else if (interview.candidate_confirmation) {
      return "Waiting for: Interviewer";
    } else if (interview.interviewer_confirmation) {
      return "Waiting for: Candidate";
    } else {
      return "Waiting for: Both";
    }
  };

  // Filter interviews based on confirmation status
  const awaitingUserConfirmation = interviews.filter(
    (i) =>
      !(i.interviewer_confirmation && i.candidate_confirmation) &&
      !hasUserConfirmed(i),
  );
  const userConfirmedAwaitingOther = interviews.filter(
    (i) =>
      !(i.interviewer_confirmation && i.candidate_confirmation) &&
      hasUserConfirmed(i),
  );
  const confirmed = interviews.filter(
    (i) => i.interviewer_confirmation && i.candidate_confirmation,
  );

  const fetchInterviews = async (userRole: string) => {
    const user = await authController.getCurrentUser();
    if (!user) return;

    const data = await interviewController.getUserInterviews(
      user.user_id,
      userRole,
    );
    setInterviews(data);
  };

  useEffect(() => {
    const initializeInterviews = async () => {
      const user = await authController.getCurrentUser();
      if (!user) return;

      let userRole = forceRole;
      if (!userRole) {
        userRole = await authController.getUserPrimaryRole(user);
      }
      if (!userRole) return;
      setRole(userRole);

      await fetchInterviews(userRole);
    };

    initializeInterviews();
  }, [forceRole]);

  const handleConfirm = async (interviewId: string) => {
    if (!role) return;

    try {
      setLoadingInterviewId(interviewId);
      await interviewController.confirmInterview(interviewId, role);

      // Refresh the interviews list
      await fetchInterviews(role);
    } catch (error) {
      console.error("Error confirming interview:", error);
    } finally {
      setLoadingInterviewId(null);
    }
  };

  return (
    <>
      {awaitingUserConfirmation.length > 0 && (
        <>
          <div className="my-4">
            <h2 className="text-2xl font-bold text-blue-800">
              Pending Confirmation
            </h2>
            <p>Please review and confirm these interview times</p>
          </div>

          <div className="mb-3 space-y-3">
            {awaitingUserConfirmation.map((interview) => (
              <PendingApptCard
                key={interview.id}
                title={interview.title}
                infoItems={[
                  interview.date,
                  interview.timeRange,
                  role === "candidate"
                    ? `Interviewer: ${interview.interviewerName}`
                    : `Candidate: ${interview.candidateName}`,
                  interview.location,
                ]}
                onConfirm={() => handleConfirm(interview.id)}
                isLoading={loadingInterviewId === interview.id}
                waitingFor={getWaitingFor(interview)}
              />
            ))}
          </div>
        </>
      )}

      {userConfirmedAwaitingOther.length > 0 && (
        <>
          <div className="my-4">
            <h2 className="text-2xl font-bold text-green-800">
              Confirmed by You
            </h2>
            <p>
              Waiting for{" "}
              {role === "candidate" ? "the interviewer" : "the candidate"} to
              confirm
            </p>
          </div>

          <div className="mb-3 space-y-3">
            {userConfirmedAwaitingOther.map((interview) => (
              <div
                key={interview.id}
                className="mx-auto flex items-center justify-between gap-5 rounded-md border border-green-300 bg-green-50 p-2"
              >
                <div className="flex flex-col">
                  <div className="flex gap-3">
                    <div className="gap-2 rounded-lg bg-green-100 px-2 text-green-600">
                      ✓ Your Confirmation Received
                    </div>
                    <div>{interview.title}</div>
                  </div>

                  <div className="flex flex-col text-gray-600">
                    <div className="flex items-center gap-2">
                      {interview.date}
                    </div>
                    <div className="flex items-center gap-2">
                      {interview.timeRange}
                    </div>
                    <div className="flex items-center gap-2">
                      {role === "candidate"
                        ? `Interviewer: ${interview.interviewerName}`
                        : `Candidate: ${interview.candidateName}`}
                    </div>
                    <div className="flex items-center gap-2">
                      {interview.location}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    {getWaitingFor(interview)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {confirmed.length > 0 && (
        <>
          <div className="mt-6 mb-4">
            <h2 className="text-2xl font-bold text-blue-800">
              Confirmed Interviews
            </h2>
          </div>

          <div>
            {confirmed.map((interview) => (
              <ConfirmedApptCard
                key={interview.id}
                title={interview.title}
                infoItems={[
                  interview.date,
                  interview.timeRange,
                  role === "candidate"
                    ? `Interviewer: ${interview.interviewerName}`
                    : `Candidate: ${interview.candidateName}`,
                  interview.location,
                ]}
                //TODO: add real functionality for this button
                onAddCalendar={() => console.log("Add to calendar")}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
