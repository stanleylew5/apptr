export interface Organization {
  organization_id: string;
  organization_name: string;
  created_by: string;
}

export type OrganizationMemberRow = {
  organizations: {
    organization_id: string;
    organization_name: string;
    created_by: string;
  } | null;
};

export interface CreateOrganizationProps {
  isFirstOrganization: boolean;
  onOrganizationCreated: (org: Organization) => void;
  onCancel?: () => void;
  error?: string | null;
  onError?: (error: string) => void;
}

export interface OrganizationCardProps {
  organization: Organization;
  onSelect: (org: Organization) => void;
}

export interface OrganizationSelectorProps {
  onOrganizationSelected: (org: Organization) => void;
}

export interface JoinOrganizationProps {
  onOrganizationSelected: (org: Organization) => void;
}
