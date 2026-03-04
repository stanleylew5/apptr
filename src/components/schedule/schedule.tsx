"use client";

import React, { useEffect, useState } from "react";
import { PendingApptCard } from "../appointments/pendingCard";
import { ConfirmedApptCard } from "../appointments/confirmedCard";
import { interviewController } from "@/utils/interviewController";
import { createClient } from "@supabase/supabase-js";
import { Interview } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function Schedule() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
//TODO: change status from completed/canceled to confirmed/pending in supabase enum type
  const pending = interviews.filter(
    (i) => i.status === "completed"
  );

  const confirmed = interviews.filter(
    (i) => i.status === "canceled"
  );

  useEffect(() => {
    const fetchInterviews = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const data =
        await interviewController.getCandidateInterviews(user.id);

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
      {/* TODO: Card information for all cards should be replaced with real data from props or API */}
      <div className="mb-3 space-y-3">
        {pending.map((interview) => {
          const start = new Date(interview.scheduled_start);
          const end = new Date(interview.scheduled_end);

          return (
            <PendingApptCard
              key={interview.interview_id}
              title={
                interview.process_round.interview_category.category_name
              }
              infoItems={[
                start.toLocaleDateString(),
                `${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`,
                `Interviewer: ${interview.interviewer.full_name}`,
                "Virtual - Zoom Link",
              ]}
              onConfirm={() => console.log("Confirm")}
              onReschedule={() => console.log("Reschedule")}
            />
          );
        })}
      </div>

      <div className="mt-0.5 px-20">
        <h2 className="text-2xl font-bold text-blue-800">
          Confirmed Interviews
        </h2>
      </div>

      <div className="mb-3 space-y-3">
        {confirmed.map((interview) => {
          const start = new Date(interview.scheduled_start);
          const end = new Date(interview.scheduled_end);

          return (
            <ConfirmedApptCard
              key={interview.interview_id}
              title={
                interview.process_round.interview_category.category_name
              }
              infoItems={[
                start.toLocaleDateString(),
                `${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`,
                `Interviewer: ${interview.interviewer.full_name}`,
                "Virtual - Zoom Link",
              ]}
              onAddCalendar={() => console.log("Add to calendar")}
            />
          );
        })}
      </div>
    </>
  );
}

// export function Schedule() {
//   return (
//     <>
//       <div className="px-20">
//         <h2 className="text-2xl font-bold text-blue-800">
//           Pending Confirmation
//         </h2>
//         <p>Please review and confirm these interview times</p>
//       </div>
//       {/* TODO: Card information for all cards should be replaced with real data from props or API */}
//       <div className="mb-3 space-y-3">
//         <PendingApptCard
//           title="Technical Interview"
//           infoItems={[
//             "Wednesday, Dec 11",
//             "2:00 PM - 3:00 PM",
//             "Interviewer: Jane Doe",
//             "Virtual - Zoom Link",
//           ]}
//           onConfirm={() => {
//             console.log("Confirming availability");
//           }}
//           onReschedule={() => {
//             console.log("Rescheduling...");
//           }}
//         />

//         <PendingApptCard
//           title="Technical Interview"
//           infoItems={[
//             "Wednesday, Dec 11",
//             "2:00 PM - 3:00 PM",
//             "Interviewer: Jane Doe",
//             "Virtual - Zoom Link",
//           ]}
//           onConfirm={() => {
//             console.log("Confirming availability");
//           }}
//           onReschedule={() => {
//             console.log("Rescheduling...");
//           }}
//         />
//       </div>

//       <div className="mt-0.5 px-20">
//         <h2 className="text-2xl font-bold text-blue-800">
//           Confirmed Interviews
//         </h2>
//       </div>

//       <div className="mb-3 space-y-3">
//         <ConfirmedApptCard
//           title="HR Interview"
//           infoItems={[
//             "Monday, Dec 9",
//             "10:00 AM - 10:45 AM",
//             "Interviewer: John Doe",
//             "Virtual - Zoom Link",
//           ]}
//           onAddCalendar={() => {
//             console.log("Adding to calendar");
//           }}
//         />
//       </div>
//     </>
//   );
// }