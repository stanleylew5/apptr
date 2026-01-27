"use client";

import Link from "next/link";
import { LucideIcon, Users, Save } from "lucide-react";
import React, { useMemo, useState } from "react";


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

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const EMPTY_CELL: CellAvailability = { top: false, bottom: false };

function getCell(
  availability: Availability,
  day: string,
  hour: number
): CellAvailability {
  return availability[day]?.[hour] ?? EMPTY_CELL;
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
}

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

interface CellProps {
  value: CellAvailability;
  onToggle: (half: Half) => void;
}

function Cell({ value, onToggle }: CellProps) {
  const handleKeyDown = (
    e: React.KeyboardEvent,
    half: Half
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(half);
    }
  };

  return (
    <div className="relative h-10 w-full border border-gray-200 select-none">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={value.top}
        onClick={() => onToggle("top")}
        onKeyDown={(e) => handleKeyDown(e, "top")}
        className={`absolute inset-x-0 top-0 h-1/2 cursor-pointer ${
          value.top ? "bg-blue-300" : ""
        }`}
      />
      <div
        role="button"
        tabIndex={0}
        aria-pressed={value.bottom}
        onClick={() => onToggle("bottom")}
        onKeyDown={(e) => handleKeyDown(e, "bottom")}
        className={`absolute inset-x-0 bottom-0 h-1/2 cursor-pointer ${
          value.bottom ? "bg-blue-300" : ""
        }`}
      />
    </div>
  );
}

//TODO: add drag-to-select
// add hover preview shading/dashed outline
//TODO: add clear all and save availability buttons
const Page = () => {
  const [availability, setAvailability] = useState<Availability>({});

  function toggleHalf(day: string, hour: number, half: Half) {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [hour]: {
          ...getCell(prev, day, hour),
          [half]: !getCell(prev, day, hour)[half],
        },
      },
    }));
  }

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

  return (
    <div>
      <PageHeader
        description="Candidate Portal"
        linkPath="/welcome"
        linkText="Switch Role"
        icon={Users}
      />

      <div className="flex flex-col gap-0.5 px-20">
        <h2 className="text-3xl font-bold text-blue-800">
          Welcome, Stanley Lew!
        </h2>
        <p className="text-blue-400">You have {2} interviews</p>
      </div>

      <div className="mx-auto flex max-w-6xl gap-5 bg-gray-100 p-1 px-4">
        <p>My Schedule</p>
        <p>Edit Availability</p>
      </div>

      <div className="flex flex-col px-20">
        <h2 className="text-2xl font-bold text-blue-800">
          Edit Your Availability
        </h2>
        <div className="flex gap-2">
          <p>Click and drag to select your available times. Selected slots:</p>
          <p className="font-semibold text-blue-800">
            {selectedCount}
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid w-full max-w-5xl grid-cols-[max-content_repeat(7,1fr)] select-none">
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
                  value={getCell(availability, day, hour)}
                  onToggle={(half) =>
                    toggleHalf(day, hour, half)
                  }
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-4 mb-4 flex max-w-6xl items-center justify-end gap-3 font-medium">
        <button className="rounded-lg border border-gray-300 px-2">
          Clear All
        </button>
        <button className="flex items-center gap-2 rounded-lg bg-blue-800 px-2 text-white">
          <Save className="h-4 w-4" />
          Save Availability
        </button>
      </div>
    </div>
  );
};

export default Page;