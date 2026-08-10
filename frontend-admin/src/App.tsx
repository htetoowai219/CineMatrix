import { Navigate, Route, Routes } from "react-router";
import AdminLayout from "./components/layout/AdminLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ManageMoviesPage from "./pages/ManageMoviesPage";
import ManageCinemasPage from "./pages/ManageCinemasPage";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/movies" element={<ManageMoviesPage />} />
          <Route path="/cinemas" element={<ManageCinemasPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
