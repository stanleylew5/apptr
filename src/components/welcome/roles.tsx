"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Users, CircleUser } from "lucide-react";
import { RoleCard } from "./rolecard";
import { authController } from "@/controllers/auth";

export function Roles() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSelectRole = async (
    role: "coordinator" | "interviewer" | "candidate",
  ) => {
    setIsLoading(true);
    try {
      const userId = await authController.getCurrentUserId();
      if (!userId) {
        console.error("No user ID found");
        setIsLoading(false);
        return;
      }
      const success = await authController.setUserRole(userId, role);
      if (success) {
        // Redirect to their role page
        router.push(`/${role}`);
      } else {
        console.error("Failed to set user role");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error selecting role:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col place-items-center justify-center gap-4">
      <div className="text-5xl font-bold text-blue-800">Welcome to Apptr</div>

      <div className="text-xl">Choose your role to get started</div>

      <div className="flex gap-8">
        <RoleCard
          title="Coordinator"
          description="I'm organizing the interview process"
          bullets={[
            "Set up interview categories",
            "Assign interviewers to roles",
            "Manage candidates",
          ]}
          roleType="coordinator"
          linkText="Continue as Coordinator"
          icon={Settings}
          onSelectRole={handleSelectRole}
          isLoading={isLoading}
        />
        <RoleCard
          title="Interviewer"
          description="I'll be conducting interviews"
          bullets={[
            "Share your availability",
            "View assigned interviews",
            "Manage your schedule",
          ]}
          roleType="interviewer"
          linkText="Continue as Interviewer"
          icon={Users}
          onSelectRole={handleSelectRole}
          isLoading={isLoading}
        />
        <RoleCard
          title="Candidate"
          description="I'm interviewing for a position"
          bullets={[
            "Share your availability",
            "Accept/decline invitations",
            "View your interview schedule",
          ]}
          roleType="candidate"
          linkText="Continue as Candidate"
          icon={CircleUser}
          onSelectRole={handleSelectRole}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
