"use client";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import google from "@/public/google.svg";

const SignIn = () => {
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/welcome`,
      },
    });

    if (error) console.error(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-600">
      <div className="w-full max-w-sm rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Image src={google} alt="google" className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome To Apptr
          </h1>
          <p className="text-center text-sm text-gray-600">
            Sign in with Google to continue
          </p>
          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-md transition hover:bg-gray-50 hover:shadow-lg active:scale-[0.98]"
          >
            <Image src={google} alt="Google" className="h-5 w-5" /> Continue
            with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
