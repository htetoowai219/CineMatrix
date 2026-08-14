import { Route, Routes } from "react-router";
import MainLayout from "./components/MainLayout";
import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import CinemasPage from "./pages/CinemasPage";
import CinemaDetailPage from "./pages/CinemaDetailPage";
import ProfilePage from "./pages/Profile";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingPage from "./pages/BookingPage";
import ScreeningsPage from "./pages/ScreeningsPage";

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        <Route path="/cinemas/:id" element={<CinemaDetailPage />} />
        <Route path="/screenings" element={<ScreeningsPage />} />
        <Route path="/book/:screeningId" element={<BookingPage />} />

        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
};

export default App;
