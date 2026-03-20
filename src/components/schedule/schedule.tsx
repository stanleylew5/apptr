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
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );
  const [newLocation, setNewLocation] = useState<string>("");

  const hasUserConfirmed = (interview: Interview): boolean => {
    if (role === "candidate") {
      return interview.candidate_confirmation || false;
    } else if (role === "interviewer") {
      return interview.interviewer_confirmation || false;
    }
    return false;
  };

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

  const awaitingUserConfirmation = interviews.filter(
    (i) =>
      i.status !== "rejected" &&
      !(i.interviewer_confirmation && i.candidate_confirmation) &&
      !hasUserConfirmed(i),
  );
  const userConfirmedAwaitingOther = interviews.filter(
    (i) =>
      i.status !== "rejected" &&
      !(i.interviewer_confirmation && i.candidate_confirmation) &&
      hasUserConfirmed(i),
  );
  const confirmed = interviews.filter(
    (i) =>
      i.status !== "rejected" &&
      i.interviewer_confirmation &&
      i.candidate_confirmation,
  );
  const rejected = interviews.filter((i) => i.status === "rejected");

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
      await fetchInterviews(role);
    } catch (error) {
      console.error("Error confirming interview:", error);
    } finally {
      setLoadingInterviewId(null);
    }
  };

  const handleReject = async (interviewId: string) => {
    if (!role) return;

    try {
      setLoadingInterviewId(interviewId);
      await interviewController.rejectInterview(interviewId);

      await fetchInterviews(role);
    } catch (error) {
      console.error("Failed to reject interview:", error);
    } finally {
      setLoadingInterviewId(null);
    }
  };

  const handleUpdateLocation = async (interviewId: string) => {
    if (!newLocation.trim()) {
      console.error("Location cannot be empty");
      return;
    }

    try {
      setLoadingInterviewId(interviewId);
      await interviewController.updateInterviewLocation(
        interviewId,
        newLocation,
      );

      await fetchInterviews(role);
      setEditingLocationId(null);
      setNewLocation("");
    } catch (error) {
      console.error("Error updating location:", error);
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
                onReject={() => handleReject(interview.id)}
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

                  {role === "interviewer" && (
                    <button
                      onClick={() => {
                        setEditingLocationId(interview.id);
                        setNewLocation(interview.location);
                      }}
                      className="mt-3 rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                    >
                      Edit Location
                    </button>
                  )}
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
                onAddCalendar={() => console.log("Add to calendar")}
                onEditLocation={() => {
                  setEditingLocationId(interview.id);
                  setNewLocation(interview.location);
                }}
                isInterviewer={role === "interviewer"}
              />
            ))}
          </div>
        </>
      )}

      {rejected.length > 0 && (
        <>
          <div className="mt-6 mb-4">
            <h2 className="text-2xl font-bold text-red-800">
              Rejected Interviews
            </h2>
          </div>

          <div className="space-y-3">
            {rejected.map((interview) => (
              <div
                key={interview.id}
                className="mx-auto flex items-center justify-between gap-5 rounded-md border border-red-300 bg-red-50 p-2"
              >
                <div className="flex flex-col">
                  <div className="flex gap-3">
                    <div className="rounded-lg bg-red-100 px-2 text-red-600">
                      ✕ Rejected
                    </div>
                    <div>{interview.title}</div>
                  </div>

                  <div className="flex flex-col text-gray-600">
                    <div>{interview.date}</div>
                    <div>{interview.timeRange}</div>
                    <div>
                      {role === "candidate"
                        ? `Interviewer: ${interview.interviewerName}`
                        : `Candidate: ${interview.candidateName}`}
                    </div>
                    <div>{interview.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editingLocationId && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold">
              Update Interview Location
            </h3>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Enter new location"
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleUpdateLocation(editingLocationId);
                }}
                disabled={loadingInterviewId === editingLocationId}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingInterviewId === editingLocationId
                  ? "Saving..."
                  : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditingLocationId(null);
                  setNewLocation("");
                }}
                className="rounded-lg bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
