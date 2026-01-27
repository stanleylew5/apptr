"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

const Navbar = () => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/welcome`,
      },
    });

    if (error) console.error(error.message);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return console.error(error.message);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <button
          onClick={() => router.push("/")}
          className="text-lg font-semibold text-gray-900"
        >
          MyApp
        </button>
        <div>
          {session ? (
            <button
              onClick={signOut}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
