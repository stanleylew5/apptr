"use client";
import { useRouter } from "next/navigation";
import { OrganizationSelector } from "./organizationselector";

const Dashboard = () => {
  const router = useRouter();
  
  return (
    <OrganizationSelector
      onOrganizationSelected={(org) =>
        router.push(`/coordinator/${org.organization_id}`)
      }
    />
  );
};

export default Dashboard;
