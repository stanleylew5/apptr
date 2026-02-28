import React from "react";
import { CellProps, Half } from "./types";

export function Cell({
  dateKey,
  hour,
  value,
  onApply,
  dragState,
  setDragState,
}: CellProps) {
  function handleMouseDown(half: Half) {
    const current = value[half];
    const targetValue = !current;
    const key = `${dateKey}-${hour}-${half}`;

    setDragState({
      active: true,
      targetValue,
      visited: new Set([key]),
    });

    onApply(dateKey, hour, half, targetValue);
  }

  function handleMouseEnter(half: Half) {
    if (!dragState?.active) return;

    const key = `${dateKey}-${hour}-${half}`;
    if (dragState.visited.has(key)) return;

    dragState.visited.add(key);
    onApply(dateKey, hour, half, dragState.targetValue);
  }

  function handleKeyDown(e: React.KeyboardEvent, half: Half) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onApply(dateKey, hour, half, !value[half]);
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
