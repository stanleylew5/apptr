import { supabase } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { Organization, OrganizationMemberRow } from "@/types/organization";

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
    password: string,
  ): Promise<Organization | null> {
    const { data: orgData, error: orgError } = await this.supabase
      .from("organizations")
      .insert([
        {
          organization_name: organizationName,
          created_by: userId,
          password: password,
        },
      ])
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
      .select("organization_id, organization_name, created_by, password")
      .eq("organization_id", organizationId)
      .single();

    if (error) {
      console.error("Error fetching organization:", error);
      return null;
    }

    return data;
  }

  async getOrganizationMembers(organizationId: string): Promise<
    Array<{
      user_id: string;
      full_name: string;
      role?: string;
    }>
  > {
    const { data, error } = await this.supabase
      .from("organization_members")
      .select("organization_id, user_id, users(full_name), role")
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error fetching organization members:", error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((member: any) => ({
      user_id: member.user_id,
      organization_id: member.organization_id,
      full_name: member.users?.full_name || "Unknown",
      role: member.role || undefined,
    }));
  }

  async verifyAndJoinOrganization(
    organizationName: string,
    password: string,
    userId: string,
    role: string,
  ): Promise<Organization | null> {
    const { data: org, error: fetchError } = await this.supabase
      .from("organizations")
      .select("organization_id, organization_name, created_by, password")
      .eq("organization_name", organizationName)
      .maybeSingle();

    if (fetchError) {
      console.error(fetchError);
      return null;
    }

    if (!org) {
      console.error(organizationName);
      return null;
    }

    if (org.password !== password) {
      console.error(
        "Password mismatch. Expected:",
        password,
        "Got:",
        org.password,
      );
      return null;
    }

    const { data: existingMember } = await this.supabase
      .from("organization_members")
      .select("*")
      .eq("user_id", userId)
      .eq("organization_id", org.organization_id)
      .maybeSingle();

    if (existingMember) {
      return {
        organization_id: org.organization_id,
        organization_name: org.organization_name,
        created_by: org.created_by,
      };
    }

    const { error: memberError } = await this.supabase
      .from("organization_members")
      .insert([
        {
          user_id: userId,
          organization_id: org.organization_id,
          role: role,
        },
      ]);

    if (memberError) {
      console.error("Error adding user to organization:", memberError);
      return null;
    }

    return org;
  }
}

export const organizationController = new OrganizationController();
