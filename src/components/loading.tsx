import { AiOutlineLoading3Quarters } from "react-icons/ai";
const Loading = () => {
  return (
    <div className="flex min-h-screen flex-col place-items-center justify-center">
      <AiOutlineLoading3Quarters className="animate-spin text-2xl" />
    </div>
  );
};

export default Loading;
