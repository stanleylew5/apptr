import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  bullets: string[];
  linkPath: string;
  linkText: string;
  icon: LucideIcon;
}

export function RoleCard({
  title,
  description,
  bullets,
  linkPath,
  linkText,
  icon: Icon,
}: RoleCardProps) {
  return (
    <div className="flex w-85 flex-col gap-2 rounded-lg border-2 border-gray-200 p-6 shadow-xl">
      <div className="flex h-17 w-17 place-items-center justify-center rounded-lg bg-blue-100">
        <Icon className="h-9 w-9 text-blue-800" />
      </div>
      <h2 className="text-2xl font-semibold text-blue-800">{title}</h2>
      <p>{description}</p>
      <ul className="list-disc pl-4 marker:text-blue-800">
        {bullets.map((b, i) => (
          <li key={i} className="text-black">
            {b}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 text-blue-800">
        <Link href={linkPath} className="flex font-semibold hover:scale-105">
          {" "}
          {linkText} <ArrowRight className="ml-2" />
        </Link>
      </div>
    </div>
  );
}
