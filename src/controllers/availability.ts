import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { authController } from "./auth";
import { AvailabilityRecord, TimeSlot } from "@/types/availability";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

class AvailabilityController {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async fetchUserAvailability(): Promise<AvailabilityRecord[]> {
    try {
      const userId = await authController.getCurrentUserId();

      if (!userId) {
        console.error("User not authenticated");
        return [];
      }

      const { data, error } = await this.supabase
        .from("availability")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching availability:", error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async fetchAvailabilityByUserId(
    userId: string,
  ): Promise<AvailabilityRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from("availability")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching availability:", error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // Convert database timestamptz to format (YYYY-MM-DD)
  private extractDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toISOString().split("T")[0];
  }

  // Convert database timestamptz type to format ("9:00 AM") and UTC back to PST timezone
  private extractTime(timestamp: string): string {
    const date = new Date(timestamp);

    const utcYear = date.getUTCFullYear();
    const utcMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
    const utcDay = String(date.getUTCDate()).padStart(2, "0");
    const dateStr = `${utcYear}-${utcMonth}-${utcDay}`;

    // find the offset in hours
    const testDate = new Date(dateStr + "T12:00:00");
    const utcHour = testDate.getUTCHours();
    const localString = testDate.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      hour12: false,
    });
    const localHour = parseInt(localString);
    const offset = utcHour - localHour;

    let hours = date.getUTCHours() - offset;
    const minutes = date.getUTCMinutes();

    if (hours < 0) {
      hours += 24;
    } else if (hours >= 24) {
      hours -= 24;
    }

    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const minuteStr = minutes.toString().padStart(2, "0");

    return `${hours}:${minuteStr} ${period}`;
  }

  transformToComponentFormat(records: AvailabilityRecord[]): TimeSlot[] {
    return records.map((record) => ({
      day: this.extractDate(record.start_time),
      startTime: this.extractTime(record.start_time),
      endTime: this.extractTime(record.end_time),
    }));
  }

  async getUserAvailabilityForComponent(): Promise<TimeSlot[]> {
    const records = await this.fetchUserAvailability();
    return this.transformToComponentFormat(records);
  }

  transformToDatabaseFormat(
    timeSlots: TimeSlot[],
    userId: string,
  ): Omit<AvailabilityRecord, "availability_id" | "created_at">[] {
    return timeSlots.map((slot) => {
      const startTimestamp = this.combineDateTime(slot.day, slot.startTime);
      const endTimestamp = this.combineDateTime(slot.day, slot.endTime);

      return {
        user_id: userId,
        start_time: startTimestamp,
        end_time: endTimestamp,
      };
    });
  }

  // Combine date and time strings into UTC
  private combineDateTime(dateStr: string, timeStr: string): string {
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!timeMatch) throw new Error(`Invalid time format: ${timeStr}`);

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    const testDate = new Date(dateStr + "T12:00:00");
    const utcHour = testDate.getUTCHours();

    const localString = testDate.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      hour12: false,
    });
    const localHour = parseInt(localString);
    const offset = utcHour - localHour;

    const date = new Date(dateStr + "T00:00:00Z");
    date.setUTCHours(hours + offset, minutes, 0, 0);

    return date.toISOString();
  }

  async saveAvailability(timeSlots: TimeSlot[]): Promise<boolean> {
    try {
      const userId = await authController.getCurrentUserId();

      if (!userId) return false;

      const { error: deleteError } = await this.supabase
        .from("availability")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Error deleting old availability:", deleteError.message);
        return false;
      }

      if (timeSlots.length > 0) {
        const dataToInsert = this.transformToDatabaseFormat(timeSlots, userId);

        const { error: insertError } = await this.supabase
          .from("availability")
          .insert(dataToInsert);

        if (insertError) {
          console.error(
            "Error inserting new availability:",
            insertError.message,
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async deleteAvailability(availabilityId: string): Promise<boolean> {
    try {
      const userId = await authController.getCurrentUserId();

      if (!userId) return false;

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
      console.error(error);
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

      if (!userId) return false;

      const startTimestamp = new Date(startDate).toISOString();
      const endTimestamp = new Date(endDate + "T23:59:59").toISOString();

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
