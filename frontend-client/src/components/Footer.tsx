import { Link } from "react-router";
import { Film, Globe, Share2, Volume2 } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Explore",
      links: [
        { label: "Now Showing", to: "/movies" },
        { label: "Screenings", to: "/screenings" },
        { label: "Find Cinemas", to: "/cinemas" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Sign In", to: "/login" },
        { label: "Register", to: "/register" },
        { label: "My Profile", to: "/profile" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms of Service", to: "/terms" },
        { label: "Privacy Policy", to: "/privacy" },
        { label: "Cookie Policy", to: "/cookies" },
        { label: "Refund Policy", to: "/refunds" },
      ],
    },
  ];

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl text-red-600 mb-4 inline-flex"
            >
              <Film className="w-6 h-6" />
              <span>CineMatrix</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              The ultimate cinema experience. Book seats, discover movies, and
              manage your entire cinematic journey in one place.
            </p>
            <div className="flex gap-3 mt-5">
              {[Globe, Share2, Volume2].map((Icon, i) => (
                <button
                  key={i}
                  className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          {footerSections.map((col) => (
            <div key={col.title}>
              <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-4">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} CineMatrix Inc. All rights reserved.
          </p>
          <div className="flex gap-5">
            {["Terms", "Privacy", "Cookies"].map((t) => (
              <Link
                key={t}
                to={`/${t.toLowerCase()}`}
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
