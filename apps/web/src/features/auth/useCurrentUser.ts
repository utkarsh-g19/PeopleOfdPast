import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  fetchCurrentUser,
  type CurrentUser,
} from "../../services/api.js";

export function useCurrentUser() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!isAuthenticated) {
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    async function loadUser(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: "read:profile",
          },
        });

        if (!token) {
          throw new Error("Auth0 did not return an access token.");
        }

        const result = await fetchCurrentUser(token);

        if (active) {
          setUser(result);
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Authentication failed."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [isAuthenticated, getAccessTokenSilently]);

  return { user, loading, error };
}
