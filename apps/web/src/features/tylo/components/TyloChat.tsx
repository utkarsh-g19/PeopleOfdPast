import { useEffect, useState, type FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import {
  fetchTyloMessages,
  streamTyloMessage,
  type TyloChatMessage,
} from "../services/tylo.api.js";

interface Props {
  companionId: string;
  companionName: string;
  companionImage?: string;
  relationship: string;
  token: string;
}

export default function TyloChat({
  companionId,
  companionName,
  companionImage,
  relationship,
  token,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<TyloChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || loaded) return;

    let active = true;

    async function loadMessages() {
      try {
        setLoading(true);
        setError(null);

        const saved = await fetchTyloMessages(token, companionId);

        if (active) {
          setMessages(saved);
          setLoaded(true);
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load this conversation.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMessages();

    return () => {
      active = false;
    };
  }, [open, loaded, token, companionId]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();
    if (!message || sending) return;

    const userTempId = `pending-user-${Date.now()}`;
    const assistantTempId = `pending-assistant-${Date.now()}`;
    const timestamp = new Date().toISOString();

    setMessages((current) => [
      ...current,
      {
        id: userTempId,
        role: "user",
        content: message,
        createdAt: timestamp,
      },
      {
        id: assistantTempId,
        role: "assistant",
        content: "",
        createdAt: timestamp,
      },
    ]);

    setInput("");
    setSending(true);
    setError(null);

    try {
      const saved = await streamTyloMessage(
        token,
        companionId,
        message,
        (tokenChunk) => {
          setMessages((current) =>
            current.map((item) =>
              item.id === assistantTempId
                ? { ...item, content: item.content + tokenChunk }
                : item,
            ),
          );
        },
      );

      setMessages((current) => [
        ...current.filter(
          (item) =>
            item.id !== userTempId && item.id !== assistantTempId,
        ),
        ...saved,
      ]);
    } catch (err: unknown) {
      setMessages((current) =>
        current.filter(
          (item) =>
            item.id !== userTempId && item.id !== assistantTempId,
        ),
      );

      setInput(message);
      setError(
        err instanceof Error ? err.message : "Could not send your message.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="tylo-chat">
      <button
        className="secondary-button tylo-chat-toggle"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <MessageCircle size={17} />
        {open ? "Close conversation" : `Talk to ${companionName}`}
      </button>

      {open && (
        <div className="tylo-chat-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="tylo-chat-window" role="dialog" aria-modal="true" aria-label={`Conversation with ${companionName}`}>
            <aside className="tylo-chat-person">
              {companionImage ? <img src={companionImage} alt={`Portrait of ${companionName}`} /> : <div className="tylo-chat-person-placeholder" aria-label="No photo uploaded">♡</div>}
              <span className="profile-category">{relationship}</span>
              <h2>{companionName}</h2>
              <p>A space for your stories, memories, and the things you still want to say.</p>
            </aside>
            <section className="tylo-chat-conversation">
              <div className="tylo-chat-heading">
                <div><span className="eyebrow">YOUR PRIVATE CONVERSATION</span><p>Saved in your private vault</p></div>
                <button className="tylo-chat-close" type="button" aria-label="Close conversation" onClick={() => setOpen(false)}>×</button>
              </div>

          <div className="tylo-chat-messages" aria-live="polite">
            {loading && <p>Opening your conversation...</p>}

            {!loading && messages.length === 0 && (
              <p className="tylo-chat-empty">
                Start with a memory, a question, or simply tell them how your day went.
              </p>
            )}

            {messages.map((message) => (
              <article
                className={`tylo-chat-message tylo-chat-message--${message.role}`}
                key={message.id}
              >
                <span>
                  {message.role === "user" ? "YOU" : companionName.toUpperCase()}
                </span>
                <p>
                  {message.content ||
                    (sending && message.role === "assistant"
                      ? " "
                      : "")}
                </p>
              </article>
            ))}

            {sending && (
              <p className="tylo-chat-thinking">Writing...</p>
            )}
          </div>

          {error && <p className="tylo-error" role="alert">{error}</p>}

          <form className="tylo-chat-form" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Write something to ${companionName}...`}
              rows={2}
              maxLength={4000}
              disabled={sending || loading}
            />

            <button
              className="primary-button"
              type="submit"
              disabled={sending || loading || !input.trim()}
            >
              <Send size={16} />
              Send
            </button>
          </form>
            </section>
          </div>
        </div>
      )}
    </section>
  );
}
