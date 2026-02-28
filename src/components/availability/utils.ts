import { Availability, CellAvailability } from "./types";

const EMPTY_CELL: CellAvailability = { top: false, bottom: false };

export function getCell(
  availability: Availability,
  dateKey: string,
  hour: number,
): CellAvailability {
  return availability[dateKey]?.[hour] ?? EMPTY_CELL;
}

export function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
}

export function getNext7Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }

  return days;
}

// Format date for display (e.g., "Mon 2/24")
export function formatDateDisplay(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${days[date.getDay()]} ${month}/${day}`;
}

// Get date key for storage (YYYY-MM-DD)
export function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Parse time string to decimal hour (e.g., "9:30 AM" -> 9.5)
export function parseTimeToHour(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return hours + minutes / 60;
}

// Convert 24-hour time to 12-hour format
export function convertTo12Hour(time24: string): string {
  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr);
  const period = hour >= 12 ? "PM" : "AM";

  if (hour > 12) {
    hour -= 12;
  } else if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${period}`;
}
