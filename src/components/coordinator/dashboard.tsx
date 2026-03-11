"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authController } from "@/controllers/auth";

const Dashboard = () => {
  const [fullName, setFullName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function initialize() {
      const name = await authController.getFullName();
      setFullName(name);
    }
    initialize();
  }, []);

  return (
    <div className="px-20 py-10">
      <div className="mb-12 flex flex-col gap-0.5">
        <h2 className="text-3xl font-bold text-blue-800">
          Welcome, {fullName ? `${fullName}!` : "Guest!"}
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        <div
          onClick={() => router.push("/coordinator/process/create")}
          className="transform cursor-pointer rounded-lg border-2 border-blue-200 bg-white p-8 transition-all duration-200 hover:scale-105 hover:border-blue-400 hover:shadow-lg"
        >
          <div className="mb-4 flex items-center gap-4">
            <h3 className="text-2xl font-bold text-blue-800">
              Create New Process
            </h3>
          </div>
          <p className="text-gray-600">
            Start a new interview process and set up the interview schedule,
            roles, and participants.
          </p>
        </div>

        <div
          onClick={() => router.push("/coordinator/process/view")}
          className="transform cursor-pointer rounded-lg border-2 border-purple-200 bg-white p-8 transition-all duration-200 hover:scale-105 hover:border-purple-400 hover:shadow-lg"
        >
          <div className="mb-4 flex items-center gap-4">
            <h3 className="text-2xl font-bold text-purple-800">
              View Processes
            </h3>
          </div>
          <p className="text-gray-600">
            View all current interview processes, track their status, and manage
            ongoing interviews.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
