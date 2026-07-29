import { Route, Routes } from "react-router";
import MainLayout from "./components/MainLayout";
import HomePage from "./pages/HomePage";

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
};

export default App;
