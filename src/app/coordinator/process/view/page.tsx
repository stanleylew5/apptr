"use client";
import { ViewProcesses } from "@/components/coordinator/viewprocesses";
import Loading from "@/components/loading";
import { Suspense } from "react";

const Page = () => {
  return (
    <Suspense fallback={<Loading />}>
      <ViewProcesses />
    </Suspense>
  );
};

export default Page;
