import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { authController } from "./auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

interface AvailabilityRecord {
  availability_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  created_at?: string;
}

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

class AvailabilityController {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async fetchUserAvailability(): Promise<AvailabilityRecord[]> {
    try {
      const userId = await authController.getCurrentUserId();

      if (!userId) {
        console.error("[fetchUserAvailability] User not authenticated");
        return [];
      }

      console.log(
        `[fetchUserAvailability] Fetching availability for current user: ${userId}`,
      );

      const { data, error } = await this.supabase
        .from("availability")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("[fetchUserAvailability] Supabase error:", error.message);
        return [];
      }

      console.log(
        `[fetchUserAvailability] ✓ Found ${(data || []).length} availability records`,
      );
      if (data && data.length > 0) {
        data.forEach((record, idx) => {
          console.log(
            `  Record ${idx + 1}: ${record.start_time} - ${record.end_time}`,
          );
        });
      }

      return data || [];
    } catch (error) {
      console.error("[fetchUserAvailability] Unexpected error:", error);
      return [];
    }
  }

  async fetchAvailabilityByUserId(
    userId: string,
  ): Promise<AvailabilityRecord[]> {
    try {
      console.log(
        `[fetchAvailabilityByUserId] Fetching availability for user: ${userId}`,
      );

      const { data, error } = await this.supabase
        .from("availability")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: true });

      if (error) {
        console.error(
          `[fetchAvailabilityByUserId] Supabase error for user ${userId}:`,
          error.message,
        );
        return [];
      }

      console.log(
        `[fetchAvailabilityByUserId] ✓ Found ${(data || []).length} records for user ${userId}`,
      );
      if (data && data.length > 0) {
        data.forEach((record, idx) => {
          console.log(
            `  Record ${idx + 1}: ${record.start_time} - ${record.end_time}`,
          );
        });
      }

      return data || [];
    } catch (error) {
      console.error(
        `[fetchAvailabilityByUserId] Unexpected error for user ${userId}:`,
        error,
      );
      return [];
    }
  }

  /* Convert database timestamptz to date string (YYYY-MM-DD) */
  private extractDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toISOString().split("T")[0];
  }

  /**
   * Convert database timestamptz to time string ("9:00 AM")
   */
  private extractTime(timestamp: string): string {
    const date = new Date(timestamp);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;
    const minuteStr = minutes.toString().padStart(2, "0");

    return `${hours}:${minuteStr} ${period}`;
  }

  /* Transform database records into When2Meet component format */
  transformToComponentFormat(records: AvailabilityRecord[]): TimeSlot[] {
    return records.map((record) => ({
      day: this.extractDate(record.start_time),
      startTime: this.extractTime(record.start_time),
      endTime: this.extractTime(record.end_time),
    }));
  }

  /* Get current user's availability in component format */
  async getUserAvailabilityForComponent(): Promise<TimeSlot[]> {
    const records = await this.fetchUserAvailability();
    return this.transformToComponentFormat(records);
  }

  /* Transform component format back to database format */
  transformToDatabaseFormat(
    timeSlots: TimeSlot[],
    userId: string,
  ): Omit<AvailabilityRecord, "availability_id" | "created_at">[] {
    console.log(
      `[transformToDatabaseFormat] Converting ${timeSlots.length} slots for user ${userId}`,
    );
    return timeSlots.map((slot) => {
      const startTimestamp = this.combineDateTime(slot.day, slot.startTime);
      const endTimestamp = this.combineDateTime(slot.day, slot.endTime);

      const record = {
        user_id: userId,
        start_time: startTimestamp,
        end_time: endTimestamp,
      };
      console.log(
        `[transformToDatabaseFormat] Converted: ${slot.day} ${slot.startTime}-${slot.endTime} -> start_time: ${startTimestamp}, end_time: ${endTimestamp}`,
      );
      return record;
    });
  }

  /* Combine date and time strings into ISO timestamp (UTC) */
  private combineDateTime(dateStr: string, timeStr: string): string {
    // Parse time string (e.g., "9:00 AM")
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!timeMatch) throw new Error(`Invalid time format: ${timeStr}`);

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    // Create date at UTC midnight, then set UTC time to avoid timezone offset issues
    const date = new Date(dateStr + "T00:00:00Z");
    date.setUTCHours(hours, minutes, 0, 0);

    return date.toISOString();
  }

  async saveAvailability(timeSlots: TimeSlot[]): Promise<boolean> {
    try {
      const userId = await authController.getCurrentUserId();

      if (!userId) {
        console.error("[saveAvailability] User not authenticated");
        return false;
      }

      console.log(`[saveAvailability] ✓ User authenticated: ${userId}`);
      console.log(
        `[saveAvailability] Deleting old availability records for user ${userId}`,
      );

      const { error: deleteError } = await this.supabase
        .from("availability")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error(
          "[saveAvailability] Error deleting old availability:",
          deleteError.message,
        );
        return false;
      }

      console.log(`[saveAvailability] ✓ Deleted old records`);

      // Insert new availability
      if (timeSlots.length > 0) {
        const dataToInsert = this.transformToDatabaseFormat(timeSlots, userId);

        console.log(
          `[saveAvailability] About to insert ${dataToInsert.length} records:`,
        );
        dataToInsert.forEach((record, idx) => {
          console.log(
            `  Record ${idx + 1}: user_id=${record.user_id}, start_time=${record.start_time}, end_time=${record.end_time}`,
          );
        });

        const { error: insertError, data: insertData } = await this.supabase
          .from("availability")
          .insert(dataToInsert)
          .select();

        if (insertError) {
          console.error(
            "[saveAvailability] Error inserting new availability:",
            insertError.message,
          );
          return false;
        }

        console.log(
          `[saveAvailability] ✓ Successfully inserted ${insertData?.length || 0} records`,
        );
      } else {
        console.log(
          `[saveAvailability] No time slots to insert (array length: 0)`,
        );
      }

      return true;
    } catch (error) {
      console.error("[saveAvailability] Unexpected error:", error);
      return false;
    }
  }

  async deleteAvailability(availabilityId: string): Promise<boolean> {
    try {
      const userId = await authController.getCurrentUserId();

      if (!userId) {
        console.error("User not authenticated");
        return false;
      }

      const { error } = await this.supabase
        .from("availability")
        .delete()
        .eq("availability_id", availabilityId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting availability:", error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Unexpected error deleting availability:", error);
      return false;
    }
  }

  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }

  async hasAvailability(): Promise<boolean> {
    const records = await this.fetchUserAvailability();
    return records.length > 0;
  }

  async getAvailabilityCount(): Promise<number> {
    const records = await this.fetchUserAvailability();
    return records.length;
  }

  async getAvailabilityInRange(
    startDate: string,
    endDate: string,
  ): Promise<TimeSlot[]> {
    try {
      const userId = await authController.getCurrentUserId();

      if (!userId) {
        console.error("User not authenticated");
        return [];
      }

      const startTimestamp = new Date(startDate).toISOString();
      const endTimestamp = new Date(endDate + "T23:59:59").toISOString();

      const { data, error } = await this.supabase
        .from("availability")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", startTimestamp)
        .lte("start_time", endTimestamp)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching availability in range:", error.message);
        return [];
      }

      return this.transformToComponentFormat(data || []);
    } catch (error) {
      console.error("Unexpected error fetching availability in range:", error);
      return [];
    }
  }

  async deleteAvailabilityOutsideRange(
    startDate: string,
    endDate: string,
  ): Promise<boolean> {
    try {
      const userId = await authController.getCurrentUserId();

      if (!userId) {
        console.error("User not authenticated");
        return false;
      }

      const startTimestamp = new Date(startDate).toISOString();
      const endTimestamp = new Date(endDate + "T23:59:59").toISOString();

      // Delete all availability NOT within the specified range
      const { error } = await this.supabase
        .from("availability")
        .delete()
        .eq("user_id", userId)
        .or(`start_time.lt.${startTimestamp},start_time.gt.${endTimestamp}`);

      if (error) {
        console.error(
          "Error deleting availability outside range:",
          error.message,
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "Unexpected error deleting availability outside range:",
        error,
      );
      return false;
    }
  }
}

export const availabilityController = new AvailabilityController();

export default AvailabilityController;

export type { AvailabilityRecord, TimeSlot };
