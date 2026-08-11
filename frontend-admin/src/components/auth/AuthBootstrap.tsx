import { useEffect } from "react";
import { Outlet } from "react-router";
import { Loader2 } from "lucide-react";
import { useUserStore } from "../../stores/user.store";

// Validates any persisted session against the backend before rendering any
// route. Without this, a stale/expired token in localStorage lets protected
// pages (dashboard, sidebar, admin card) flash briefly before being kicked.
const AuthBootstrap = () => {
  const { isBootstrapped, bootstrapAction } = useUserStore();

  useEffect(() => {
    if (!isBootstrapped) {
      void bootstrapAction();
    }
  }, [isBootstrapped, bootstrapAction]);

  if (!isBootstrapped) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AuthBootstrap;
