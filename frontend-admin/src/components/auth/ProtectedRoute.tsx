import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { useUserStore } from "../../stores/user.store";
import { decodeJwtPayload } from "../../utils/jwt";

const hasExpired = (token: string | null): boolean => {
  if (!token) return false;
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  return !payload?.exp || payload.exp * 1000 <= Date.now();
};

// Restricts routes to authenticated admins and cinema partners.
// The backend independently enforces roles on every write request.
const ProtectedRoute = () => {
  const { isAuthenticated, role, accessToken, logout } = useUserStore();
  const expired = isAuthenticated && hasExpired(accessToken);

  useEffect(() => {
    if (expired) {
      logout();
    }
  }, [expired, logout]);

  if (!isAuthenticated || expired || !role || role === "customer") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
