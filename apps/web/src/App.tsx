import { Route, Routes } from "react-router";
import SiteHeader from "./components/layout/SiteHeader.js";
import HomePage from "./pages/HomePage.js";
import GhostGalleryPage from "./pages/GhostGalleryPage.js";
import TyloPage from "./pages/TyloPage.js";

export default function App() {
  return (
    <div className="app-shell">
      <SiteHeader />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ghost-gallery" element={<GhostGalleryPage />} />
        <Route path="/tylo" element={<TyloPage />} />
      </Routes>

      <footer className="site-footer">
        <span>PEOPLE OF THE PAST</span>
        <span>Some voices remain.</span>
      </footer>
    </div>
  );
}
