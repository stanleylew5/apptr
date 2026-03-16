"use client";
import { useSearchParams, useRouter } from "next/navigation";

export const CreateProcess = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const organizationId = searchParams.get("org");

  if (!organizationId) {
    router.push("/coordinator");
    return null;
  }

  return (
    <div className="px-20 py-10">
      <div className="mb-12 flex flex-col gap-2">
        <h1 className="text-4xl font-bold text-blue-900">Create New Process</h1>
        <p className="text-gray-600">Set up a new interview process</p>
      </div>

      <div className="rounded-lg border-2 border-blue-200 bg-white p-8">
        <p className="text-lg text-gray-600">
          Interview process creation coming soon...
        </p>
      </div>

      <div className="mt-8">
        <button
          onClick={() =>
            router.push(`/coordinator/process/view?org=${organizationId}`)
          }
          className="font-semibold text-blue-600 underline hover:text-blue-800"
        >
          ← Back to Processes
        </button>
      </div>
    </div>
  );
};
