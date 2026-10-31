import { useEffect, useState, type FormEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Heart, Plus, Trash2, BookHeart, ChevronDown } from "lucide-react";
import {
  fetchCompanions,
  createCompanion,
  addCompanionMemory,
  deleteCompanion,
  type TyloCompanion,
  type TyloProfile,
} from "../features/tylo/services/tylo.api.js";
import TyloChat from "../features/tylo/components/TyloChat.js";
import TyloProfileEditor from "../features/tylo/components/TyloProfileEditor.js";

const EMPTY_PROFILE: TyloProfile = {
  ageAndLifeStages: "",
  relationshipHistory: "",
  personality: "",
  nicknames: "",
  specialMoments: "",
  interests: "",
  valuesAndBeliefs: "",
  speakingStyle: "",
  familyAndFriends: "",
  dailyRoutines: "",
  stories: "",
  likesAndDislikes: "",
  favouritePhrases: "",
  lessonsAndAdvice: "",
  importantDates: "",
};

const PROFILE_SECTIONS: Array<{
  title: string;
  description: string;
  fields: Array<{
    key: keyof TyloProfile;
    label: string;
    placeholder: string;
  }>;
}> = [
  {
    title: "01 — Their life",
    description: "The person they were and the life they lived.",
    fields: [
      {
        key: "ageAndLifeStages",
        label: "Age & life stages",
        placeholder: "Their age, childhood, important stages of their life...",
      },
      {
        key: "relationshipHistory",
        label: "Your relationship",
        placeholder: "How did you meet? How close were you? What was your bond like?",
      },
      {
        key: "familyAndFriends",
        label: "Family & friends",
        placeholder: "People who mattered to them and their relationships...",
      },
      {
        key: "importantDates",
        label: "Important dates & traditions",
        placeholder: "Birthdays, anniversaries, festivals and family traditions...",
      },
    ],
  },
  {
    title: "02 — Their personality",
    description: "The small details that made them unmistakably themselves.",
    fields: [
      {
        key: "personality",
        label: "Nature & personality",
        placeholder: "Were they kind, strict, funny, short-tempered, caring, playful?",
      },
      {
        key: "nicknames",
        label: "Nicknames",
        placeholder: "What did they call you? What did you call them?",
      },
      {
        key: "speakingStyle",
        label: "Speaking style & mannerisms",
        placeholder: "Their tone, accent, gestures, expressions and way of speaking...",
      },
      {
        key: "favouritePhrases",
        label: "Favourite phrases",
        placeholder: "Things they repeatedly said, phrases only they used...",
      },
    ],
  },
  {
    title: "03 — Your shared world",
    description: "The experiences and everyday moments you shared.",
    fields: [
      {
        key: "specialMoments",
        label: "Special moments",
        placeholder: "Your favourite memories together. What happened? How did it feel?",
      },
      {
        key: "stories",
        label: "Stories & anecdotes",
        placeholder: "Funny incidents, family stories and things they told you...",
      },
      {
        key: "dailyRoutines",
        label: "Daily routines",
        placeholder: "What did a normal day with them look like?",
      },
      {
        key: "interests",
        label: "Interests & hobbies",
        placeholder: "Music, films, sports, books, activities and passions...",
      },
    ],
  },
  {
    title: "04 — What they believed",
    description: "Their worldview, preferences and lessons.",
    fields: [
      {
        key: "valuesAndBeliefs",
        label: "Values & beliefs",
        placeholder: "Their principles, opinions, religious or philosophical outlook if relevant...",
      },
      {
        key: "likesAndDislikes",
        label: "Likes & dislikes",
        placeholder: "Favourite food, places, music, habits and things they disliked...",
      },
      {
        key: "lessonsAndAdvice",
        label: "Lessons & advice",
        placeholder: "What did they teach you? What advice did they often give?",
      },
    ],
  },
];

