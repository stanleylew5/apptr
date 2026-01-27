"use client";
import { AccessDenied } from "@/components/accessdenied";
import { useSession } from "@/utils/useSession";
import Availability from "@/components/availability/availability";

const Page = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col place-items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <AccessDenied />;
  }

  return <Availability />;
};

export default Page;
