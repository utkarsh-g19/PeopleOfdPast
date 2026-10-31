import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { useHistoricalProfiles } from "../features/ghost-gallery/hooks/useHistoricalProfiles.js";
import PersonaStory from "../features/ghost-gallery/components/PersonaStory.js";
import {
  streamPersonaMessage,
  type ChatMessage,
} from "../features/ghost-gallery/services/persona.api.js";

export default function PersonaChatPage() {
  const { slug } = useParams();
  const { profiles, loading, error: profilesError } = useHistoricalProfiles();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const persona = profiles.find((profile) => profile.id === slug);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();
    if (!message || !persona || sending) return;

    const previousMessages = messages.slice(-8);

    setMessages((current) => [
      ...current,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    setInput("");
    setSending(true);
    setChatError(null);

    try {
      await streamPersonaMessage(
        persona.id,
        message,
        previousMessages,
        (token) => {
          setMessages((current) => {
            const updated = [...current];
            const lastIndex = updated.length - 1;

            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + token,
              };
            }

            return updated;
          });
        },
      );
    } catch (err: unknown) {
      setMessages((current) => {
        const updated = [...current];
        const last = updated[updated.length - 1];

        if (last?.role === "assistant" && !last.content) {
          updated.pop();
        }

        return updated;
      });

      setInput(message);
      setChatError(
        err instanceof Error ? err.message : "The conversation failed.",
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <main className="inner-page">Opening the archive...</main>;
  }

  if (profilesError) {
    return (
      <main className="inner-page">
        <p role="alert">{profilesError}</p>
        <Link to="/ghost-gallery" className="text-link">
          Back to the gallery
        </Link>
      </main>
    );
  }

  if (!persona) {
    return (
      <main className="inner-page">
        <h1>Figure <em>not found</em></h1>
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
          <Sparkles size={14} /> A CONVERSATION THROUGH TIME
        </span>
        <h1>{persona.name}</h1>
        <p className="page-intro">{persona.description}</p>
        <PersonaStory slug={persona.id} />
      </header>

      <section className="chat-panel">
        <div className="chat-messages" aria-live="polite">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <span className="eyebrow">THE ARCHIVE IS OPEN</span>
              <h2>What would you like to ask?</h2>
              <p>
                Ask about their life, ideas, work or the world they lived in.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              className={`chat-message chat-message--${message.role}`}
              key={`${message.role}-${index}`}
            >
              <span className="chat-message-role">
                {message.role === "user" ? "YOU" : persona.name.toUpperCase()}
              </span>
              <p>
                {message.content || (sending && message.role === "assistant" ? " " : "")}
              </p>
            </div>
          ))}

          {sending && (
            <p className="chat-thinking">Gathering thoughts from the past...</p>
          )}
        </div>

        {chatError && (
          <p className="chat-error" role="alert">{chatError}</p>
        )}

        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            className="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Ask ${persona.name} something...`}
            rows={2}
            maxLength={2000}
            disabled={sending}
          />
          <button
            className="primary-button chat-send-button"
            type="submit"
            disabled={sending || !input.trim()}
          >
            <Send size={16} /> Send
          </button>
        </form>
      </section>
    </main>
  );
}




