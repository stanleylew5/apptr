"use client";
import { useEffect, useState } from "react";
import { authController } from "@/controllers/auth";
import AvailabilityX from "@/components/availability/availability";
import { Schedule } from "@/components/schedule/schedule";
import Loading from "@/components/loading";
import { AccessDenied } from "@/components/accessdenied";

type ViewMode = "schedule" | "availability";

const Dashboard = () => {
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("schedule");

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

  if (loading) {
    return <Loading />;
  }

  if (!userId) {
    return <AccessDenied />;
  }

  return (
    <div className="px-20 py-10">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-3xl font-bold text-blue-800">
          Welcome, {fullName ? `${fullName}!` : "User!"}
        </h2>
        <p className="text-blue-400">You have {2} interviews</p>
      </div>

      <div className="mx-auto flex max-w-6xl gap-5 bg-gray-100 p-1 px-4">
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

      {view === "availability" && <AvailabilityX />}
      {view === "schedule" && <Schedule />}
    </div>
  );
};

export default Dashboard;
