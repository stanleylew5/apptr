import { supabase } from "./supabase";

export async function createCalendarEvent(interview: {
  scheduled_start: string;
  scheduled_end: string;
  location?: string;
  candidate: { email: string };
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    throw new Error("No Google token found");
  }

  const token = session.provider_token;

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: "Interview",
        description: "Scheduled via Apptr",
        location: interview.location,
        start: {
          dateTime: interview.scheduled_start,
        },
        end: {
          dateTime: interview.scheduled_end,
        },
        attendees: [{ email: interview.candidate.email }],
      }),
    },
  );

  const data = await res.json();
  console.log("Calendar event created:", data);

  return data;
}
