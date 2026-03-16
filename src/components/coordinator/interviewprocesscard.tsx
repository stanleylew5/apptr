"use client";
import { useState } from "react";
import { InterviewProcess } from "@/controllers/interviewprocess";
import { ProcessRoundsList } from "./processroundslist";

interface InterviewProcessCardProps {
  process: InterviewProcess;
}

export const InterviewProcessCard = ({
  process,
}: InterviewProcessCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
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
          <h4 className="mb-4 text-lg font-semibold text-gray-800">
            Interview Rounds ({process.rounds?.length || 0})
          </h4>
          {process.rounds ? (
            <ProcessRoundsList rounds={process.rounds} />
          ) : (
            <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-600">No rounds data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
