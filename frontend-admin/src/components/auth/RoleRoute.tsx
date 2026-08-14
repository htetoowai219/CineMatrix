import { Navigate, Outlet } from "react-router";
import { useUserStore } from "../../stores/user.store";
import type { UserRole } from "../../types/auth.type";

// Restricts a route tree to one or more roles. Roles are additionally enforced
// on the backend for every request.
const RoleRoute = ({ roles }: { roles: UserRole[] }) => {
  const { role } = useUserStore();
  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default RoleRoute;
