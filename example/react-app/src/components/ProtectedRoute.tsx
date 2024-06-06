import { Navigate } from "react-router-dom";
import { usePlayground } from "../services/playground";
import { ReactNode } from "react";

export const ProtectedRoute = ({ children }: { children?: ReactNode }) => {
  const { isLoggedIn } = usePlayground();
  if (!isLoggedIn) {
    // user is not authenticated
    return <Navigate to="/" />;
  }
  return children;
};
