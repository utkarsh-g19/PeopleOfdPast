import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Clock3 } from "lucide-react";
import ProfileCard from "./ProfileCard.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

interface RecentPersona {
  slug: string;
  name: string;
  shortBio: string;
  portraitUrl?: string;
  deathDate: string;
}

export default function RecentLegacies() {
  const [people, setPeople] = useState<RecentPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `${API_BASE}/personas?recent=true`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Could not load recent legacies (${response.status}).`);
        }

        const result = await response.json() as {
          personas: RecentPersona[];
        };

        setPeople(result.personas ?? []);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load recent legacies.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));

  return (
    <section className="recent-legacies-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow"><Clock3 size={15} /> RECENTLY REMEMBERED</span>
          <h2>Recent <em>Legacies.</em></h2>
          <p>Five remarkable lives whose stories remain with us.</p>
        </div>
        <span className="recent-legacies-count">LATEST 5</span>
      </div>

      {loading && <p className="gallery-load-state">Gathering recent legacies...</p>}
      {error && <p className="gallery-load-state" role="alert">{error}</p>}

      {!loading && !error && (
        <div className="recent-legacies-grid">
          {people.map((person) => (
            <div className="recent-legacy-item" key={person.slug}>
              <p className="recent-legacy-date">
                Passed away · {formatDate(person.deathDate)}
              </p>
              <ProfileCard
                profile={{
                  id: person.slug,
                  name: person.name,
                  description: person.shortBio,
                  experience: "ghost",
                  imageUrl: person.portraitUrl,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="recent-legacies-footer">
        <Link to="/ghost-gallery" className="text-link">
          Explore the full archive <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
