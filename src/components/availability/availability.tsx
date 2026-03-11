"use client";

import { Save } from "lucide-react";
// import { PageHeader } from "./pageHeader";
import React, { useEffect, useMemo, useState } from "react";

import { Cell } from "./cell";
import { availabilityController } from "@/controllers/availability";
import { authController } from "@/controllers/auth";
import { AvailabilityType, DragState, TimeBlock, Half } from "./types";
import {
  getCell,
  formatHour,
  getNext7Days,
  formatDateDisplay,
  getDateKey,
  parseTimeToHour,
  convertTo12Hour,
} from "./utils";
import Loading from "../loading";
import { AccessDenied } from "../accessdenied";

const times = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const Availability = () => {
  const [availability, setAvailability] = useState<AvailabilityType>({});
  const [dragState, setDragState] = useState<DragState>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const weekDates = useMemo(() => getNext7Days(), []);

  useEffect(() => {
    async function initialize() {
      const currentUserId = await authController.getCurrentUserId();

      if (!currentUserId) {
        setLoading(false);
        return;
      }

      setUserId(currentUserId);

      // Clean up any availability outside the current week to save DB space
      const startDate = getDateKey(weekDates[0]);
      const endDate = getDateKey(weekDates[6]);
      await availabilityController.deleteAvailabilityOutsideRange(
        startDate,
        endDate,
      );

      await loadAvailability();
      setLoading(false);
    }

    initialize();
  }, [weekDates]);

  async function loadAvailability() {
    try {
      const availabilityData =
        await availabilityController.getUserAvailabilityForComponent();

      if (availabilityData.length > 0) {
        const newAvailability: AvailabilityType = {};

        const validDateKeys = new Set( // make sure the dates are only from the current 7 day window
          weekDates.map((date) => getDateKey(date)),
        );

        availabilityData.forEach((slot) => {
          const dateKey = slot.day; // YYYY-MM-DD format
          const startHour = parseTimeToHour(slot.startTime); // 9:00 AM -> 9
          const endHour = parseTimeToHour(slot.endTime); // 10:00 AM -> 10

          if (!validDateKeys.has(dateKey)) return;

          if (!newAvailability[dateKey]) {
            newAvailability[dateKey] = {};
          }

          const startHourFloor = Math.floor(startHour);
          const endHourCeil = Math.ceil(endHour);

          for (let hour = startHourFloor; hour < endHourCeil; hour++) {
            if (!newAvailability[dateKey][hour]) {
              newAvailability[dateKey][hour] = { top: false, bottom: false };
            }

            const cell = newAvailability[dateKey][hour];

            if (startHour <= hour && endHour > hour) {
              cell.top = true;
            }

            if (startHour <= hour + 0.5 && endHour > hour + 0.5) {
              cell.bottom = true;
            }
          }
        });

        setAvailability(newAvailability);
      }
    } catch (error) {
      console.error("Error loading availability:", error);
    }
  }

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

  useEffect(() => {
    const blocks: TimeBlock[] = [];

    for (const date of weekDates) {
      const dateKey = getDateKey(date);
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
          startTime, // 9:00 AM
          endTime, // 11:00 AM
        };
      });

      console.log("Saving formatted blocks:", formattedBlocks);

      const success =
        await availabilityController.saveAvailability(formattedBlocks);

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
    return <Loading />;
  }

  if (!userId) {
    return <AccessDenied />;
  }

  return (
    <div>
      <div className="flex flex-col">
        <h2 className="mt-4 text-2xl font-bold text-blue-800">
          Edit Your Availability
        </h2>
        <div className="mb-4 flex gap-2">
          <p>Click and drag to select your available times. Selected slots:</p>
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
              className="bg-blue-100 px-1 text-center text-sm font-semibold"
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
          className="rounded-lg border border-gray-300 px-2 hover:cursor-pointer hover:opacity-75"
        >
          Clear All
        </button>
        <button
          onClick={saveAvailability}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-800 px-2 text-white hover:cursor-pointer hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </div>
    </div>
  );
};

export default Availability;
