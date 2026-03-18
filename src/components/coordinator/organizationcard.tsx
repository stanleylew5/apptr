"use client";
import { Organization } from "@/types/organization";

interface OrganizationCardProps {
  organization: Organization;
  onSelect: (org: Organization) => void;
}

export const OrganizationCard = ({
  organization,
  onSelect,
}: OrganizationCardProps) => {
  return (
    <button
      onClick={() => onSelect(organization)}
      className="w-full transform rounded-lg border-2 border-blue-200 bg-white p-4 text-left transition-all duration-200 hover:scale-105 hover:cursor-pointer hover:border-blue-400 hover:shadow-lg"
    >
      <h3 className="text-lg font-semibold text-blue-900">
        {organization.organization_name}
      </h3>
      {/* <p className="text-sm text-gray-500"> FOR DEBUGGING PURPOSES ONLY
        ID: {organization.organization_id}
      </p> */}
    </button>
  );
};
