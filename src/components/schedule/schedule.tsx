"use client";

import React, { useEffect, useState } from "react";
import { PendingApptCard } from "../appointments/pendingCard";
import { ConfirmedApptCard } from "../appointments/confirmedCard";
import { interviewController } from "@/utils/interviewController";
import { createClient } from "@supabase/supabase-js";
import { Interview } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function Schedule() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  //TODO: change status from completed/canceled to confirmed/pending in supabase enum type
  const pending = interviews.filter((i) => i.status === "completed");

  const confirmed = interviews.filter((i) => i.status === "cancelled");

  useEffect(() => {
    const fetchInterviews = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const data = await interviewController.getCandidateInterviews(user.id);

      setInterviews(data);
    };

    fetchInterviews();
  }, []);

  return (
    <>
      <div className="px-20">
        <h2 className="text-2xl font-bold text-blue-800">
          Pending Confirmation
        </h2>
        <p>Please review and confirm these interview times</p>
      </div>

      <div className="mb-3 space-y-3">
        {pending.map((interview) => (
          <PendingApptCard
            key={interview.id}
            title={interview.title}
            infoItems={[
              interview.date,
              interview.timeRange,
              `Interviewer: ${interview.interviewerName}`,
              interview.location,
            ]}
            onConfirm={() => console.log("Confirm")}
            onReschedule={() => console.log("Reschedule")}
          />
        ))}
      </div>

      <div className="mt-0.5 px-20">
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
              `Interviewer: ${interview.interviewerName}`,
              interview.location,
            ]}
            onAddCalendar={() => console.log("Add to calendar")}
          />
        ))}
      </div>
    </>
  );
}