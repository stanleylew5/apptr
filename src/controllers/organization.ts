import { supabase } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { Organization, OrganizationMemberRow } from "@/types/types";

class OrganizationController {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const { data, error } = await this.supabase
      .from("organization_members")
      .select("organizations(organization_id, organization_name, created_by)")
      .eq("user_id", userId);

    const rows = data as OrganizationMemberRow[] | null;

    if (error) {
      console.error("Error fetching user organizations:", error);
      return [];
    }

    return (rows ?? [])
      .filter((item) => item.organizations)
      .map((item) => ({
        organization_id: item.organizations!.organization_id,
        organization_name: item.organizations!.organization_name,
        created_by: item.organizations!.created_by,
      }));
  }

  async createOrganization(
    organizationName: string,
    userId: string,
  ): Promise<Organization | null> {
    const { data: orgData, error: orgError } = await this.supabase
      .from("organizations")
      .insert([{ organization_name: organizationName, created_by: userId }])
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      return null;
    }

    const { error: memberError } = await this.supabase
      .from("organization_members")
      .insert([
        {
          user_id: userId,
          organization_id: orgData.organization_id,
        },
      ]);

    if (memberError) {
      console.error("Error adding user to organization_members:", memberError);
      return null;
    }

    return orgData;
  }

  async getOrganization(organizationId: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from("organizations")
      .select("organization_id, organization_name, created_by")
      .eq("organization_id", organizationId)
      .single();

    if (error) {
      console.error("Error fetching organization:", error);
      return null;
    }

    return data;
  }

  async deleteOrganization(
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    const { data: org, error: fetchError } = await this.supabase
      .from("organizations")
      .select("created_by")
      .eq("organization_id", organizationId)
      .single();

    if (fetchError || !org) {
      console.error("Error fetching organization:", fetchError);
      return false;
    }

    if (org.created_by !== userId) {
      console.error("User is not authorized to delete this organization");
      return false;
    }

    const { error: deleteError } = await this.supabase
      .from("organizations")
      .delete()
      .eq("organization_id", organizationId);

    if (deleteError) {
      console.error("Error deleting organization:", deleteError);
      return false;
    }

    return true;
  }
}

export const organizationController = new OrganizationController();
