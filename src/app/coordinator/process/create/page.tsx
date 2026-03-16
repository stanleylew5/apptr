import { Suspense } from "react";
import { CreateProcess } from "@/components/coordinator/createprocess";

const Page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateProcess />
    </Suspense>
  );
};

export default Page;
