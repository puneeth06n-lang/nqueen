import { Routes, Route, Navigate } from "react-router-dom";
import { TeamProvider } from "@/context/TeamContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Home from "@/pages/Home";

/**
 * Main application router:
 * - "/" & "/login": The frontend-only login page (default landing page)
 * - "/game": The main N-Queens puzzle page protected by ProtectedRoute
 * - "*": Fallback redirect to "/"
 */
export default function App() {
  return (
    <TeamProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TeamProvider>
  );
}
