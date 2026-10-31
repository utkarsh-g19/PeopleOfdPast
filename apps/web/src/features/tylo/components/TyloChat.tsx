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
  token: string;
}

export default function TyloChat({
  companionId,
  companionName,
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
        <div className="tylo-chat-panel">
          <div className="tylo-chat-heading">
            <span className="eyebrow">A SPACE FOR YOUR STORIES</span>
            <h4>{companionName}</h4>
            <p>This conversation is saved in your private vault.</p>
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
        </div>
      )}
    </section>
  );
}
