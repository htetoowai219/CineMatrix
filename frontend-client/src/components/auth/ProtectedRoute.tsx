// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router";

export default function ProtectedRoute() {
  // Check if access token exists in localStorage (or your auth state/context)
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
