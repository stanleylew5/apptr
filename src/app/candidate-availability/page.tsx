"use client";

import Link from "next/link";
import { LucideIcon, Users, Save } from "lucide-react";
import React, { useState } from "react";

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

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

interface CellProps {
  state: { top: boolean; bottom: boolean };
  onToggleTop: () => void;
  onToggleBottom: () => void;
}

function Cell({ state, onToggleTop, onToggleBottom }: CellProps) {
  return (
    <div className="relative h-10 w-full border border-gray-200">
      <div
        onClick={onToggleTop}
        className={`absolute inset-x-0 top-0 h-1/2 cursor-pointer ${
          state.top ? "bg-blue-300" : ""
        }`}
      />

      <div
        onClick={onToggleBottom}
        className={`absolute inset-x-0 bottom-0 h-1/2 cursor-pointer ${
          state.bottom ? "bg-blue-300" : ""
        }`}
      />
    </div>
  );
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour;
  return `${display}:00 ${suffix}`;
}

//TODO: add drag-to-select
// add hover preview shading/dashed outline
//TODO: add clear all and save availability buttons
const Page = () => {
  const [availability, setAvailability] = useState<
    Record<string, { top: boolean; bottom: boolean }>
  >({});

  function toggleHalf(day: string, time: number, half: "top" | "bottom") {
    const key = `${day}-${time}`;

    setAvailability((prev) => {
      const current = prev[key] ?? { top: false, bottom: false };
      return {
        ...prev,
        [key]: {
          ...current,
          [half]: !current[half],
        },
      };
    });
  }

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
          <p>Click and drag to select your available times. Selected slots: </p>
          <p className="text-blue-800">{31}</p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid w-full max-w-5xl grid-cols-[max-content_repeat(7,1fr)]">
          <div></div>

          {days.map((day) => (
            <div key={day} className="bg-blue-100 text-center font-semibold">
              {day}
            </div>
          ))}

          {times.map((time) => (
            <React.Fragment key={time}>
              <div className="pr-2 text-right font-medium">
                {formatHour(time)}
              </div>

              {days.map((day) => {
                const key = `${day}-${time}`;
                const state = availability[key] ?? {
                  top: false,
                  bottom: false,
                };

                return (
                  <Cell
                    key={key}
                    state={state}
                    onToggleTop={() => toggleHalf(day, time, "top")}
                    onToggleBottom={() => toggleHalf(day, time, "bottom")}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-6xl place-items-center justify-end gap-3 font-medium mb-4">
          <button className="border border-gray-300 rounded-lg px-2">
            Clear All
          </button>
          <button className="bg-blue-800 text-white rounded-lg px-2 flex gap-2 place-items-center">
            <Save className="h-4 w-4" />
            Save Availability
          </button>
      </div>

    </div>
  );
};

export default Page;