"use client";
import { useEffect, useState } from "react";
import { organizationController } from "@/controllers/organization";
import { authController } from "@/controllers/auth";
import Loading from "@/components/loading";
import { Organization } from "@/types/types";
import { OrganizationCard } from "./organizationcard";
import { CreateOrganizationForm } from "./createorganizationform";

interface OrganizationSelectorProps {
  onOrganizationSelected: (org: Organization) => void;
}

export const OrganizationSelector = ({
  onOrganizationSelected,
}: OrganizationSelectorProps) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const userId = await authController.getCurrentUserId();
        if (userId) {
          const orgs =
            await organizationController.getUserOrganizations(userId);
          setOrganizations(orgs);

          if (orgs.length === 0) setShowCreateForm(true);
        }
      } catch (err) {
        console.error("Error loading organizations:", err);
        setError("Failed to load organizations");
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  const handleSelectOrganization = (org: Organization) => {
    onOrganizationSelected(org);
  };

  const handleOrganizationCreated = (newOrg: Organization) => {
    setOrganizations([...organizations, newOrg]);
    setShowCreateForm(false);
    handleSelectOrganization(newOrg);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-blue-900">
            Select Organization
          </h1>
          <p className="text-gray-600">
            Choose an organization to manage interview processes
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {organizations.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Your Organizations
            </h2>
            <div className="space-y-3">
              {organizations.map((org) => (
                <OrganizationCard
                  key={org.organization_id}
                  organization={org}
                  onSelect={handleSelectOrganization}
                />
              ))}
            </div>
          </div>
        )}

        {organizations.length > 0 && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="font-semibold text-blue-600 underline hover:text-blue-800"
            >
              {showCreateForm ? "Cancel" : "Create New Organization"}
            </button>
          </div>
        )}

        {showCreateForm && (
          <CreateOrganizationForm
            isFirstOrganization={organizations.length === 0}
            onOrganizationCreated={handleOrganizationCreated}
            onCancel={() => setShowCreateForm(false)}
            error={error}
            onError={setError}
          />
        )}
      </div>
    </div>
  );
};
