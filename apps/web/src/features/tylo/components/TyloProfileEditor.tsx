import { useState, type FormEvent } from "react";
import { Pencil, Save, X } from "lucide-react";
import {
  updateCompanion,
  type TyloCompanion,
  type TyloProfile,
} from "../services/tylo.api.js";

interface Props {
  companion: TyloCompanion;
  token: string;
  onSaved: (companion: TyloCompanion) => void;
}

const SECTIONS: Array<{
  title: string;
  fields: Array<{
    key: keyof TyloProfile;
    label: string;
    placeholder: string;
  }>;
}> = [
  {
    title: "Their life",
    fields: [
      { key: "ageAndLifeStages", label: "Age & life stages", placeholder: "Their age, childhood and life stages..." },
      { key: "relationshipHistory", label: "Your relationship", placeholder: "Your bond and shared history..." },
      { key: "familyAndFriends", label: "Family & friends", placeholder: "People who mattered to them..." },
      { key: "importantDates", label: "Important dates & traditions", placeholder: "Birthdays, festivals and family traditions..." },
    ],
  },
  {
    title: "Their personality",
    fields: [
      { key: "personality", label: "Nature & personality", placeholder: "Their temperament, humour and quirks..." },
      { key: "nicknames", label: "Nicknames", placeholder: "What they called you and what you called them..." },
      { key: "speakingStyle", label: "Speaking style", placeholder: "Their tone, accent and mannerisms..." },
      { key: "favouritePhrases", label: "Favourite phrases", placeholder: "Things they often said..." },
    ],
  },
  {
    title: "Your shared world",
    fields: [
      { key: "specialMoments", label: "Special moments", placeholder: "Meaningful memories together..." },
      { key: "stories", label: "Stories & anecdotes", placeholder: "Funny stories and incidents..." },
      { key: "dailyRoutines", label: "Daily routines", placeholder: "What a normal day with them looked like..." },
      { key: "interests", label: "Interests & hobbies", placeholder: "Music, films, books and passions..." },
    ],
  },
  {
    title: "What they believed",
    fields: [
      { key: "valuesAndBeliefs", label: "Values & beliefs", placeholder: "Their principles and worldview..." },
      { key: "likesAndDislikes", label: "Likes & dislikes", placeholder: "Favourite foods, places and preferences..." },
      { key: "lessonsAndAdvice", label: "Lessons & advice", placeholder: "What they taught you..." },
    ],
  },
];

function emptyProfile(): TyloProfile {
  return {
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
}

export default function TyloProfileEditor({
  companion,
  token,
  onSaved,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(companion.name);
  const [relationship, setRelationship] = useState(companion.relationship);
  const [description, setDescription] = useState(companion.description ?? "");
  const [profile, setProfile] = useState<TyloProfile>(() => ({
    ...emptyProfile(),
    ...companion.profile,
  }));

  function startEditing() {
    setName(companion.name);
    setRelationship(companion.relationship);
    setDescription(companion.description ?? "");
    setProfile({ ...emptyProfile(), ...companion.profile });
    setError(null);
    setEditing(true);
  }

  function changeProfile(key: keyof TyloProfile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      setError(null);

      const updated = await updateCompanion(token, companion.id, {
        name,
        relationship,
        description,
        profile,
      });

      onSaved(updated);
      setEditing(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not update this profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    const filledFields = SECTIONS
      .flatMap((section) => section.fields)
      .filter((field) => (companion.profile?.[field.key] ?? "").trim());

    return (
      <div className="tylo-profile-view">
        <div className="tylo-profile-view-heading">
          <span className="profile-category">
            {filledFields.length}/15 PROFILE DETAILS
          </span>
          <button
            type="button"
            className="text-link"
            onClick={startEditing}
          >
            <Pencil size={15} /> Edit profile
          </button>
        </div>

        {filledFields.length === 0 ? (
          <p className="gallery-load-state">
            No additional profile details yet. Add what you remember.
          </p>
        ) : (
          <div className="tylo-saved-profile-grid">
            {filledFields.map((field) => (
              <div key={field.key}>
                <strong>{field.label}</strong>
                <p>{companion.profile[field.key]}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form className="tylo-profile-editor" onSubmit={handleSubmit}>
      <div className="tylo-profile-view-heading">
        <h4>Edit memory profile</h4>
        <button
          type="button"
          className="tylo-delete-button"
          title="Cancel editing"
          onClick={() => setEditing(false)}
        >
          <X size={17} />
        </button>
      </div>

      <div className="tylo-profile-fields">
        <label>
          Their name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
          />
        </label>

        <label>
          Your relationship
          <input
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            maxLength={80}
            required
          />
        </label>
      </div>

      <label className="tylo-profile-description">
        About them
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          maxLength={2000}
        />
      </label>

      {SECTIONS.map((section) => (
        <details className="tylo-profile-section" key={section.title}>
          <summary>
            <strong>{section.title}</strong>
          </summary>

          <div className="tylo-profile-fields">
            {section.fields.map((field) => (
              <label key={field.key}>
                {field.label}
                <textarea
                  value={profile[field.key]}
                  onChange={(event) => changeProfile(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              </label>
            ))}
          </div>
        </details>
      ))}

      {error && <p className="tylo-error" role="alert">{error}</p>}

      <div className="tylo-form-actions">
        <button className="primary-button" type="submit" disabled={saving}>
          <Save size={16} /> {saving ? "Saving..." : "Save profile"}
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={saving}
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
