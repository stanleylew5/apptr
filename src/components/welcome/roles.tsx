import { Settings, Users, CircleUser } from "lucide-react";
import { RoleCard } from "./rolecard";

export function Roles() {
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
          linkPath="/welcome"
          linkText="Continue as Coordinator"
          icon={Settings}
        />
        <RoleCard
          title="Interviewer"
          description="I'll be conducting interviews"
          bullets={[
            "Share your availability",
            "View assigned interviews",
            "Manage your schedule",
          ]}
          linkPath="/interviewer"
          linkText="Continue as Interviewer"
          icon={Users}
        />
        <RoleCard
          title="Candidate"
          description="I'm interviewing for a position"
          bullets={[
            "Share your availability",
            "Accept/decline invitations",
            "View your interview schedule",
          ]}
          linkPath="/candidate"
          linkText="Continue as Candidate"
          icon={CircleUser}
        />
      </div>
    </div>
  );
}
