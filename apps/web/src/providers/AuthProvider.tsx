import type { PropsWithChildren } from "react";
import { Auth0Provider } from "@auth0/auth0-react";

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

if (!domain || !clientId || !audience) {
  throw new Error("Missing Auth0 frontend configuration.");
}

interface AuthProviderProps extends PropsWithChildren {}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/`,
        audience,
        scope: "openid profile email read:profile",
      }}
    >
      {children}
    </Auth0Provider>
  );
}
