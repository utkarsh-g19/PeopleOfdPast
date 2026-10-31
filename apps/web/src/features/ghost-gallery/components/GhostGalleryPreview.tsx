import { Link } from "react-router";
import { ArrowRight, Ghost } from "lucide-react";
import { useHistoricalProfiles } from "../hooks/useHistoricalProfiles.js";
import ProfileCard from "./ProfileCard.js";

export default function GhostGalleryPreview() {
  const { profiles, loading, error } = useHistoricalProfiles();

  return (
    <section className="gallery-section" id="ghost-gallery">
      <div className="section-heading">
        <div>
          <span className="eyebrow"><Ghost size={15} /> THE ARCHIVE</span>
          <h2>Some lives never <em>leave us.</em></h2>
          <p>Step into the minds and stories of extraordinary people.</p>
        </div>

        <Link to="/ghost-gallery" className="text-link">
          Explore gallery <ArrowRight size={16} />
        </Link>
      </div>

      {loading && <p className="gallery-load-state">Opening the archive...</p>}
      {error && <p className="gallery-load-state" role="alert">{error}</p>}

      {!loading && !error && (
        <div className="profile-grid">
          {profiles.slice(0, 3).map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </section>
  );
}
