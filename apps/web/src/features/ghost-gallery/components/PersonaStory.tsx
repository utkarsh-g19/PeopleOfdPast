import { useEffect, useState } from "react";
import { BookOpen, MapPin, Clock3 } from "lucide-react";
import {
  fetchHistoricalPersonaDetails,
  type HistoricalPersonaDetails,
} from "../services/persona.api.js";

interface Props {
  slug: string;
}

export default function PersonaStory({ slug }: Props) {
  const [persona, setPersona] = useState<HistoricalPersonaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchHistoricalPersonaDetails(slug, controller.signal);
        setPersona(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load biography.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return <section className="persona-story-loading">Opening the historical records...</section>;
  }

  if (error || !persona) {
    return (
      <section className="persona-story-error" role="alert">
        {error || "Historical biography unavailable."}
      </section>
    );
  }

  const paragraphs = persona.biography
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section className="persona-story">
      <div className="persona-story-overview">
        {persona.portraitUrl && (
          <figure className="persona-story-portrait">
            <img src={persona.portraitUrl} alt={`Portrait of ${persona.name}`} />
            {persona.portraitCredit && (
              <figcaption>{persona.portraitCredit}</figcaption>
            )}
          </figure>
        )}

        <div className="persona-story-intro">
          <span className="eyebrow">THE LIFE BEHIND THE LEGACY</span>
          <h2>{persona.name}</h2>
          <p>{persona.shortBio}</p>

          <div className="persona-story-facts">
            <span><Clock3 size={15} /> {persona.era}</span>
            <span>
              <MapPin size={15} />
              {[persona.city, persona.country].filter(Boolean).join(", ")}
            </span>
          </div>

          <div className="persona-disciplines">
            {persona.disciplines.map((discipline) => (
              <span key={discipline}>{discipline}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="persona-biography">
        <span className="eyebrow"><BookOpen size={15} /> THEIR STORY</span>
        <h3>A life worth remembering.</h3>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
