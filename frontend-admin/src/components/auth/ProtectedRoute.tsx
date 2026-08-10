import { Navigate, Outlet } from "react-router";
import { useUserStore } from "../../stores/user.store";

// Restricts routes to authenticated super admins.
// The backend independently enforces the admin role on every write request.
const ProtectedRoute = () => {
  const { isAuthenticated, role } = useUserStore();

  if (!isAuthenticated || role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
