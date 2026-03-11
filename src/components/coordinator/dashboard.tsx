"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authController } from "@/utils/authController";

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
      <div className="flex flex-col gap-0.5 mb-12">
        <h2 className="text-3xl font-bold text-blue-800">
          Welcome, {fullName ? `${fullName}!` : "Guest!"}
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        <div
          onClick={() => router.push("/coordinator/process/create")}
          className="bg-white border-2 border-blue-200 rounded-lg p-8 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex items-center gap-4 mb-4">
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
          className="bg-white border-2 border-purple-200 rounded-lg p-8 cursor-pointer hover:shadow-lg hover:border-purple-400 transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex items-center gap-4 mb-4">
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
