"use client";
import { useEffect, useState } from "react";
import { Roles } from "@/components/welcome/roles";
import { AccessDenied } from "@/components/accessdenied";
import { useSession } from "@/utils/useSession";
import { useRouter } from "next/navigation";
import { authController } from "@/controllers/auth";
import Loading from "@/components/loading";

const Page = () => {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const [hasNoRole, setHasNoRole] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isLoading && session) {
        try {
          const user = await authController.getCurrentUser();
          if (user) {
            const primaryRole = await authController.getUserPrimaryRole(user);
            if (primaryRole) {
              setShouldRedirect(true);
              router.push(`/${primaryRole}`);
              return;
            } else {
              setHasNoRole(true);
            }
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          setHasNoRole(true);
        }
      } else if (!isLoading && !session) {
        setHasNoRole(false);
      }
    };

    checkUserRole();
  }, [isLoading, session, router]);

  if (isLoading || shouldRedirect || !hasNoRole) {
    return <Loading />;
  }

  if (!session) {
    return <AccessDenied />;
  }

  return <Roles />;
};

export default Page;
