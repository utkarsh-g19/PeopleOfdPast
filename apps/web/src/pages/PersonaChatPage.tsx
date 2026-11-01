import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import PersonaStory from "../features/ghost-gallery/components/PersonaStory.js";
import {
  fetchHistoricalPersonaDetails,
  type HistoricalPersonaDetails,
} from "../features/ghost-gallery/services/persona.api.js";

export default function PersonaChatPage() {
  const { slug } = useParams();
  const [persona, setPersona] = useState<HistoricalPersonaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setPersona(null);
    setLoading(true);
    setError(null);

    if (!slug) {
      setError("No historical figure was selected.");
      setLoading(false);
      return () => controller.abort();
    }

    void fetchHistoricalPersonaDetails(slug, controller.signal)
      .then(setPersona)
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not open this story.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return <main className="inner-page">Opening the archive...</main>;
  }

  if (!persona) {
    const notFound = error?.toLowerCase().includes("not found");
    return (
      <main className="inner-page">
        <h1>{notFound ? <>Figure <em>not found</em></> : "The story could not be opened"}</h1>
        {!notFound && error && <p role="alert">{error}</p>}
        <Link to="/ghost-gallery" className="text-link">
          Back to the gallery
        </Link>
      </main>
    );
  }

  return (
    <main className="inner-page persona-chat-page">
      <Link to="/ghost-gallery" className="text-link chat-back-link">
        <ArrowLeft size={16} /> Back to the archive
      </Link>

      <header className="chat-persona-header">
        <span className="eyebrow">
          <Sparkles size={14} /> A STORY THROUGH TIME
        </span>
        <h1>{persona.name}</h1>
        <p className="page-intro">{persona.shortBio}</p>
        <PersonaStory slug={persona.slug} />
      </header>
    </main>
  );
}
