import { auth } from "express-oauth2-jwt-bearer";
import { env } from "../config/env.js";

if (!env.AUTH0_DOMAIN || !env.AUTH0_AUDIENCE) {
  throw new Error("AUTH0_DOMAIN and AUTH0_AUDIENCE must be configured.");
}

export const requireAuth = auth({
  issuerBaseURL: `https://${env.AUTH0_DOMAIN}/`,
  audience: env.AUTH0_AUDIENCE,
  tokenSigningAlg: "RS256",
});
