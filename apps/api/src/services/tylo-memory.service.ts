export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ConversationTurn {
  messages: ConversationMessage[];
  score: number;
  latestDate: number;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "was", "were",
  "are", "am", "be", "been", "being", "to", "of", "in", "on",
  "at", "for", "from", "with", "about", "what", "when", "where",
  "who", "why", "how", "did", "do", "does", "you", "your",
  "i", "me", "my", "we", "our", "they", "them", "their", "it",
  "this", "that", "these", "those", "have", "has", "had",
  "tell", "remember", "recall", "can", "could", "would",
  "should", "just", "there", "here", "then", "than",
]);

function tokenize(value: string): Set<string> {
  return new Set(
    (value.toLowerCase().match(/[a-z0-9']+/g) ?? [])
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  );
}

export function buildTyloContext(
  transcript: ConversationMessage[],
  currentMessage: string,
): Array<{ role: "user" | "assistant"; content: string }> {
  if (transcript.length === 0) return [];

  const recent = transcript.slice(-10);
  const older = transcript.slice(0, -10);
  const queryTerms = tokenize(currentMessage);

  if (older.length === 0 || queryTerms.size === 0) {
    return recent.map(({ role, content }) => ({ role, content }));
  }

  // Group user messages with the assistant responses that followed them.
  const turns: ConversationTurn[] = [];

  for (const message of older) {
    if (message.role === "user" || turns.length === 0) {
      turns.push({
        messages: [message],
        score: 0,
        latestDate: message.createdAt.getTime(),
      });
    } else {
      const currentTurn = turns[turns.length - 1];
      currentTurn.messages.push(message);
      currentTurn.latestDate = message.createdAt.getTime();
    }
  }

  // Score older exchanges according to words shared with the current question.
  for (const turn of turns) {
    const turnTerms = tokenize(
      turn.messages.map((message) => message.content).join(" "),
    );

    let overlap = 0;
    for (const term of queryTerms) {
      if (turnTerms.has(term)) overlap++;
    }

    turn.score = overlap / queryTerms.size;
  }

  const relevant = turns
    .filter((turn) => turn.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.latestDate - a.latestDate;
    })
    .slice(0, 3)
    .flatMap((turn) => turn.messages);

  const selected = new Map<string, ConversationMessage>();

  for (const message of [...relevant, ...recent]) {
    selected.set(message.id, message);
  }

  return [...selected.values()]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(({ role, content }) => ({ role, content }));
}
