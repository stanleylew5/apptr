"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error.message);
      return;
    }

    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="space-y-6 rounded-2xl bg-white p-8 text-center shadow-md">
        <h1 className="text-2xl font-semibold text-gray-900">
          You’re signed in 🎉
        </h1>

        <p className="text-gray-500">Click below to sign out of your account</p>

        <button
          onClick={signOut}
          className="rounded-lg bg-red-500 px-6 py-2 font-medium text-white hover:bg-red-600 active:bg-red-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Page;
