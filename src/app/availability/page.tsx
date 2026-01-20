import {
  LucideIcon,
  Users,
} from "lucide-react";
import React from "react";
interface PageHeaderProps {
  title: string;
  description: string;
  linkPath: string;
  linkText: string;
  icon: LucideIcon;
}

function PageHeader({
  title,
  description,
  linkPath,
  linkText,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <div>
      <div className="flex h-17 w-17 place-items-center justify-center rounded-lg bg-blue-800">
        <Icon className="h-9 w-9 text-white"/>
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-blue-800">{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

const Page = () => {
  return <div></div>;
};

export default Page;
