"use client";
import { AccessDenied } from "@/components/accessdenied";
import { useSession } from "@/utils/useSession";
import Loading from "@/components/loading";
import InterviewProcessSetup from "@/components/interviewProcessSetup";

const Page = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <Loading />;
  }

  if (!session) {
    return <AccessDenied />;
  }

  return <InterviewProcessSetup />;
};

export default Page;
