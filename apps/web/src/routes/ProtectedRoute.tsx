import type { ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return (
      <main className="inner-page">
        <p>Checking your identity...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="inner-page">
        <div className="vault-placeholder">
          <h2>Your memories deserve privacy.</h2>
          <p>Sign in to enter your personal vault.</p>
          <button
            className="primary-button"
            onClick={() => loginWithRedirect()}
          >
            Sign in to TYLO
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
