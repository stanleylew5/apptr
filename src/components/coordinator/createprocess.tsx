"use client";

import React, { useState, useEffect } from "react";
import { Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { organizationController } from "@/controllers/organization";
import { interviewProcessController } from "@/controllers/interviewprocess";

interface InterviewType {
  name: string;
  duration: number | string;
}

interface InterviewerAssignment {
  interviewerName: string;
  interviewerUserId: string;
  interviewType: string;
}

interface OrgInterviewer {
  user_id: string;
  full_name: string;
  role?: string;
}

interface InterviewRequirement {
  type: string;
  count: number | string;
}

interface Candidate {
  name: string;
  email: string;
  interviewRequirements: InterviewRequirement[];
}

const CreateProcess: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");

  const [currentStep, setCurrentStep] = useState(1);

  // Interview Types
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDuration, setNewTypeDuration] = useState("");
  const [processName, setProcessName] = useState("");

  // Interviewer Assignments
  const [interviewers, setInterviewers] = useState<OrgInterviewer[]>([]);
  const [interviewerAssignments, setInterviewerAssignments] = useState<
    InterviewerAssignment[]
  >([]);
  const [selectedInterviewerId, setSelectedInterviewerId] = useState("");
  const [selectedTypeForInterviewer, setSelectedTypeForInterviewer] =
    useState("");

  // Candidates
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateEmail, setNewCandidateEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch interviewers from org
  useEffect(() => {
    const fetchInterviewers = async () => {
      if (orgId) {
        try {
          const members =
            await organizationController.getOrganizationMembers(orgId);
          setInterviewers(members);
        } catch (error) {
          console.error("Error fetching interviewers:", error);
        }
      }
    };

    fetchInterviewers();
  }, [orgId]);

  const addInterviewType = () => {
    if (
      newTypeName.trim() &&
      newTypeDuration &&
      parseInt(newTypeDuration.toString()) > 0
    ) {
      setInterviewTypes([
        ...interviewTypes,
        {
          name: newTypeName.trim(),
          duration: parseInt(newTypeDuration.toString()),
        },
      ]);
      setNewTypeName("");
      setNewTypeDuration("");
    }
  };

  const removeInterviewType = (index: number) => {
    setInterviewTypes(interviewTypes.filter((_, i) => i !== index));
  };

  const addInterviewerAssignment = () => {
    if (selectedInterviewerId && selectedTypeForInterviewer) {
      const selectedInterviewer = interviewers.find(
        (i) => i.user_id === selectedInterviewerId,
      );
      if (selectedInterviewer) {
        setInterviewerAssignments([
          ...interviewerAssignments,
          {
            interviewerName: selectedInterviewer.full_name,
            interviewerUserId: selectedInterviewer.user_id,
            interviewType: selectedTypeForInterviewer,
          },
        ]);
        setSelectedInterviewerId("");
        setSelectedTypeForInterviewer("");
      }
    }
  };

  const removeInterviewerAssignment = (index: number) => {
    setInterviewerAssignments(
      interviewerAssignments.filter((_, i) => i !== index),
    );
  };

  const addCandidate = () => {
    if (newCandidateName.trim() && newCandidateEmail.trim()) {
      setCandidates([
        ...candidates,
        {
          name: newCandidateName.trim(),
          email: newCandidateEmail.trim(),
          interviewRequirements: interviewTypes.map((type) => ({
            type: type.name,
            count: "",
          })),
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

  const handleNext = () => {
    setError(null);
    if (currentStep === 1 && interviewTypes.length === 0) {
      setError("Please add at least one interview category before proceeding");
      return;
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    if (!orgId) {
      console.error("No organization ID found");
      return;
    }

    try {
      // Use user-defined process name or generate default
      const finalProcessName =
        processName.trim() ||
        `Interview Process - ${new Date().toLocaleDateString()}`;

      // Create interview process
      const processId = await interviewProcessController.createInterviewProcess(
        orgId,
        finalProcessName,
      );

      if (!processId) {
        console.error("Failed to create interview process");
        return;
      }

      // Create interview categories and get a map of category names to IDs
      const categoryMap =
        await interviewProcessController.createInterviewCategories(
          orgId,
          processId,
          interviewTypes.map((type) => ({
            name: type.name,
            duration: parseInt(type.duration.toString()),
          })),
        );

      // Create process rounds and get map of process_round_ids per category
      const processRoundsByCategory =
        await interviewProcessController.createProcessRounds(
          orgId,
          processId,
          candidates,
          categoryMap,
        );

      // Create candidates and get map of candidate_ids
      const candidateMap = await interviewProcessController.createCandidates(
        orgId,
        processId,
        candidates,
      );

      // Create interview records linking candidates to process rounds
      await interviewProcessController.createInterviews(
        orgId,
        candidates,
        candidateMap,
        processRoundsByCategory,
      );

      // Assign interviewers to categories
      await interviewProcessController.assignInterviewersToCategories(
        orgId,
        interviewerAssignments,
        categoryMap,
      );

      // Navigate to dashboard
      router.push(`/coordinator/process/dashboard?org=${orgId}`);
    } catch (error) {
      console.error("Error completing interview process setup:", error);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Define Interview Types";
      case 2:
        return "Assign Interviewers to Categories";
      case 3:
        return "Add Candidates and Requirements";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Step 1: Create interview categories and define their duration";
      case 2:
        return "Step 2: Assign interviewers to interview categories";
      case 3:
        return "Step 3: Add candidates and specify interview requirements";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="mx-auto w-full max-w-6xl p-6">
        <h1 className="mb-6 text-center text-3xl font-bold text-blue-800">
          Set Up Interview Process
        </h1>
        <p className="mb-8 text-center text-gray-500">{getStepDescription()}</p>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-8">
          {[1, 2, 3].map((step) => (
            <div key={step}>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ${
                    currentStep === step || currentStep > step
                      ? "bg-blue-600"
                      : "bg-gray-300"
                  }`}
                >
                  {step}
                </div>
                <span
                  className={`text-sm ${
                    currentStep === step
                      ? "font-semibold text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {step === 1
                    ? "Interview Types"
                    : step === 2
                      ? "Interviewers"
                      : "Candidates"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {error && (
            <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-800">
                {getStepTitle()}
              </h2>

              {/* Process Name Input */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Process Name
                </h3>
                <input
                  type="text"
                  value={processName}
                  onChange={(e) => setProcessName(e.target.value)}
                  placeholder="e.g., SWE Intern Summer 2026 - Stanley"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-2 text-sm text-gray-500">
                  If left empty, a default name will be generated
                </p>
              </div>

              {/* Existing Interview Types */}
              <div className="space-y-3">
                {interviewTypes.map((type, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-white p-4 shadow"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-blue-200 px-3 py-1 font-semibold text-blue-800">
                        {type.name}
                      </span>
                      <span className="text-gray-600">
                        {type.duration} minutes
                      </span>
                    </div>
                    <button
                      onClick={() => removeInterviewType(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Interview Type Form */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Add Interview Category
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Type name (e.g., Technical, HR)"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <select
                    value={newTypeDuration}
                    onChange={(e) => setNewTypeDuration(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Duration</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                  <button
                    onClick={addInterviewType}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-800">
                {getStepTitle()}
              </h2>

              <div className="space-y-4">
                {interviewTypes.map((type) => {
                  const assignmentsForType = interviewerAssignments.filter(
                    (a) => a.interviewType === type.name,
                  );

                  return (
                    <div
                      key={type.name}
                      className="rounded-lg bg-white p-4 shadow"
                    >
                      <h3 className="mb-3 font-semibold text-gray-900">
                        {type.name}
                      </h3>
                      {assignmentsForType.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No interviewers assigned yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {assignmentsForType.map((assignment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded bg-gray-50 p-2"
                            >
                              <span className="text-sm text-gray-900">
                                {assignment.interviewerName}
                              </span>
                              <button
                                onClick={() =>
                                  removeInterviewerAssignment(
                                    interviewerAssignments.indexOf(assignment),
                                  )
                                }
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Assign Interviewer
                </h3>
                {interviewers.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No interviewers found in this organization.
                  </p>
                ) : (
                  <div className="flex gap-3">
                    <select
                      value={selectedInterviewerId}
                      onChange={(e) => setSelectedInterviewerId(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select Interviewer</option>
                      {interviewers.map((interviewer) => (
                        <option
                          key={interviewer.user_id}
                          value={interviewer.user_id}
                        >
                          {interviewer.full_name}
                          {interviewer.role ? ` (${interviewer.role})` : ""}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedTypeForInterviewer}
                      onChange={(e) =>
                        setSelectedTypeForInterviewer(e.target.value)
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {interviewTypes.map((type) => (
                        <option key={type.name} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={addInterviewerAssignment}
                      className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-800">
                {getStepTitle()}
              </h2>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Add Candidate
                </h3>
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
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {candidates.map((candidate, index) => (
                  <div key={index} className="rounded-lg bg-white p-4 shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {candidate.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {candidate.email}
                        </p>
                        <div className="mt-3 space-y-2">
                          {candidate.interviewRequirements.map((req) => (
                            <div
                              key={req.type}
                              className="flex items-center gap-3"
                            >
                              <span className="rounded-md bg-blue-200 px-2 py-1 text-sm font-semibold text-blue-800">
                                {req.type}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={req.count}
                                onChange={(e) =>
                                  updateRequirement(
                                    index,
                                    req.type,
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
                          ))}
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
          )}
        </div>

        <div className="mx-auto flex max-w-md justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 rounded-md bg-gray-600 px-6 py-2 text-white hover:bg-gray-700 disabled:bg-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700"
            >
              Schedule Interviews
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProcess;
