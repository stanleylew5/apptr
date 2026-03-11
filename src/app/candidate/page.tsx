"use client";
import { useSession } from "@/utils/useSession";
import Dashboard from "@/components/candidate/dashboard";
import Loading from "@/components/loading";
import { AccessDenied } from "@/components/accessdenied";

const Page = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <Loading />;
  }

  if (!session) {
    return <AccessDenied />;
  }

  return <Dashboard />;
};

export default Page;
