"use client";

import { Users, Save } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { PendingApptCard } from "../appointments/pendingCard";
import { ConfirmedApptCard } from "../appointments/confirmedCard";
import { PageHeader } from "./pageHeader";
import { Cell } from "./cell";
import { availabilityController } from "@/utils/availabilityController";
import { authController } from "@/utils/authController";
import {
  Availability,
  ViewMode,
  DragState,
  TimeBlock,
  Half,
} from "./types";
import {
  getCell,
  formatHour,
  getNext7Days,
  formatDateDisplay,
  getDateKey,
  parseTimeToHour,
  convertTo12Hour,
} from "./utils";

const times = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const AvailabilityX = () => {
  const [availability, setAvailability] = useState<Availability>({});
  const [dragState, setDragState] = useState<DragState>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [view, setView] = useState<ViewMode>("schedule");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const weekDates = useMemo(() => getNext7Days(), []);

  // Check authentication and load availability
  useEffect(() => {
    async function initialize() {
      const currentUserId = await authController.getCurrentUserId();

      if (!currentUserId) {
        setLoading(false);
        return;
      }

      setUserId(currentUserId);
      await loadAvailability();
      setLoading(false);
    }

    initialize();
  }, []);

  // Load availability from Supabase
  async function loadAvailability() {
    try {
      const availabilityData =
        await availabilityController.getUserAvailabilityForComponent();

      if (availabilityData.length > 0) {
        const newAvailability: Availability = {};

        availabilityData.forEach((slot) => {
          const dateKey = slot.day; // Already in YYYY-MM-DD format

          // Parse start and end times
          const startHour = parseTimeToHour(slot.startTime);
          const endHour = parseTimeToHour(slot.endTime);

          // Mark all half-hour slots in this range
          for (let hour = Math.floor(startHour); hour < Math.floor(endHour); hour++) {
            if (!newAvailability[dateKey]) {
              newAvailability[dateKey] = {};
            }
            if (!newAvailability[dateKey][hour]) {
              newAvailability[dateKey][hour] = { top: false, bottom: false };
            }

            // Check if we need to mark the top half
            if (startHour <= hour) {
              newAvailability[dateKey][hour].top = true;
            } else if (startHour <= hour + 0.5) {
              newAvailability[dateKey][hour].bottom = true;
            }

            // Check if we need to mark the bottom half
            if (endHour > hour + 0.5) {
              newAvailability[dateKey][hour].bottom = true;
            }
          }

          // Handle the last hour if end time is exactly on the hour
          const lastHour = Math.floor(endHour);
          if (endHour > lastHour) {
            if (!newAvailability[dateKey]) {
              newAvailability[dateKey] = {};
            }
            if (!newAvailability[dateKey][lastHour]) {
              newAvailability[dateKey][lastHour] = { top: false, bottom: false };
            }
            newAvailability[dateKey][lastHour].top = true;
            if (endHour > lastHour + 0.5) {
              newAvailability[dateKey][lastHour].bottom = true;
            }
          }
        });

        setAvailability(newAvailability);
      }
    } catch (error) {
      console.error("Error loading availability:", error);
    }
  }

  // Apply a half-cell value
  function applyHalf(
    dateKey: string,
    hour: number,
    half: Half,
    value: boolean,
  ) {
    setAvailability((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [hour]: {
          ...getCell(prev, dateKey, hour),
          [half]: value,
        },
      },
    }));
  }

  function clearAll() {
    setDragState(null);
    setAvailability({});
    setTimeBlocks([]);
  }

  // Keep `timeBlocks` in sync with `availability`
  useEffect(() => {
    const blocks: TimeBlock[] = [];

    for (const date of weekDates) {
      const dateKey = getDateKey(date);

      // Build an ordered list of half-hour slots
      type HalfSlot = { selected: boolean; start: string; end: string };
      const slots: HalfSlot[] = [];

      for (const hour of times) {
        const cell = getCell(availability, dateKey, hour);

        const topStart = `${hour.toString().padStart(2, "0")}:00`;
        const topEnd = `${hour.toString().padStart(2, "0")}:30`;
        slots.push({ selected: cell.top, start: topStart, end: topEnd });

        const bottomStart = `${hour.toString().padStart(2, "0")}:30`;
        const bottomEnd = `${(hour + 1).toString().padStart(2, "0")}:00`;
        slots.push({
          selected: cell.bottom,
          start: bottomStart,
          end: bottomEnd,
        });
      }

      // Merge consecutive selected slots into larger blocks
      let i = 0;
      while (i < slots.length) {
        if (!slots[i].selected) {
          i++;
          continue;
        }

        const start = slots[i].start;
        let end = slots[i].end;
        i++;

        while (i < slots.length && slots[i].selected) {
          end = slots[i].end;
          i++;
        }

        blocks.push({ date: dateKey, startTime: start, endTime: end });
      }
    }

    setTimeBlocks(blocks);
  }, [availability, weekDates]);

  // Save to Supabase
  async function saveAvailability() {
    if (!userId) {
      alert("Please sign in to save availability");
      return;
    }

    setSaving(true);

    try {
      // Convert timeBlocks to the format expected by availabilityController
      const formattedBlocks = timeBlocks.map((block) => {
        // Convert 24-hour time to 12-hour format with AM/PM
        const startTime = convertTo12Hour(block.startTime);
        const endTime = convertTo12Hour(block.endTime);

        return {
          day: block.date, // YYYY-MM-DD
          startTime, // "9:00 AM"
          endTime, // "11:00 AM"
        };
      });

      const success = await availabilityController.saveAvailability(
        formattedBlocks,
      );

      if (success) {
        alert("Availability saved successfully!");
      } else {
        alert("Failed to save availability");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability");
    } finally {
      setSaving(false);
    }
  }

  // Derived selected count
  const selectedCount = useMemo(() => {
    let count = 0;
    for (const day of Object.values(availability)) {
      for (const cell of Object.values(day)) {
        if (cell.top) count++;
        if (cell.bottom) count++;
      }
    }
    return count;
  }, [availability]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">
          Please sign in to view this page
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        description="Candidate Portal"
        linkPath="/welcome"
        linkText="Switch Role"
        icon={Users}
      />
      {/* TODO: Replace hardcoded name and interview count with real data from props or API  */}
      <div className="flex flex-col gap-0.5 px-20">
        <h2 className="text-3xl font-bold text-blue-800">
          Welcome, {"Stanley Lew!"}
        </h2>
        <p className="text-blue-400">You have {2} interviews</p>
      </div>

      <div className="mx-auto flex max-w-6xl gap-5 bg-gray-100 p-1 px-4">
        <button
          onClick={() => setView("schedule")}
          className={`px-2 py-1 font-medium ${
            view === "schedule"
              ? "border-b-2 border-blue-800 text-blue-800"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          My Schedule
        </button>

        <button
          onClick={() => setView("availability")}
          className={`px-2 py-1 font-medium ${
            view === "availability"
              ? "border-b-2 border-blue-800 text-blue-800"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          Edit Availability
        </button>
      </div>

      {view === "availability" && (
        <>
          <div className="flex flex-col px-20">
            <h2 className="text-2xl font-bold text-blue-800">
              Edit Your Availability
            </h2>
            <div className="flex gap-2">
              <p>
                Click and drag to select your available times. Selected slots:
              </p>
              <p className="font-semibold text-blue-800">{selectedCount}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div
              className="grid w-full max-w-5xl grid-cols-[max-content_repeat(7,1fr)] select-none"
              onMouseUp={() => setDragState(null)}
              onMouseLeave={() => setDragState(null)}
            >
              <div />
              {weekDates.map((date) => (
                <div
                  key={getDateKey(date)}
                  className="bg-blue-100 text-center font-semibold text-sm px-1"
                >
                  {formatDateDisplay(date)}
                </div>
              ))}
              {times.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="pr-2 text-right font-medium">
                    {formatHour(hour)}
                  </div>
                  {weekDates.map((date) => {
                    const dateKey = getDateKey(date);
                    return (
                      <Cell
                        key={`${dateKey}-${hour}`}
                        dateKey={dateKey}
                        hour={hour}
                        value={getCell(availability, dateKey, hour)}
                        onApply={applyHalf}
                        dragState={dragState}
                        setDragState={setDragState}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-4 mb-4 flex max-w-6xl items-center justify-end gap-3 font-medium">
            <button
              onClick={clearAll}
              className="rounded-lg border border-gray-300 px-2"
            >
              Clear All
            </button>
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-800 px-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Availability"}
            </button>
          </div>
        </>
      )}

      {view === "schedule" && (
        <>
          <div className="px-20">
            <h2 className="text-2xl font-bold text-blue-800">
              Pending Confirmation
            </h2>
            <p>Please review and confirm these interview times</p>
          </div>
          {/* TODO: Card information for all cards should be replaced with real data from props or API */}
          <div className="mb-3 space-y-3">
            <PendingApptCard
              title="Technical Interview"
              infoItems={[
                "Wednesday, Dec 11",
                "2:00 PM - 3:00 PM",
                "Interviewer: Jane Doe",
                "Virtual - Zoom Link",
              ]}
              onConfirm={() => {
                console.log("Confirming availability");
              }}
              onReschedule={() => {
                console.log("Rescheduling...");
              }}
            />

            <PendingApptCard
              title="Technical Interview"
              infoItems={[
                "Wednesday, Dec 11",
                "2:00 PM - 3:00 PM",
                "Interviewer: Jane Doe",
                "Virtual - Zoom Link",
              ]}
              onConfirm={() => {
                console.log("Confirming availability");
              }}
              onReschedule={() => {
                console.log("Rescheduling...");
              }}
            />
          </div>

          <div className="mt-0.5 px-20">
            <h2 className="text-2xl font-bold text-blue-800">
              Confirmed Interviews
            </h2>
          </div>

          <div className="mb-3 space-y-3">
            <ConfirmedApptCard
              title="HR Interview"
              infoItems={[
                "Monday, Dec 9",
                "10:00 AM - 10:45 AM",
                "Interviewer: John Doe",
                "Virtual - Zoom Link",
              ]}
              onAddCalendar={() => {
                console.log("Adding to calendar");
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AvailabilityX;
