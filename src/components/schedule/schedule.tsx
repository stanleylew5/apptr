"use client";

import React from "react";
import { PendingApptCard } from "../appointments/pendingCard";
import { ConfirmedApptCard } from "../appointments/confirmedCard";

export function Schedule() {
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
        <PendingApptCard
          title="Technical Interview"
          infoItems={[
            "Wednesday, Dec 11",
            "2:00 PM - 3:00 PM",
            "Interviewer: Jane Doe",
            "Virtual - Zoom Link",
          ]}
          onConfirm={() => {
            console.log("Confirming availability");
          }}
          onReschedule={() => {
            console.log("Rescheduling...");
          }}
        />

        <PendingApptCard
          title="Technical Interview"
          infoItems={[
            "Wednesday, Dec 11",
            "2:00 PM - 3:00 PM",
            "Interviewer: Jane Doe",
            "Virtual - Zoom Link",
          ]}
          onConfirm={() => {
            console.log("Confirming availability");
          }}
          onReschedule={() => {
            console.log("Rescheduling...");
          }}
        />
      </div>

      <div className="mt-0.5 px-20">
        <h2 className="text-2xl font-bold text-blue-800">
          Confirmed Interviews
        </h2>
      </div>

      <div className="mb-3 space-y-3">
        <ConfirmedApptCard
          title="HR Interview"
          infoItems={[
            "Monday, Dec 9",
            "10:00 AM - 10:45 AM",
            "Interviewer: John Doe",
            "Virtual - Zoom Link",
          ]}
          onAddCalendar={() => {
            console.log("Adding to calendar");
          }}
        />
      </div>
    </>
  );
}
