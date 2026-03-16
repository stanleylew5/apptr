import { Suspense } from "react";
import CreateProcess from "@/components/coordinator/createprocess";
import Loading from "@/components/loading";
const Page = () => {
  return (
    <Suspense fallback={<Loading />}>
      <CreateProcess />
    </Suspense>
  );
};

export default Page;
