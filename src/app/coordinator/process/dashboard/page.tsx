import { Suspense } from "react";
import ProcessDashboard from "@/components/coordinator/processdashboard";

const Page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProcessDashboard />
    </Suspense>
  );
};

export default Page;
