import { Calendar, Clock, User, MapPin } from "lucide-react";

type PendingApptCardProps = {
  title: string;
  infoItems: string[];
  onConfirm: () => void;
  onReschedule: () => void;
};

type InfoRowsProps = {
  items: string[];
};

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

export function PendingApptCard({
  title,
  infoItems,
  onConfirm,
  onReschedule,
}: PendingApptCardProps) {
  return (
    <div className="mx-auto flex items-center justify-between gap-5 rounded-md border border-orange-300 p-2">
      <div className="flex flex-col">
        <div className="flex gap-3">
          <div className="gap-2 rounded-lg bg-orange-100 px-2 text-orange-600">
            Action Required
          </div>
          <div>{title}</div>
        </div>

        <InfoRows items={infoItems} />
      </div>

      <div className="flex max-w-6xl flex-col gap-3 font-medium">
        <button
          onClick={onConfirm}
          className="gap-2 rounded-lg bg-blue-800 px-2 text-white"
        >
          Confirm
        </button>

        <button
          onClick={onReschedule}
          className="rounded-lg border border-gray-300 px-2"
        >
          Reschedule
        </button>
      </div>
    </div>
  );
}
