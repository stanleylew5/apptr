"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { interviewProcessController } from "@/controllers/interviewprocess";
import { organizationController } from "@/controllers/organization";
import Loading from "@/components/loading";
import { InterviewProcessCard } from "@/components/coordinator/interviewprocesscard";
import { Organization } from "@/types/organization";
import { InterviewProcess } from "@/types/process";

export const ViewProcesses = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const organizationId = searchParams.get("org");

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [processes, setProcesses] = useState<InterviewProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      router.push("/coordinator");
      return;
    }

    const loadData = async () => {
      try {
        const org =
          await organizationController.getOrganization(organizationId);
        setOrganization(org);

        const interviewProcesses =
          await interviewProcessController.getProcessesWithRoundsByOrganization(
            organizationId,
          );
        setProcesses(interviewProcesses);
      } catch (err) {
        console.error("[ViewProcesses] Error loading data:", err);
        setError("Failed to load interview processes");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId, router]);

  if (loading) {
    return <Loading />;
  }

  if (!organizationId) {
    return null;
  }

  return (
    <div className="px-20 py-10">
      <div className="mb-12 flex flex-col gap-2">
        <h1 className="text-4xl font-bold text-purple-900">
          Interview Processes
        </h1>
        <p className="text-gray-600">
          {organization && `Organization: ${organization.organization_name}`}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {processes.length === 0 ? (
        <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-12 text-center">
          <p className="mb-4 text-lg text-gray-600">
            No interview processes found for this organization
          </p>
          <button
            onClick={() =>
              router.push(`/coordinator/process/create?org=${organizationId}`)
            }
            className="inline-block rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:cursor-pointer hover:bg-blue-700"
          >
            Create First Process
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() =>
                router.push(`/coordinator/process/create?org=${organizationId}`)
              }
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:cursor-pointer hover:bg-blue-700"
            >
              + Create New Process
            </button>
          </div>
          {processes.map((process) => (
            <InterviewProcessCard key={process.process_id} process={process} />
          ))}
        </div>
      )}

      <div className="mt-8">
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
