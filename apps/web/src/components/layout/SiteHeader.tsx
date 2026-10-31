import { Link, NavLink } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";
import { Heart, LogIn, LogOut, MoonStar } from "lucide-react";

export default function SiteHeader() {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
  } = useAuth0();

  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-icon"><MoonStar size={23} /></span>
        <span>PEOPLE<span className="brand-accent">OF</span>THEPAST</span>
      </Link>

      <nav className="main-nav">
        <NavLink to="/ghost-gallery">Ghost Gallery</NavLink>
        <NavLink to="/tylo">TYLO</NavLink>
      </nav>

      <div className="header-actions">
        <Link to="/tylo" className="header-cta">
          <Heart size={16} /> Personal Vault
        </Link>

        {!isLoading && (
          isAuthenticated ? (
            <button
              className="auth-button"
              type="button"
              onClick={() =>
                logout({
                  logoutParams: {
                    returnTo: `${window.location.origin}/`,
                  },
                })
              }
            >
              <LogOut size={15} /> Log out
            </button>
          ) : (
            <button
              className="auth-button"
              type="button"
              onClick={() => loginWithRedirect()}
            >
              <LogIn size={15} /> Sign in
            </button>
          )
        )}
      </div>
    </header>
  );
}
