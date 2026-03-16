"use client";
import { useEffect, useState } from "react";
import { organizationController } from "@/controllers/organization";
import { authController } from "@/controllers/auth";
import Loading from "@/components/loading";
import { Organization } from "@/types/types";

interface JoinOrganizationProps {
  onOrganizationSelected: (org: Organization) => void;
}

export const JoinOrganization = ({
  onOrganizationSelected,
}: JoinOrganizationProps) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const userId = await authController.getCurrentUserId();
        if (userId) {
          const orgs =
            await organizationController.getUserOrganizations(userId);
          setOrganizations(orgs);
        }
      } catch (err) {
        console.error("Error loading organizations:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  const handleSelectOrganization = (org: Organization) => {
    onOrganizationSelected(org);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!organizationName.trim() || !password.trim()) {
        setError("Please enter both organization name and password");
        setSubmitting(false);
        return;
      }

      const userId = await authController.getCurrentUserId();
      if (!userId) {
        setError("User not found. Please log in again.");
        setSubmitting(false);
        return;
      }

      const org = await organizationController.verifyAndJoinOrganization(
        organizationName,
        password,
        userId,
      );

      if (org) {
        setOrganizationName("");
        setPassword("");
        if (
          !organizations.find((o) => o.organization_id === org.organization_id)
        ) {
          setOrganizations([...organizations, org]);
        }
        onOrganizationSelected(org);
      } else {
        setError(
          "Invalid organization name or password. Please check and try again.",
        );
      }
    } catch (err) {
      console.error("Error joining organization:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
            Choose an organization or join a new one to access your dashboard
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
                <button
                  key={org.organization_id}
                  onClick={() => handleSelectOrganization(org)}
                  className="w-full rounded-lg border-2 border-blue-200 bg-white p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50"
                >
                  <p className="font-semibold text-blue-900">
                    {org.organization_name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Join new organization form */}
        <div className="rounded-lg border-2 border-blue-200 bg-white p-8 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            Join New Organization
          </h3>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Organization Name
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Enter organization name"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Enter organization password"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? "Joining..." : "Join Organization"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
