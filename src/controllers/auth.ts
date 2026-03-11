import { supabase } from "@/lib/supabase";
import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";
import { User } from "@/types/types";

// Initialize Supabase client
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

  async getCurrentUserEmail(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.email || null;
  }

  async getFullName(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.full_name || null;
  }

  async getCurrentSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting current session:", error.message);
        return null;
      }

      return session;
    } catch (error) {
      console.error("Unexpected error getting current session:", error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
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

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "user_id, email, full_name, coordinator, interviewer, candidate",
        )
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching user by ID:", error.message);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error("Unexpected error getting user by ID:", error);
      return null;
    }
  }

  async setUserRole(
    userId: string,
    role: "coordinator" | "interviewer" | "candidate",
  ): Promise<boolean> {
    try {
      console.log("setUserRole called with userId:", userId, "role:", role);
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

      console.log("User role updated successfully");
      return true;
    } catch (error) {
      console.error("Unexpected error updating user role:", error);
      return false;
    }
  }

  async getUserPrimaryRole(user: User): Promise<string | null> {
    const { coordinator, interviewer, candidate } = user;

    // Priority order: candidate > interviewer > coordinator
    if (candidate) return "candidate";
    if (interviewer) return "interviewer";
    if (coordinator) return "coordinator";

    return null;
  }
}

export const authController = new AuthController();

export default AuthController;

export type { User, Session };
