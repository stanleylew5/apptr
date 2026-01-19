import Link from "next/link";
import { LucideIcon, Settings, Users, CircleUser, ArrowRight } from "lucide-react";
import React from "react";

interface RoleCardProps {
  title: string
  description: string
  bullets: string[]
  linkPath: string
  linkText: string
  icon: LucideIcon
}

function RoleCard({ title, description, bullets, linkPath, linkText, icon: Icon }: RoleCardProps) {
  return (
    <div className="p-6 border-2 border-gray-200 rounded-lg shadow flex flex-col gap-2 w-85">
      <div className="bg-blue-100 rounded-lg w-17 h-17 flex place-items-center justify-center">
      <Icon className="w-9 h-9 text-blue-800"/>
      </div>
      <h2 className="text-2xl font-semibold text-blue-800">{title}</h2>
      <p>{description}</p>
      <ul className="list-disc pl-4 marker:text-blue-800">
        {bullets.map((b, i) => (
          <li key={i} className="text-black">
            {b}
          </li>
        ))}
      </ul>
      <div className="text-blue-800 flex gap-2">
        <Link href={linkPath} className="font-semibold"> {linkText} </Link>
        <ArrowRight/>
      </div>
    </div>
  );
}

const Page = () => {
  return (
    <div className="flex flex-col place-items-center justify-center gap-4 min-h-screen">
      <div className="text-5xl font-bold text-blue-800">
        Welcome to Apptr
      </div>

      <div className="text-xl">
        Choose your role to get started
      </div>

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
            linkPath="/availability"
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
            linkPath="/welcome"
            linkText="Continue as Candidate"
            icon={CircleUser}
        />
      </div>

    </div>
  );
};

export default Page;