export default function TyloPage() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    getAccessTokenSilently,
    loginWithRedirect,
  } = useAuth0();

  const [token, setToken] = useState<string | null>(null);
  const [companions, setCompanions] = useState<TyloCompanion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [description, setDescription] = useState("");
  const [profile, setProfile] = useState<TyloProfile>({ ...EMPTY_PROFILE });

  const [activeCompanionId, setActiveCompanionId] = useState<string | null>(null);
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryContent, setMemoryContent] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadVault() {
      try {
        setLoading(true);
        setError(null);

        const accessToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: "read:profile",
          },
        });

        if (!accessToken) throw new Error("Could not obtain access token.");

        const data = await fetchCompanions(accessToken);

        if (active) {
          setToken(accessToken);
          setCompanions(data);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not open your vault.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadVault();

    return () => {
      active = false;
    };
  }, [authLoading, isAuthenticated, getAccessTokenSilently]);

  function updateProfile(key: keyof TyloProfile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || saving) return;

    try {
      setSaving(true);
      setError(null);

      const companion = await createCompanion(token, {
        name,
        relationship,
        description,
        profile,
      });

      setCompanions((current) => [companion, ...current]);
      setName("");
      setRelationship("");
      setDescription("");
      setProfile({ ...EMPTY_PROFILE });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create memory space.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMemory(
    event: FormEvent<HTMLFormElement>,
    companionId: string,
  ) {
    event.preventDefault();
    if (!token || saving) return;

    try {
      setSaving(true);
      setError(null);

      const updated = await addCompanionMemory(token, companionId, {
        title: memoryTitle,
        content: memoryContent,
      });

      setCompanions((current) =>
        current.map((item) => item.id === updated.id ? updated : item),
      );

      setMemoryTitle("");
      setMemoryContent("");
      setActiveCompanionId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save memory.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(companionId: string) {
    if (!token || saving) return;

    if (!window.confirm("Delete this companion and all its saved memories?")) return;

    try {
      setSaving(true);
      setError(null);
      await deleteCompanion(token, companionId);
      setCompanions((current) => current.filter((item) => item.id !== companionId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not delete companion.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <main className="inner-page tylo-page">Opening your private vault...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="inner-page tylo-page">
        <span className="eyebrow">TALK TO YOUR LOVED ONES</span>
        <h1>Your memories. <em>Your space.</em></h1>
        <p className="page-intro">Sign in to create your private memory vault.</p>
        <button className="primary-button" onClick={() => void loginWithRedirect()}>
          Sign in to TYLO
        </button>
      </main>
    );
  }

  const populatedProfileCount = PROFILE_SECTIONS
    .flatMap((section) => section.fields)
    .filter((field) => profile[field.key].trim()).length;

  return (
    <main className="inner-page tylo-page">
      <span className="eyebrow"><Heart size={15} /> TALK TO YOUR LOVED ONES</span>
      <h1>Your memories. <em>Your space.</em></h1>
      <p className="page-intro">
        Every little detail matters. Tell us about them, in your own words.
        You can leave fields blank and add more memories whenever you remember.
      </p>

      <section className="tylo-create-panel">
        <h2><Plus size={19} /> Create a memory space</h2>

        <form className="tylo-form" onSubmit={handleCreate}>
          <div className="tylo-basic-fields">
            <label>
              Their name *
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Grandma"
                maxLength={100}
                required
              />
            </label>

            <label>
              Your relationship *
              <input
                value={relationship}
                onChange={(event) => setRelationship(event.target.value)}
                placeholder="e.g. Grandmother"
                maxLength={80}
                required
              />
            </label>
          </div>

          <label>
            A little about them
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="An introduction in your own words..."
              rows={3}
              maxLength={2000}
            />
          </label>

          <div className="tylo-profile-intro">
            <div>
              <span className="eyebrow">THEIR STORY, IN DETAIL</span>
              <h3>Help us get to know them.</h3>
              <p>15 categories · All optional · Your words, your memories</p>
            </div>
            <span className="tylo-profile-progress">
              {populatedProfileCount}/15 filled
            </span>
          </div>

          <div className="tylo-profile-sections">
            {PROFILE_SECTIONS.map((section, sectionIndex) => (
              <details
                className="tylo-profile-section"
                key={section.title}
                open={sectionIndex === 0}
              >
                <summary>
                  <span>
                    <strong>{section.title}</strong>
                    <small>{section.description}</small>
                  </span>
                  <ChevronDown size={19} />
                </summary>

                <div className="tylo-profile-fields">
                  {section.fields.map((field) => (
                    <label key={field.key}>
                      {field.label}
                      <textarea
                        value={profile[field.key]}
                        onChange={(event) => updateProfile(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    </label>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create memory space"}
          </button>
        </form>
      </section>

      {error && <p className="tylo-error" role="alert">{error}</p>}

      <section className="tylo-vault-list">
        <div className="section-heading">
          <div>
            <span className="eyebrow"><BookHeart size={15} /> YOUR PRIVATE VAULT</span>
            <h2>Memories worth <em>keeping.</em></h2>
          </div>
        </div>

        {companions.length === 0 ? (
          <p className="gallery-load-state">
            Your vault is empty. Create your first memory space above.
          </p>
        ) : (
          <div className="tylo-companion-grid">
            {companions.map((companion) => (
              <article className="tylo-companion-card" key={companion.id}>
                <div className="tylo-companion-heading">
                  <div>
                    <span className="profile-category">{companion.relationship}</span>
                    <h3>{companion.name}</h3>
                  </div>
                  <button
                    className="tylo-delete-button"
                    type="button"
                    title="Delete memory space"
                    disabled={saving}
                    onClick={() => void handleDelete(companion.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                {companion.description && <p>{companion.description}</p>}

                <TyloProfileEditor
                  companion={companion}
                  token={token ?? ""}
                  onSaved={(updated) =>
                    setCompanions((current) =>
                      current.map((item) =>
                        item.id === updated.id ? updated : item,
                      ),
                    )
                  }
                />

                <p className="tylo-memory-count">
                  {companion.memories.length} saved memories
                </p>

                {companion.memories.map((memory) => (
                  <div className="tylo-memory-entry" key={memory.id}>
                    <h4>{memory.title}</h4>
                    <p>{memory.content}</p>
                  </div>
                ))}

                {activeCompanionId === companion.id ? (
                  <form
                    className="tylo-form tylo-memory-form"
                    onSubmit={(event) => void handleAddMemory(event, companion.id)}
                  >
                    <label>
                      Memory title
                      <input
                        value={memoryTitle}
                        onChange={(event) => setMemoryTitle(event.target.value)}
                        placeholder="Sunday morning breakfasts"
                        maxLength={120}
                        required
                      />
                    </label>
                    <label>
                      Your memory
                      <textarea
                        value={memoryContent}
                        onChange={(event) => setMemoryContent(event.target.value)}
                        placeholder="Write down what you remember..."
                        rows={4}
                        maxLength={5000}
                        required
                      />
                    </label>
                    <div className="tylo-form-actions">
                      <button className="primary-button" type="submit" disabled={saving}>
                        Save memory
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setActiveCompanionId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="text-link"
                    type="button"
                    onClick={() => setActiveCompanionId(companion.id)}
                  >
                    <Plus size={16} /> Add a memory
                  </button>
                )}

                <TyloChat
                  companionId={companion.id}
                  companionName={companion.name}
                  token={token ?? ""}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="tylo-privacy-note">
        Your memory spaces are private to your account. Only you can access,
        add or delete them.
      </p>
    </main>
  );
}


