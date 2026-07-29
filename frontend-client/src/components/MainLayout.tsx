import Navbar from "./Navbar";
import { Outlet } from "react-router";
import Footer from "./Footer";

const MainLayout = () => {
  return (
    <main>
      <Navbar />
      <Outlet />
      <Footer />
    </main>
  );
};

export default MainLayout;
