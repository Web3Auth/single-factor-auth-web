import { ReactNode } from "react";

type Props = {
  className?: string;
  children: ReactNode;
};

function Badge({ children, className }: Props) {
  return <div className={`bg-app-gray-100 text-app-gray-900 py-0.5 px-2.5 text-xs rounded-md font-medium ${className}`}>{children}</div>;
}
export default Badge;
