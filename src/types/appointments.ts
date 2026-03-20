export interface ConfirmedApptCardProps {
  title: string;
  infoItems: string[];
  onAddCalendar: () => void;
  onEditLocation?: () => void;
  isInterviewer?: boolean;
}

export interface PendingApptCardProps {
  title: string;
  infoItems: string[];
  onConfirm: () => void;
  onReject: () => void;
  isLoading?: boolean;
  waitingFor?: string;
}

export interface RejectedApptCardProps {
  title: string;
  infoItems: string[];
}

export interface InfoRowsProps {
  items: string[];
}
