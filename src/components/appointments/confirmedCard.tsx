import { Calendar, Clock, User, MapPin } from "lucide-react";
import { ConfirmedApptCardProps, InfoRowsProps } from "@/types/appointments";

export function InfoRows({ items }: InfoRowsProps) {
  const icons = [Calendar, Clock, User, MapPin];
  return (
    <div className="flex flex-col text-gray-600">
      {items.map((text, i) => {
        const Icon = icons[i];
        return (
          <div key={i} className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {text}
          </div>
        );
      })}
    </div>
  );
}

export function ConfirmedApptCard({
  title,
  infoItems,
  // onAddCalendar,
  onEditLocation,
  isInterviewer = false,
}: ConfirmedApptCardProps) {
  return (
    <div className="mx-auto flex items-center justify-between gap-5 rounded-md border border-green-300 p-2">
      <div className="flex flex-col">
        <div className="flex gap-3">
          <div className="gap-2 rounded-lg bg-green-100 px-2 text-green-600">
            Confirmed
          </div>
          <div>{title}</div>
        </div>

        <InfoRows items={infoItems} />
      </div>

      <div className="flex max-w-6xl flex-col gap-3 font-medium">
        {/* <button
          onClick={onAddCalendar}
          className="rounded-lg bg-blue-600 px-2 text-white hover:bg-blue-700"
        >
          Add to Calendar
        </button> */}
        {isInterviewer && onEditLocation && (
          <button
            onClick={onEditLocation}
            className="rounded-lg bg-blue-600 px-2 text-white hover:bg-blue-700"
          >
            Edit Location
          </button>
        )}
      </div>
    </div>
  );
}
