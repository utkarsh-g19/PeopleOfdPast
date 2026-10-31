import { useState } from "react";
import { Link } from "react-router";
import type { PersonaSummary } from "@pot/shared";

interface ProfileCardProps {
  profile: PersonaSummary;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const showImage = Boolean(profile.imageUrl) && !imageFailed;

  return (
    <article className="profile-card">
      <div className={`portrait-art portrait-art--${profile.id}`}>
        {showImage ? (
          <img
            className="portrait-image"
            src={profile.imageUrl}
            alt={`Portrait or historical depiction of ${profile.name}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
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
        {showImage && profile.imageSourceUrl && (
          <a
            className="portrait-credit"
            href={profile.imageSourceUrl}
            target="_blank"
            rel="noreferrer"
            title={profile.imageCredit || "Image source and reuse information"}
          >
            Photo credit: {profile.imageCredit || "Wikimedia Commons"}
          </a>
        )}
        <h3>{profile.name}</h3>
        <p>{profile.description}</p>
        <Link className="text-link" to={`/ghost-gallery/${profile.id}`}>
          Explore story <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
