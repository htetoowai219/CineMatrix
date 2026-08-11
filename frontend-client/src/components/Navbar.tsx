import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { Film, Search, Ticket, User, Menu, X, LogOut } from "lucide-react";
import { useUserStore } from "../stores/user.store";

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Zustand User Store
  const { user, isAuthenticated, logoutAction } = useUserStore();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logoutAction();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Movies", to: "/movies" },
    { label: "Cinemas", to: "/cinemas" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-6 py-4 border-b ${
        isScrolled || mobileMenuOpen
          ? "bg-slate-900/90 backdrop-blur-md border-slate-800/80 shadow-lg"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl text-red-600 shrink-0"
        >
          <Film className="w-6 h-6" />
          <span>CineMatrix</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-red-500 font-semibold"
                    : "text-slate-300 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop Search Input */}
        <div className="hidden md:flex flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search movies, cinemas..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600/60 focus:bg-white/8 transition-all"
            />
          </div>
        </div>

        {/* Actions & CTA */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {/* Primary CTA: Buy Tickets */}
          <Link
            to="/screenings"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs md:text-sm px-3 md:px-4 py-2 rounded-lg shadow-md hover:shadow-red-600/20 active:scale-95 transition-all"
          >
            <Ticket className="w-4 h-4" />
            <span className="hidden sm:inline">Buy Tickets</span>
            <span className="sm:hidden">Tickets</span>
          </Link>

          {/* Conditional Auth Actions (Desktop) */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Username Link */}
              <Link
                to="/profile"
                className="hidden sm:block text-sm font-semibold text-white hover:text-red-500 transition-colors max-w-[120px] truncate"
                title={user?.name}
              >
                {user?.name}
              </Link>

              {/* Profile Icon Button */}
              <Link
                to="/profile"
                className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors backdrop-blur-sm"
                title="Profile"
              >
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-slate-200" />
                )}
              </Link>

              {/* Sign Out Button (Right of Profile) */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-full bg-slate-800/80 hover:bg-red-950/40 hover:text-red-500 text-slate-300 transition-colors border border-transparent hover:border-red-600/40"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-red-500 hover:text-red-400 transition-colors"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 px-2 flex flex-col gap-4 border-t border-slate-800/80 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Mobile Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search movies, cinemas..."
              className="w-full bg-slate-900/90 border border-slate-700/60 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600/60"
            />
          </div>

          {/* Mobile Nav Links */}
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-red-600/10 text-red-500 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile Conditional Auth Drawer */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between px-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-white hover:text-red-500 transition-colors"
                >
                  <User className="w-4 h-4 text-red-500" />
                  <span>{user?.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-slate-300 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-red-500 hover:text-red-400"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
