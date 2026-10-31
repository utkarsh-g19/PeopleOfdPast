const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface CurrentUser {
  sub: string;
}

interface AuthMeResponse {
  success?: boolean;
  user?: {
    sub?: unknown;
  };
  message?: string;
}

export async function fetchCurrentUser(
  accessToken: string
): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json()) as AuthMeResponse;

  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.status}`);
  }

  if (!data.success || typeof data.user?.sub !== "string") {
    throw new Error("Invalid response from POT API.");
  }

  return { sub: data.user.sub };
}
