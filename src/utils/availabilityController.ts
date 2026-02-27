import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { authController } from './authController';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
        console.error('User not authenticated');
        return [];
      }

      const { data, error } = await this.supabase
        .from('availability')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching availability:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching availability:', error);
      return [];
    }
  }

  async fetchAvailabilityByUserId(userId: string): Promise<AvailabilityRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('availability')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching availability:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching availability:', error);
      return [];
    }
  }

  /* Convert database timestamptz to date string (YYYY-MM-DD) */
  private extractDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  }

  /**
   * Convert database timestamptz to time string ("9:00 AM")
   */
  private extractTime(timestamp: string): string {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12 || 12;
    const minuteStr = minutes.toString().padStart(2, '0');
    
    return `${hours}:${minuteStr} ${period}`;
  }

  /* Transform database records into When2Meet component format */
  transformToComponentFormat(records: AvailabilityRecord[]): TimeSlot[] {
    return records.map(record => ({
      day: this.extractDate(record.start_time),
      startTime: this.extractTime(record.start_time),
      endTime: this.extractTime(record.end_time)
    }));
  }

  /* Get current user's availability in component format */
  async getUserAvailabilityForComponent(): Promise<TimeSlot[]> {
    const records = await this.fetchUserAvailability();
    return this.transformToComponentFormat(records);
  }

  /* Get availability for a specific user in component format */
  async getAvailabilityForComponent(userId: string): Promise<TimeSlot[]> {
    const records = await this.fetchAvailabilityByUserId(userId);
    return this.transformToComponentFormat(records);
  }

  /* Transform component format back to database format */
  transformToDatabaseFormat(
    timeSlots: TimeSlot[],
    userId: string
  ): Omit<AvailabilityRecord, 'availability_id' | 'created_at'>[] {
    return timeSlots.map(slot => {
      const startTimestamp = this.combineDateTime(slot.day, slot.startTime);
      const endTimestamp = this.combineDateTime(slot.day, slot.endTime);

      return {
        user_id: userId,
        start_time: startTimestamp,
        end_time: endTimestamp
      };
    });
  }

  /* Combine date and time strings into ISO timestamp */
  private combineDateTime(dateStr: string, timeStr: string): string {
    // Parse time string (e.g., "9:00 AM")
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    
    if (!timeMatch) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);

    return date.toISOString();
  }

  async saveAvailability(timeSlots: TimeSlot[]): Promise<boolean> {
    try {
      const userId = await authController.getCurrentUserId();
      
      if (!userId) {
        console.error('User not authenticated');
        return false;
      }

      const { error: deleteError } = await this.supabase
        .from('availability')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting old availability:', deleteError.message);
        return false;
      }

      // Insert new availability
      if (timeSlots.length > 0) {
        const dataToInsert = this.transformToDatabaseFormat(timeSlots, userId);

        const { error: insertError } = await this.supabase
          .from('availability')
          .insert(dataToInsert);

        if (insertError) {
          console.error('Error inserting new availability:', insertError.message);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Unexpected error saving availability:', error);
      return false;
    }
  }

  async deleteAvailability(availabilityId: string): Promise<boolean> {
    try {
      const userId = await authController.getCurrentUserId();
      
      if (!userId) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await this.supabase
        .from('availability')
        .delete()
        .eq('availability_id', availabilityId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting availability:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting availability:', error);
      return false;
    }
  }

  async deleteAllAvailability(): Promise<boolean> {
    try {
      const userId = await authController.getCurrentUserId();
      
      if (!userId) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await this.supabase
        .from('availability')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting all availability:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting all availability:', error);
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

  async getAvailabilityInRange(startDate: string, endDate: string): Promise<TimeSlot[]> {
    try {
      const userId = await authController.getCurrentUserId();
      
      if (!userId) {
        console.error('User not authenticated');
        return [];
      }

      const startTimestamp = new Date(startDate).toISOString();
      const endTimestamp = new Date(endDate + 'T23:59:59').toISOString();

      const { data, error } = await this.supabase
        .from('availability')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startTimestamp)
        .lte('start_time', endTimestamp)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching availability in range:', error.message);
        return [];
      }

      return this.transformToComponentFormat(data || []);
    } catch (error) {
      console.error('Unexpected error fetching availability in range:', error);
      return [];
    }
  }
}

export const availabilityController = new AvailabilityController();

export default AvailabilityController;

export type { AvailabilityRecord, TimeSlot };