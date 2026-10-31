import type { PersonaSummary } from "@pot/shared";

interface ProfileCardProps {
  profile: PersonaSummary;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <article className="profile-card">
      <div
        className={`portrait-art portrait-art--${profile.id}`}
        role="img"
        aria-label={`Portrait placeholder for ${profile.name}`}
      >
        <div className="portrait-halo" />
        <div className="portrait-head" />
        <div className="portrait-body" />
        <span className="portrait-monogram">{initials}</span>
      </div>

      <div className="profile-card-content">
        <span className="profile-category">HISTORICAL FIGURE</span>
        <h3>{profile.name}</h3>
        <p>{profile.description}</p>
        <button className="text-link" type="button">
          Explore story <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}
