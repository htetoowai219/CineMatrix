import { Link } from "react-router";

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
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl text-red-600 mb-4 inline-flex"
            >
              <img
                src="/logo.png"
                alt=""
                className="h-9 w-9 shrink-0 object-contain"
              />
              <span>CineMatrix</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Book seats, discover movies, and manage your cinema visits in one
              place.
            </p>
          </div>

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
