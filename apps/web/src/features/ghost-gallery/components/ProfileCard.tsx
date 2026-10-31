import { Link } from "react-router";
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
        aria-label={`Portrait of ${profile.name}`}
      >
        {profile.imageUrl ? (
          <img
            className="portrait-image"
            src={profile.imageUrl}
            alt={profile.name}
            loading="lazy"
          />
        ) : (
          <>
            <div className="portrait-halo" />
            <div className="portrait-head" />
            <div className="portrait-body" />
            <span className="portrait-monogram">{initials}</span>
          </>
        )}
      </div>

      <div className="profile-card-content">
        <span className="profile-category">HISTORICAL FIGURE</span>
        <h3>{profile.name}</h3>
        <p>{profile.description}</p>
        <Link className="text-link" to={`/ghost-gallery/${profile.id}`}>
          Explore story <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
