import {
  createClient,
  SupabaseClient,
  User,
  Session,
} from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

class AuthController {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        console.error("Error getting current user:", error.message);
        return null;
      }

      return user;
    } catch (error) {
      console.error("Unexpected error getting current user:", error);
      return null;
    }
  }

  async getCurrentUserId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.id || null;
  }

  async getCurrentUserEmail(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.email || null;
  }

  async getCurrentSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

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
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
        throw error;
      }
    } catch (error) {
      console.error("Unexpected error signing out:", error);
      throw error;
    }
  }

  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error || !user || user.id !== userId) {
        console.error("Cannot fetch other users with anon key");
        return null;
      }

      return user;
    } catch (error) {
      console.error("Unexpected error getting user by ID:", error);
      return null;
    }
  }
}

export const authController = new AuthController();

export default AuthController;

export type { User, Session } from "@supabase/supabase-js";
