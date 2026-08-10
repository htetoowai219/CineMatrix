import { NavLink, useNavigate } from "react-router";
import {
  Film,
  LayoutDashboard,
  Clapperboard,
  Building2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useUserStore } from "../../stores/user.store";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Movies", to: "/movies", icon: Clapperboard },
  { label: "Cinemas", to: "/cinemas", icon: Building2 },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const { user, logoutAction } = useUserStore();

  const handleLogout = async () => {
    await logoutAction();
    onClose();
    navigate("/login");
  };

  const navClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all border-l-2 ${
      isActive
        ? "bg-red-600/10 text-red-500 border-red-600"
        : "text-slate-400 hover:text-white hover:bg-slate-800/70 border-transparent"
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/25">
              <Film className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="font-display font-black text-lg text-white uppercase tracking-wider leading-none">
                CineMatrix
              </p>
              <p className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                <ShieldCheck className="w-3 h-3 text-red-500" />
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="px-3.5 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Manage
          </p>
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={navClasses} onClick={onClose}>
              <Icon className="w-4.5 h-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User card + logout */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center shrink-0">
              <span className="font-display font-black text-white text-sm uppercase">
                {user?.name ? user.name[0] : "A"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || "super admin"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
