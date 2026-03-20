"use client";
import { OrganizationCardProps } from "@/types/organization";

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
    </button>
  );
};
