"use client";
import { useEffect, useState } from "react";
import { Roles } from "@/components/welcome/roles";
import { AccessDenied } from "@/components/accessdenied";
import { useSession } from "@/utils/useSession";
import { useRouter } from "next/navigation";
import { authController } from "@/controllers/auth";

const Page = () => {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isLoading && session) {
        try {
          const user = await authController.getCurrentUser();
          if (user) {
            const primaryRole = await authController.getUserPrimaryRole(user);
            if (primaryRole) {
              // User has a role assigned, redirect them
              router.push(`/${primaryRole}`);
              return;
            }
          }
        } catch (error) {
          console.error("Error checking user role:", error);
        }
      }
      setIsCheckingRole(false);
    };

    checkUserRole();
  }, [isLoading, session, router]);

  if (isLoading || isCheckingRole) {
    return (
      <div className="flex min-h-screen flex-col place-items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <AccessDenied />;
  }

  return <Roles />;
};

export default Page;
