"use client";

import Link from "next/link";
import { LucideIcon, Users, Save } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { PendingApptCard } from "./pendingApptCard";
import { ConfirmedApptCard } from "./confirmedApptCard";

// Types ----------------------------------------------------

type ViewMode = "schedule" | "availability";

type Half = "top" | "bottom";

type CellAvailability = {
  top: boolean;
  bottom: boolean;
};

type Availability = {
  [day: string]: {
    [hour: number]: CellAvailability;
  };
};

type DragState = {
  active: boolean;
  targetValue: boolean;
  visited: Set<string>;
} | null;

type TimeBlock = {
  day: string;
  startTime: string;
  endTime: string;
};

// Consts & Helpers ------------------------------------------

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const EMPTY_CELL: CellAvailability = { top: false, bottom: false };

function getCell(
  availability: Availability,
  day: string,
  hour: number,
): CellAvailability {
  return availability[day]?.[hour] ?? EMPTY_CELL;
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
}

// Page Header ------------------------------------------------

interface PageHeaderProps {
  description: string;
  linkPath: string;
  linkText: string;
  icon: LucideIcon;
}

function PageHeader({
  description,
  linkPath,
  linkText,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <div className="mx-auto mt-4 flex max-w-6xl place-items-center justify-between px-1">
      <div className="flex items-center gap-5">
        <div className="flex h-17 w-17 place-items-center justify-center rounded-lg bg-blue-800">
          <Icon className="h-9 w-9 text-white" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-5xl font-bold text-blue-800">Apptr</h2>
          <p>{description}</p>
        </div>
      </div>

      <div>
        <Link href={linkPath} className="font-semibold">
          {linkText}
        </Link>
      </div>
    </div>
  );
}

// Cell Component --------------------------------------------

interface CellProps {
  day: string;
  hour: number;
  value: CellAvailability;
  onApply: (day: string, hour: number, half: Half, value: boolean) => void;
  dragState: DragState;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
}

function Cell({
  day,
  hour,
  value,
  onApply,
  dragState,
  setDragState,
}: CellProps) {
  function handleMouseDown(half: Half) {
    const current = value[half];
    const targetValue = !current;
    const key = `${day}-${hour}-${half}`;

    setDragState({
      active: true,
      targetValue,
      visited: new Set([key]),
    });

    onApply(day, hour, half, targetValue);
  }

  function handleMouseEnter(half: Half) {
    if (!dragState?.active) return;

    const key = `${day}-${hour}-${half}`;
    if (dragState.visited.has(key)) return;

    dragState.visited.add(key);
    onApply(day, hour, half, dragState.targetValue);
  }

  function handleKeyDown(e: React.KeyboardEvent, half: Half) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onApply(day, hour, half, !value[half]);
    }
  }

  return (
    <div className="relative h-10 w-full border border-gray-200 select-none">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={value.top}
        onMouseDown={() => handleMouseDown("top")}
        onMouseEnter={() => handleMouseEnter("top")}
        onKeyDown={(e) => handleKeyDown(e, "top")}
        className={`absolute inset-x-0 top-0 h-1/2 cursor-pointer ${
          value.top ? "bg-blue-300" : ""
        }`}
      />
      <div
        role="button"
        tabIndex={0}
        aria-pressed={value.bottom}
        onMouseDown={() => handleMouseDown("bottom")}
        onMouseEnter={() => handleMouseEnter("bottom")}
        onKeyDown={(e) => handleKeyDown(e, "bottom")}
        className={`absolute inset-x-0 bottom-0 h-1/2 cursor-pointer ${
          value.bottom ? "bg-blue-300" : ""
        }`}
      />
    </div>
  );
}

// Page ----------------------------------------------------

const Availability = () => {
  const [availability, setAvailability] = useState<Availability>({});
  const [dragState, setDragState] = useState<DragState>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [view, setView] = useState<ViewMode>("schedule");

  // Apply a half-cell value
  function applyHalf(day: string, hour: number, half: Half, value: boolean) {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [hour]: {
          ...getCell(prev, day, hour),
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

  // Keep `timeBlocks` in sync with `availability` so it's always available in state.
  useEffect(() => {
    const blocks: TimeBlock[] = [];

    for (const day of days) {
      // Build an ordered list of half-hour slots for the provided `times`.
      // Each hour contributes two slots: top (00-30) and bottom (30-00).
      type HalfSlot = { selected: boolean; start: string; end: string };
      const slots: HalfSlot[] = [];

      for (const hour of times) {
        const cell = getCell(availability, day, hour);

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

        blocks.push({ day, startTime: start, endTime: end });
      }
    }

    setTimeBlocks(blocks);
  }, [availability]);

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
// TODO: description should change depending on account role
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
              {days.map((day) => (
                <div
                  key={day}
                  className="bg-blue-100 text-center font-semibold"
                >
                  {day}
                </div>
              ))}
              {times.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="pr-2 text-right font-medium">
                    {formatHour(hour)}
                  </div>
                  {days.map((day) => (
                    <Cell
                      key={`${day}-${hour}`}
                      day={day}
                      hour={hour}
                      value={getCell(availability, day, hour)}
                      onApply={applyHalf}
                      dragState={dragState}
                      setDragState={setDragState}
                    />
                  ))}
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
              onClick={() => {
                console.log("Time Blocks to save:", timeBlocks);
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-800 px-2 text-white"
            >
              <Save className="h-4 w-4" />
              Save Availability
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

export default Availability;
