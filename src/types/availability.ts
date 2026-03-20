export interface AvailabilityRecord {
  availability_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  created_at?: string;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}
