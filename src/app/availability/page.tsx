"use client";
import { AccessDenied } from "@/components/accessdenied";
import { useSession } from "@/utils/useSession";
import Availability from "@/components/availability/availability";
import Loading from "@/components/loading";

const Page = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <Loading/>
    );
  }

  if (!session) {
    return <AccessDenied />;
  }

  return <Availability />;
};

export default Page;
