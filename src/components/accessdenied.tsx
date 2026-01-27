"use client";

import { useRouter } from "next/navigation";

export function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col place-items-center justify-center gap-4">
      <div className="text-2xl font-bold text-red-600">Access Denied</div>
      <div className="text-lg">You must be signed in to access this page.</div>
      <button
        onClick={() => router.push("/")}
        className="mt-4 rounded-lg bg-blue-800 px-6 py-2 font-semibold text-white hover:bg-blue-900"
      >
        Go to Sign In
      </button>
    </div>
  );
}
