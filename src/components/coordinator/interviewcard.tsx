"use client";
import { Clock, User, CheckCircle, AlertCircle, Hourglass } from "lucide-react";
import { InterviewCardProps } from "@/types/interview";

export const InterviewCard = ({ interview }: InterviewCardProps) => {
  const isScheduled =
    interview.status === "confirmed" && interview.scheduled_start;

  // Convert UTC to PST
  const convertToPST = (utcDateStr: string | null) => {
    if (!utcDateStr) return null;
    const utcDate = new Date(utcDateStr);
    const pstDate = new Date(
      utcDate.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
      }),
    );

    return {
      date: pstDate.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      }),
      time: pstDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const getStatusColor = () => {
    if (!isScheduled) {
      return "bg-yellow-50 border-yellow-200";
    }
    if (
      interview.interviewer_confirmation &&
      interview.candidate_confirmation
    ) {
      return "bg-green-50 border-green-200";
    }
    if (
      interview.interviewer_confirmation ||
      interview.candidate_confirmation
    ) {
      return "bg-blue-50 border-blue-200";
    }
    return "bg-gray-50 border-gray-200";
  };

  const getStatusBadge = () => {
    if (!isScheduled) {
      return (
        <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          Unscheduled
        </div>
      );
    }
    if (
      interview.interviewer_confirmation &&
      interview.candidate_confirmation
    ) {
      return (
        <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
          <CheckCircle className="h-4 w-4" />
          Confirmed (Both)
        </div>
      );
    }
    if (interview.interviewer_confirmation) {
      return (
        <div className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          <Hourglass className="h-4 w-4" />
          Confirmed by Interviewer
        </div>
      );
    }
    if (interview.candidate_confirmation) {
      return (
        <div className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          <Hourglass className="h-4 w-4" />
          Confirmed by Candidate
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
        <Hourglass className="h-4 w-4" />
        Pending Confirmation
      </div>
    );
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    return convertToPST(dateStr);
  };

  const startTime = formatDateTime(interview.scheduled_start);
  const endTime = formatDateTime(interview.scheduled_end);

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-all hover:shadow-md ${getStatusColor()}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600" />
            <span className="font-semibold text-gray-900">
              {interview.candidate_name}
            </span>
          </div>

          {isScheduled && interview.interviewer_name && (
            <div className="mt-2 ml-7 text-sm text-gray-700">
              <p className="font-medium">
                Interviewer:{" "}
                <span className="font-normal">
                  {interview.interviewer_name}
                </span>
              </p>
            </div>
          )}

          {isScheduled && startTime && (
            <div className="mt-2 ml-7 flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4" />
              <div>
                <p>{startTime.date}</p>
                <p className="text-xs text-gray-500">
                  {startTime.time}
                  {endTime ? ` - ${endTime.time}` : ""}
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <span className="inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-800">
              {interview.category_name}
            </span>
            <span className="inline-block rounded-full bg-purple-200 px-3 py-1 text-xs font-medium text-purple-800">
              Round {interview.round}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {getStatusBadge()}

          {isScheduled && (
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span>Candidate:</span>
                {interview.candidate_confirmation ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <span>Interviewer:</span>
                {interview.interviewer_confirmation ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
