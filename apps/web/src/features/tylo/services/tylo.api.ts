export interface TyloProfile {
  ageAndLifeStages: string;
  relationshipHistory: string;
  personality: string;
  nicknames: string;
  specialMoments: string;
  interests: string;
  valuesAndBeliefs: string;
  speakingStyle: string;
  familyAndFriends: string;
  dailyRoutines: string;
  stories: string;
  likesAndDislikes: string;
  favouritePhrases: string;
  lessonsAndAdvice: string;
  importantDates: string;
}

export interface TyloMemory {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface TyloCompanion {
  id: string;
  name: string;
  relationship: string;
  description: string;
  profileImageDataUrl: string;
  profile: TyloProfile;
  memories: TyloMemory[];
  createdAt: string;
  updatedAt: string;
}

export interface TyloChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ApiResult<T> {
  success: boolean;
  companions?: T[];
  companion?: T;
  message?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const result = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result;
}

export async function fetchCompanions(token: string) {
  const result = await request<ApiResult<TyloCompanion>>(
    "/tylo/companions",
    token,
  );
  return result.companions ?? [];
}

export async function createCompanion(
  token: string,
  data: {
    name: string;
    relationship: string;
    description: string;
    profileImageDataUrl: string;
    profile: TyloProfile;
  },
) {
  const result = await request<ApiResult<TyloCompanion>>(
    "/tylo/companions",
    token,
    { method: "POST", body: JSON.stringify(data) },
  );

  if (!result.companion) throw new Error("Could not create your companion.");
  return result.companion;
}

export async function addCompanionMemory(
  token: string,
  companionId: string,
  data: { title: string; content: string },
) {
  const result = await request<ApiResult<TyloCompanion>>(
    `/tylo/companions/${companionId}/memories`,
    token,
    { method: "POST", body: JSON.stringify(data) },
  );

  if (!result.companion) throw new Error("Could not save your memory.");
  return result.companion;
}

export async function deleteCompanion(token: string, companionId: string) {
  await request<{ success: boolean }>(
    `/tylo/companions/${companionId}`,
    token,
    { method: "DELETE" },
  );
}

export async function fetchTyloMessages(
  token: string,
  companionId: string,
): Promise<TyloChatMessage[]> {
  const result = await request<{
    success: boolean;
    messages: TyloChatMessage[];
  }>(`/tylo/companions/${companionId}/messages`, token);

  return result.messages;
}

export async function sendTyloMessage(
  token: string,
  companionId: string,
  message: string,
): Promise<TyloChatMessage[]> {
  const result = await request<{
    success: boolean;
    messages: TyloChatMessage[];
  }>(`/tylo/companions/${companionId}/chat`, token, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

  return result.messages;
}
export async function updateCompanion(
  token: string,
  companionId: string,
  data: {
    name: string;
    relationship: string;
    description: string;
    profileImageDataUrl?: string;
    profile: TyloProfile;
  },
) {
  const result = await request<ApiResult<TyloCompanion>>(
    `/tylo/companions/${companionId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );

  if (!result.companion) {
    throw new Error("Could not update the memory profile.");
  }

  return result.companion;
}

export async function streamTyloMessage(
  token: string,
  companionId: string,
  message: string,
  onToken: (token: string) => void,
): Promise<TyloChatMessage[]> {
  const response = await fetch(
    `${API_BASE}/tylo/companions/${companionId}/chat`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ message }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as
      | { message?: string }
      | null;

    throw new Error(
      errorBody?.message || `Request failed (${response.status})`,
    );
  }

  if (!response.body) {
    throw new Error("The server did not provide a response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let completedMessages: TyloChatMessage[] | null = null;

  function processEvent(block: string) {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");

    if (!data) return;

    const event = JSON.parse(data) as {
      type: "token" | "complete" | "error";
      token?: string;
      messages?: TyloChatMessage[];
      message?: string;
    };

    if (event.type === "token" && typeof event.token === "string") {
      onToken(event.token);
    }

    if (event.type === "complete" && Array.isArray(event.messages)) {
      completedMessages = event.messages;
    }

    if (event.type === "error") {
      throw new Error(event.message || "The conversation failed.");
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }

      if (done) {
        buffer += decoder.decode();
      }

      buffer = buffer.replace(/\r\n/g, "\n");

      let boundary = buffer.indexOf("\n\n");

      while (boundary !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        processEvent(block);
        boundary = buffer.indexOf("\n\n");
      }

      if (done) {
        if (buffer.trim()) processEvent(buffer);
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!completedMessages) {
    throw new Error("The server ended the stream before saving the conversation.");
  }

  return completedMessages;
}
