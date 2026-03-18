"use client";
import { useEffect, useState } from "react";
import { authController } from "@/controllers/auth";
import { interviewController } from "@/controllers/interview";
import Availability from "@/components/availability/availability";
import { Schedule } from "@/components/schedule/schedule";
import Loading from "@/components/loading";
import { AccessDenied } from "@/components/accessdenied";

type ViewMode = "schedule" | "availability";

const Dashboard = () => {
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("schedule");
  const [interviewCount, setInterviewCount] = useState<number>(0);

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

      const interviewCount =
        await interviewController.getInterviewCountCandidate(currentUserId);
      setInterviewCount(interviewCount);
      setLoading(false);
    }

    initialize();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!userId) {
    return <AccessDenied />;
  }

  return (
    <div className="mt-4 mb-10 px-20">
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
      {view === "schedule" && <Schedule forceRole="candidate" />}
    </div>
  );
};

export default Dashboard;
