import { useEffect, useState } from "react";
import type { PersonaSummary } from "@pot/shared";
import { fetchHistoricalProfiles } from "../services/persona.api.js";

export function useHistoricalProfiles() {
  const [profiles, setProfiles] = useState<PersonaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfiles() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchHistoricalProfiles(controller.signal);
        setProfiles(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error ? err.message : "Could not load the archive.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProfiles();

    return () => controller.abort();
  }, []);

  return { profiles, loading, error };
}
