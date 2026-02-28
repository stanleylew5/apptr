import Link from "next/link";
import { PageHeaderProps } from "./types";

export function PageHeader({
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
