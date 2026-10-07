import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useTeam } from "@/context/TeamContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Route guard component: checks if a team name is saved in localStorage/context.
 * If no team name is saved, redirects the visitor back to the login page.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { teamName } = useTeam();

  // Route guard check: check both context and localStorage directly as fallback
  const savedTeam = teamName || (typeof window !== "undefined" ? localStorage.getItem("teamName") : null);

  if (!savedTeam || !savedTeam.trim()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
