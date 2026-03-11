"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/utils/useSession";
import Dashboard from "@/components/interviewer/dashboard";
import Loading from "@/components/loading";
import { AccessDenied } from "@/components/accessdenied";
import { authController } from "@/controllers/auth";

const Page = () => {
  const { session, isLoading } = useSession();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (!isLoading && session) {
        try {
          const user = await authController.getCurrentUser();
          if (user && user.interviewer) {
            setHasPermission(true);
          } else {
            setHasPermission(false);
          }
        } catch (error) {
          console.error("Error checking permission:", error);
          setHasPermission(false);
        }
      } else if (!isLoading && !session) {
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [isLoading, session]);

  if (isLoading || hasPermission === null) {
    return <Loading />;
  }

  if (!hasPermission) {
    return <AccessDenied />;
  }

  return <Dashboard />;
};

export default Page;
