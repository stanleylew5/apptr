"use client";

import React, { useState } from "react";
import { Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface InterviewRequirement {
  type: string;
  // allow numeric value or empty string while typing
  count: number | string;
}

interface Candidate {
  name: string;
  email: string;
  interviewRequirements: InterviewRequirement[];
}

const CreateProcess: React.FC = () => {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateEmail, setNewCandidateEmail] = useState("");

  const addCandidate = () => {
    if (newCandidateName.trim() && newCandidateEmail.trim()) {
      setCandidates([
        ...candidates,
        {
          name: newCandidateName.trim(),
          email: newCandidateEmail.trim(),
          interviewRequirements: [
            { type: "HR", count: "" },
            { type: "Technical", count: "" },
          ],
        },
      ]);
      setNewCandidateName("");
      setNewCandidateEmail("");
    }
  };

  const removeCandidate = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const updateRequirement = (
    candidateIndex: number,
    type: string,
    value: number | string,
  ) => {
    setCandidates((prev) =>
      prev.map((cand, i) => {
        if (i === candidateIndex) {
          const reqs = cand.interviewRequirements.map((r) =>
            r.type === type ? { ...r, count: value } : r,
          );
          return { ...cand, interviewRequirements: reqs };
        }
        return cand;
      }),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="mx-auto w-full max-w-6xl p-6">
        <h1 className="mb-6 text-center text-3xl font-bold text-blue-800">
          Set Up Interview Process
        </h1>
        <p className="mb-8 text-center text-gray-500">
          Step 3: Add candidates and specify interview requirements
        </p>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-white">
              1
            </div>
            <span className="text-sm text-gray-600">Interview Types</span>
          </div>
          <div className="h-1 w-16 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-white">
              2
            </div>
            <span className="text-sm text-gray-600">Interviewers</span>
          </div>
          <div className="h-1 w-16 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              3
            </div>
            <span className="text-sm font-semibold text-blue-600">
              Candidates
            </span>
          </div>
        </div>

        {/* Section Header */}
        <div className="mb-6 flex items-center gap-2">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
          </svg>
          <h2 className="text-lg font-semibold text-blue-600">
            Candidates & Interview Requirements
          </h2>
        </div>

        <div className="space-y-6">
          {/* Add Candidate Section */}
          <div className="w-full rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 font-semibold text-gray-900">Add Candidate</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                placeholder="Name"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="email"
                value={newCandidateEmail}
                onChange={(e) => setNewCandidateEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCandidate}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Candidates List */}
          <div className="space-y-4">
            {candidates.map((candidate, index) => (
              <div
                key={index}
                className="w-full rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {candidate.name}
                    </h3>
                    <p className="text-sm text-gray-600">{candidate.email}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      Interview Requirements:
                    </div>
                    <div className="mt-1 flex">
                      {/* HR half */}
                      <div className="flex w-1/2 items-center">
                        <div className="flex flex-1 items-center gap-1">
                          <span className="rounded-md bg-purple-200 px-2 py-1 text-sm font-semibold text-purple-800">
                            HR
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={
                              candidate.interviewRequirements.find(
                                (r) => r.type === "HR",
                              )?.count ?? ""
                            }
                            onChange={(e) =>
                              updateRequirement(
                                index,
                                "HR",
                                e.target.value === ""
                                  ? ""
                                  : parseInt(e.target.value, 10) || "",
                              )
                            }
                            className="w-16 rounded-md border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <span className="text-sm text-gray-600">
                            interviews
                          </span>
                        </div>
                      </div>
                      {/* Technical half */}
                      <div className="flex w-1/2 items-center">
                        <div className="flex flex-1 items-center gap-1">
                          <span className="rounded-md bg-blue-200 px-2 py-1 text-sm font-semibold text-blue-800">
                            Technical
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={
                              candidate.interviewRequirements.find(
                                (r) => r.type === "Technical",
                              )?.count ?? ""
                            }
                            onChange={(e) =>
                              updateRequirement(
                                index,
                                "Technical",
                                e.target.value === ""
                                  ? ""
                                  : parseInt(e.target.value, 10) || "",
                              )
                            }
                            className="w-16 rounded-md border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <span className="text-sm text-gray-600">
                            interviews
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCandidate(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mx-auto mt-6 flex max-w-md justify-between">
          <button
            onClick={() => router.push("/coordinator/")}
            className="flex items-center gap-2 rounded-md bg-gray-600 px-6 py-2 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            Complete Setup
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProcess;
