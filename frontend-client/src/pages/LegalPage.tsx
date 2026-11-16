import { useLocation } from "react-router";
import SectionLabel from "../components/SectionLabel";

type LegalPageKey = "terms" | "privacy" | "cookies" | "refunds";

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

interface LegalPageContent {
  title: string;
  intro: string;
  sections: LegalSection[];
}

const LEGAL_PAGES: Record<LegalPageKey, LegalPageContent> = {
  terms: {
    title: "Terms of Service",
    intro:
      "These terms explain how you may use CineMatrix, a demonstration cinema booking application.",
    sections: [
      {
        heading: "Using the service",
        paragraphs: [
          "Use CineMatrix only for lawful purposes and only with accurate account information. You are responsible for keeping your login credentials secure.",
          "Screenings, seat maps, prices, and availability are supplied by participating cinemas and may change before a booking is completed.",
        ],
      },
      {
        heading: "Bookings and payments",
        paragraphs: [
          "This demo does not process real payments. Bookings created in the application are stored for demonstration and testing purposes only.",
          "A booking is confirmed only after the application shows a confirmed status for that booking.",
        ],
      },
      {
        heading: "Changes to the service",
        paragraphs: [
          "Features and content may be changed, suspended, or removed as the application evolves. We aim to keep information accurate but cannot guarantee uninterrupted availability.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy describes the information CineMatrix stores when you use the application.",
    sections: [
      {
        heading: "Information we store",
        paragraphs: [
          "Account information includes your name, email address, phone number, and an optional profile image. Authentication tokens are stored in your browser to keep you signed in.",
          "Booking information includes the screening, selected seats, and the account that created the booking.",
        ],
      },
      {
        heading: "How information is used",
        paragraphs: [
          "The information is used to provide the booking experience, show your booking history, and let cinema partners manage screenings and reservations.",
          "We do not sell personal information or use it for advertising in this demonstration application.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You can update your profile information from the profile page and sign out at any time. Contact the application owner if you need an account removed.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    intro:
      "CineMatrix uses browser storage to keep the application working correctly.",
    sections: [
      {
        heading: "Essential storage",
        paragraphs: [
          "The application stores your session tokens and basic profile information in browser storage so that protected pages and booking flows continue to work between visits.",
          "This storage is required for authentication and is cleared when you sign out.",
        ],
      },
      {
        heading: "Third-party content",
        paragraphs: [
          "Movie details and trailer embeds may load content from third-party providers. Those providers may apply their own cookie and privacy policies when their content is displayed.",
        ],
      },
      {
        heading: "Managing storage",
        paragraphs: [
          "You can clear browser storage through your browser settings. Clearing it will sign you out and may remove local preferences.",
        ],
      },
    ],
  },
  refunds: {
    title: "Refund Policy",
    intro:
      "This policy explains how cancellations and refunds work in this demonstration application.",
    sections: [
      {
        heading: "No real payments",
        paragraphs: [
          "CineMatrix does not process real payments in this demonstration. Any prices shown are sample data supplied by the cinema catalog.",
          "Because no money is collected, no monetary refund can be issued.",
        ],
      },
      {
        heading: "Cancelling a booking",
        paragraphs: [
          "Cancellation behavior depends on the cinema and is shown in the booking flow. When a booking is cancelled, its seats become available again for other customers.",
        ],
      },
      {
        heading: "Questions",
        paragraphs: [
          "For questions about a booking, contact the cinema listed on the booking confirmation. A production deployment should publish the cinema's own refund terms before accepting payments.",
        ],
      },
    ],
  },
};

const LegalPage = () => {
  const { pathname } = useLocation();
  const key = (pathname.replace(/^\/+/, "").split("/")[0] ||
    "terms") as LegalPageKey;
  const page = LEGAL_PAGES[key] ?? LEGAL_PAGES.terms;

  return (
    <div className="bg-slate-950 min-h-screen text-white pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionLabel>Legal</SectionLabel>
        <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight mb-4">
          {page.title}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          {page.intro}
        </p>
        <p className="text-slate-600 text-xs mt-3">Last updated: November 2026</p>

        <div className="space-y-8 mt-10">
          {page.sections.map((section) => (
            <section
              key={section.heading}
              className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 sm:p-6"
            >
              <h2 className="font-display font-bold text-lg sm:text-xl uppercase tracking-wide mb-3">
                {section.heading}
              </h2>
              <div className="space-y-3 text-slate-400 text-sm leading-relaxed">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="text-slate-600 text-xs leading-relaxed mt-10">
          This page is provided for demonstration purposes and is not legal
          advice.
        </p>
      </div>
    </div>
  );
};

export default LegalPage;
