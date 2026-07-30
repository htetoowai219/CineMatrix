import { Route, Routes } from "react-router";
import MainLayout from "./components/MainLayout";
import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import CinemasPage from "./pages/CinemasPage";
import CinemaDetailPage from "./pages/CinemaDetailPage";

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        <Route path="/cinemas/:id" element={<CinemaDetailPage />} />
      </Route>
    </Routes>
  );
};

export default App;
