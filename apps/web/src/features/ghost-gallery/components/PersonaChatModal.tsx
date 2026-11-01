import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { PersonaSummary } from "@pot/shared";
import { streamPersonaMessage, type ChatMessage } from "../services/persona.api.js";

interface Props { profile: PersonaSummary; onClose: () => void }

export default function PersonaChatModal({ profile, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;
    const history = messages.slice(-8);
    setMessages((current) => [...current, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setInput("");
    setSending(true);
    setError(null);
    try {
      await streamPersonaMessage(profile.id, message, history, (token) => {
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          if (last?.role === "assistant") next[next.length - 1] = { ...last, content: last.content + token };
          return next;
        });
      });
    } catch (err: unknown) {
      setMessages((current) => current.slice(0, -2));
      setInput(message);
      setError(err instanceof Error ? err.message : "The conversation failed.");
    } finally { setSending(false); }
  }

  return (
    <dialog
      className="persona-chat-modal"
      ref={dialogRef}
      onCancel={(event) => {
        // Keep the native dialog open until React unmounts it. This avoids a
        // Strict Mode effect cleanup firing a stale close event in dev builds.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}
    >
      <header className="persona-chat-modal-heading">
        <div><span className="eyebrow"><MessageCircle size={14} /> A CONVERSATION THROUGH TIME</span><h2>{profile.name}</h2><p>{profile.era}</p></div>
        <button className="secondary-button" type="button" aria-label="Close conversation" onClick={onClose}><X size={18} /></button>
      </header>
      <div className="persona-chat-modal-messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <span className="eyebrow">THE ARCHIVE IS OPEN</span>
            <h2>What would you like to ask?</h2>
            <p>Ask about {profile.name}’s life, ideas, work, or the world they lived in.</p>
          </div>
        )}
        {messages.map((item, index) => <article className={`chat-message chat-message--${item.role}`} key={`${index}-${item.role}`}><span className="chat-message-role">{item.role === "user" ? "YOU" : profile.name.toUpperCase()}</span><p>{item.content || (sending ? "…" : "")}</p></article>)}
        {error && <p role="alert" className="chat-error">{error}</p>}
      </div>
      <form className="chat-form" onSubmit={(event) => void submit(event)}>
        <textarea className="chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Ask ${profile.name} something...`} rows={2} maxLength={2000} disabled={sending} />
        <button className="primary-button chat-send-button" type="submit" disabled={sending || !input.trim()}><Send size={16} /> Send</button>
      </form>
    </dialog>
  );
}
