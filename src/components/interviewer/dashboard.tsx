"use client";
import { useEffect, useState } from "react";
import { authController } from "@/controllers/auth";
import { interviewController } from "@/controllers/interview";
import Availability from "@/components/availability/availability";
import { Schedule } from "@/components/schedule/schedule";
import Loading from "@/components/loading";
import { AccessDenied } from "@/components/accessdenied";
import { JoinOrganization } from "@/components/interviewer/joinorganization";
import { Organization } from "@/types/organization";
import { ViewMode } from "@/types/user";

const Dashboard = () => {
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("schedule");
  const [interviewCount, setInterviewCount] = useState<number>(0);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  useEffect(() => {
    async function initialize() {
      const currentUserId = await authController.getCurrentUserId();
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      setUserId(currentUserId);
      const name = await authController.getFullName();
      setFullName(name);

      setLoading(false);
    }

    initialize();
  }, []);

  const handleOrganizationSelected = async (org: Organization) => {
    setSelectedOrganization(org);
    if (userId) {
      const interviewCount =
        await interviewController.getInterviewCountInterviewer(userId);
      setInterviewCount(interviewCount);
    }
  };

  if (loading) return <Loading />;

  if (!userId) return <AccessDenied />;

  if (!selectedOrganization)
    return (
      <JoinOrganization onOrganizationSelected={handleOrganizationSelected} />
    );

  return (
    <div className="mt-4 mb-10 px-20">
      <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 p-4">
        <div>
          <p className="text-sm text-gray-600">Current Organization</p>
          <p className="text-lg font-semibold text-blue-900">
            {selectedOrganization.organization_name}
          </p>
        </div>
        <button
          onClick={() => setSelectedOrganization(null)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Switch Organization
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        <h2 className="text-3xl font-bold text-blue-800">
          Welcome, {fullName ? `${fullName}!` : "User!"}
        </h2>
        <p className="text-blue-400">
          You have {interviewCount} upcoming interview
          {interviewCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="mx-auto mt-4 flex gap-5 bg-gray-100 px-4">
        <button
          onClick={() => setView("schedule")}
          className={`px-2 py-1 font-medium ${
            view === "schedule"
              ? "border-b-2 border-blue-800 text-blue-800"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          My Schedule
        </button>

        <button
          onClick={() => setView("availability")}
          className={`px-2 py-1 font-medium ${
            view === "availability"
              ? "border-b-2 border-blue-800 text-blue-800"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          Edit Availability
        </button>
      </div>

      {view === "availability" && <Availability />}
      {view === "schedule" && <Schedule forceRole="interviewer" />}
    </div>
  );
};

export default Dashboard;
