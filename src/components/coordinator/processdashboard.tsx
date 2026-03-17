"use client";
import { useSearchParams } from "next/navigation";

const ProcessDashboard = () => {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");

  if (!orgId) {
    return <div>Organization not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900">
            Interview Process Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Organization ID: {orgId}</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <p className="text-gray-600">
            Your interview process has been set up successfully!
          </p>
          <p className="mt-4 text-gray-500">Dashboard content coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default ProcessDashboard;
