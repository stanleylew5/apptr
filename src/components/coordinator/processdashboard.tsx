"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScheduledDashboard } from "./scheduleddashboard";
import { organizationController } from "@/controllers/organization";
import {
  interviewProcessController,
  InterviewProcess,
} from "@/controllers/interviewprocess";
import { InterviewProcessCard } from "./interviewprocesscard";
import Loading from "@/components/loading";
import { Organization } from "@/types/types";

const ProcessDashboard = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = searchParams.get("org");
  const [activeTab, setActiveTab] = useState<"scheduled" | "processes">(
    "scheduled",
  );
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [processes, setProcesses] = useState<InterviewProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      return;
    }

    const loadData = async () => {
      try {
        const org = await organizationController.getOrganization(orgId);
        setOrganization(org);

        const interviewProcesses =
          await interviewProcessController.getProcessesWithRoundsByOrganization(
            orgId,
          );
        setProcesses(interviewProcesses);
      } catch (err) {
        console.error("[ProcessDashboard] Error loading data:", err);
        setError("Failed to load interview processes");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orgId]);

  if (!orgId) {
    return <div>Organization not found</div>;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="text-4xl font-bold text-blue-900">
            Coordinator Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            {organization && `Organization: ${organization.organization_name}`}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-8 border-t border-gray-200">
            <button
              onClick={() => setActiveTab("scheduled")}
              className={`px-4 py-4 font-semibold transition-colors ${
                activeTab === "scheduled"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📅 Scheduled Interviews
            </button>
            <button
              onClick={() => setActiveTab("processes")}
              className={`px-4 py-4 font-semibold transition-colors ${
                activeTab === "processes"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ⚙️ Interview Processes
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {activeTab === "scheduled" && (
          <ScheduledDashboard organizationId={orgId} />
        )}

        {activeTab === "processes" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() =>
                  router.push(`/coordinator/process/create?org=${orgId}`)
                }
                className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:cursor-pointer hover:bg-blue-700"
              >
                + Create New Process
              </button>
            </div>
            {processes.length === 0 ? (
              <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-12 text-center">
                <p className="mb-4 text-lg text-gray-600">
                  No interview processes found for this organization
                </p>
                <button
                  onClick={() =>
                    router.push(`/coordinator/process/create?org=${orgId}`)
                  }
                  className="inline-block rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:cursor-pointer hover:bg-blue-700"
                >
                  Create First Process
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {processes.map((process) => (
                  <InterviewProcessCard
                    key={process.process_id}
                    process={process}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="mx-auto max-w-7xl px-6 pb-6">
        <button
          onClick={() => router.push("/coordinator")}
          className="font-semibold text-blue-600 underline hover:cursor-pointer hover:text-blue-800"
        >
          ← Back to Organizations
        </button>
      </div>
    </div>
  );
};

export default ProcessDashboard;
