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
