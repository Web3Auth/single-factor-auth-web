import { ReactNode } from "react";

type Props = {
  className?: string;
  children: ReactNode;
};

function Card({ children, className }: Props) {
  return <div className={`px-8 py-6 w-full bg-white !rounded-2xl !shadow-modal !border-0 ${className}`}>{children}</div>;
}
export default Card;
