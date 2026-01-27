"use client";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import google from "@/public/google.svg";

const SignIn = () => {
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });

    if (error) console.error(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <div className="flex flex-col items-center gap-6">
          <Image src={google} alt="google" className="h-12 w-12" />

          <h1 className="text-xl font-semibold text-gray-900">
            Sign in to your account
          </h1>

          <p className="text-center text-sm text-gray-500">
            Use your Google account to continue
          </p>

          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100"
          >
            <Image src={google} alt="Google" className="h-5 w-5" />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
