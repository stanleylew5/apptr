"use client";
import { useState } from "react";
import { organizationController } from "@/controllers/organization";
import { authController } from "@/controllers/auth";
import { CreateOrganizationProps } from "@/types/organization";

export const CreateOrganization = ({
  isFirstOrganization,
  onOrganizationCreated,
  onCancel,
  onError,
}: CreateOrganizationProps) => {
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgPassword, setNewOrgPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      onError?.("Organization name is required");
      return;
    }

    if (!newOrgPassword.trim()) {
      onError?.("Organization password is required");
      return;
    }

    try {
      setCreating(true);
      const userId = await authController.getCurrentUserId();
      if (userId) {
        const newOrg = await organizationController.createOrganization(
          newOrgName.trim(),
          userId,
          newOrgPassword.trim(),
        );
        if (newOrg) {
          setNewOrgName("");
          setNewOrgPassword("");
          onOrganizationCreated(newOrg);
        } else {
          onError?.("Failed to create organization");
        }
      }
    } catch (err) {
      console.error("Error creating organization:", err);
      onError?.("Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-blue-300 bg-white p-6">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        {isFirstOrganization
          ? "Create Your First Organization"
          : "Create New Organization"}
      </h2>
      <input
        type="text"
        value={newOrgName}
        onChange={(e) => setNewOrgName(e.target.value)}
        placeholder="Organization name"
        className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
        disabled={creating}
      />
      <div className="relative mb-4">
        <input
          type={showPassword ? "text" : "password"}
          value={newOrgPassword}
          onChange={(e) => setNewOrgPassword(e.target.value)}
          placeholder="Organization password"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          disabled={creating}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
          tabIndex={-1}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Members will need this password to join your organization.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleCreateOrganization}
          disabled={creating}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Organization"}
        </button>
        {!isFirstOrganization && (
          <button
            onClick={() => {
              setNewOrgName("");
              setNewOrgPassword("");
              onCancel?.();
            }}
            disabled={creating}
            className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
