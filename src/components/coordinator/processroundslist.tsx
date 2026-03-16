"use client";
import { ProcessRound } from "@/controllers/interviewprocess";

interface ProcessRoundsListProps {
  rounds: ProcessRound[];
}

export const ProcessRoundsList = ({ rounds }: ProcessRoundsListProps) => {
  if (rounds.length === 0) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-600">No rounds configured for this process</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 hover:cursor-auto">
      {rounds.map((round) => (
        <div
          key={round.process_round_id}
          className="rounded-lg border-2 border-blue-200 bg-white p-6 transition-all hover:border-blue-400"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-4">
                <span className="inline-block min-w-14 rounded-full bg-blue-600 px-4 py-2 text-center font-bold text-white">
                  Round {round.round}
                </span>
                <h3 className="text-2xl font-bold text-blue-900">
                  {round.category?.category_name || "Unknown Category"}
                </h3>
              </div>
              <div className="mt-4 ml-0 space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold">Duration:</span>{" "}
                  {round.category?.minutes || "Unknown"} minutes
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Required Count:</span>{" "}
                  {round.required_count}
                </p>
                {/* <p className="text-sm text-gray-500"> 
                  Round ID: {round.process_round_id}
                </p> */}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
