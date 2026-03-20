import { Calendar, Clock, User, MapPin } from "lucide-react";

type PendingApptCardProps = {
  title: string;
  infoItems: string[];
  onConfirm: () => void;
  onReject: () => void;
  isLoading?: boolean;
  waitingFor?: string;
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
  onReject,
  isLoading = false,
  waitingFor = "Waiting for: Both",
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

        <div className="mt-2 text-sm text-gray-500">{waitingFor}</div>
      </div>

      <div className="flex max-w-6xl flex-col gap-3 font-medium">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="gap-2 rounded-lg bg-blue-800 px-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Confirming..." : "Confirm"}
        </button>
      </div>

      <div className="flex max-w-6xl flex-col gap-3 font-medium">
        <button
          onClick={onReject}
          disabled={isLoading}
          className="gap-2 rounded-lg bg-red-500 px-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Rejecting..." : "Reject"}
        </button>
      </div>
    
    
    </div>

  );
}
