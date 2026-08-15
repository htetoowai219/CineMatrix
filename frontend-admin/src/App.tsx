import { Navigate, Route, Routes } from "react-router";
import AdminLayout from "./components/layout/AdminLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import AuthBootstrap from "./components/auth/AuthBootstrap";
import { useUserStore } from "./stores/user.store";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PartnerDashboardPage from "./pages/PartnerDashboardPage";
import ManageMoviesPage from "./pages/ManageMoviesPage";
import ManageCinemasPage from "./pages/ManageCinemasPage";
import ReviewCinemaPage from "./pages/ReviewCinemaPage";
import ManageOwnersPage from "./pages/ManageOwnersPage";
import MyCinemasPage from "./pages/MyCinemasPage";
import CinemaDetailPage from "./pages/CinemaDetailPage";
import TemplatesPage from "./pages/TemplatesPage";
import ScreeningsPage from "./pages/ScreeningsPage";
import BookingsPage from "./pages/BookingsPage";
import StaffPage from "./pages/StaffPage";
import ProfilePage from "./pages/ProfilePage";

// Renders the correct dashboard for the signed-in role. Both the admin and the
// partner trees used to declare their own "/" route, which made the route
// match ambiguous; a single shared route avoids that.
const RoleDashboard = () => {
  const { role } = useUserStore();
  return role === "admin" ? <DashboardPage /> : <PartnerDashboardPage />;
};

const App = () => {
  return (
    <Routes>
      <Route element={<AuthBootstrap />}>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            {/* Shared: dashboard, bookings, profile */}
            <Route
              element={
                <RoleRoute roles={["admin", "cinema_owner", "cinema_staff"]} />
              }
            >
              <Route path="/" element={<RoleDashboard />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/bookings/:cinemaId" element={<BookingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin: catalog & network management */}
            <Route element={<RoleRoute roles={["admin"]} />}>
              <Route path="/movies" element={<ManageMoviesPage />} />
              <Route path="/cinemas" element={<ManageCinemasPage />} />
              <Route path="/cinemas/:id/review" element={<ReviewCinemaPage />} />
              <Route path="/owners" element={<ManageOwnersPage />} />
            </Route>

            {/* Owner/staff: partner portal */}
            <Route
              element={<RoleRoute roles={["cinema_owner", "cinema_staff"]} />}
            >
              <Route path="/my-cinemas" element={<MyCinemasPage />} />
              <Route path="/cinemas/:id" element={<CinemaDetailPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/screenings" element={<ScreeningsPage />} />
              <Route path="/screenings/:cinemaId" element={<ScreeningsPage />} />
              <Route path="/staff" element={<StaffPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
