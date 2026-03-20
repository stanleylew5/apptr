import { supabase } from "@/lib/supabase";
import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";
import { User } from "@/types/user";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

class AuthController {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("user_id, email, full_name, coordinator, interviewer, candidate")
      .eq("user_id", user.id)
      .single();

    if (error) return null;

    return data || null;
  }

  async getCurrentUserId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.user_id || null;
  }

  async getFullName(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.full_name || null;
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
        throw error;
      }
    } catch (error) {
      console.error("Unexpected error signing out:", error);
      throw error;
    }
  }

  async setUserRole(
    userId: string,
    role: "coordinator" | "interviewer" | "candidate",
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          coordinator: role === "coordinator",
          interviewer: role === "interviewer",
          candidate: role === "candidate",
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating user role:", error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Unexpected error updating user role:", error);
      return false;
    }
  }

  async getUserPrimaryRole(user: User): Promise<string | null> {
    const { coordinator, interviewer, candidate } = user;
    // Priority order: candidate > interviewer > coordinator but we allow access to all pages for now just cause we are testing..
    // normal scenarios we would never need this but for testing we want the users to have multiple roles to avoid editing the db every time we need to test something
    if (candidate) return "candidate";
    if (interviewer) return "interviewer";
    if (coordinator) return "coordinator";

    return null;
  }
}

export const authController = new AuthController();

export default AuthController;

export type { User, Session };
