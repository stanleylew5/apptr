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
  // Filter interviews based on confirmation status from both parties
  const pending = interviews.filter(
    (i) => !(i.interviewer_confirmation && i.candidate_confirmation),
  );
  const confirmed = interviews.filter(
    (i) => i.interviewer_confirmation && i.candidate_confirmation,
  );

  useEffect(() => {
    const fetchInterviews = async () => {
      const user = await authController.getCurrentUser();
      if (!user) return;

      let userRole = forceRole;
      if (!userRole) {
        userRole = await authController.getUserPrimaryRole(user);
      }
      if (!userRole) return;
      setRole(userRole);

      const data = await interviewController.getUserInterviews(
        user.user_id,
        userRole,
      );
      setInterviews(data);
    };

    fetchInterviews();
  }, [forceRole]);

  return (
    <>
      <div className="my-4">
        <h2 className="text-2xl font-bold text-blue-800">
          Pending Confirmation
        </h2>
        <p>Please review and confirm these interview times</p>
      </div>

      <div className="mb-3 space-y-3">
        {pending.map(
          ({
            id,
            title,
            date,
            timeRange,
            interviewerName,
            candidateName,
            location,
          }) => (
            <PendingApptCard
              key={id}
              title={title}
              infoItems={[
                date,
                timeRange,
                role === "candidate"
                  ? `Interviewer: ${interviewerName}`
                  : `Candidate: ${candidateName}`,
                location,
              ]}
              //TODO: add real functionality for these buttons
              onConfirm={() => console.log("Confirm")}
              onReschedule={() => console.log("Reschedule")}
            />
          ),
        )}
      </div>

      <div className="mt-6 mb-4">
        <h2 className="text-2xl font-bold text-blue-800">
          Confirmed Interviews
        </h2>
      </div>

      <div className="mb-3 space-y-3">
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
  );
}
