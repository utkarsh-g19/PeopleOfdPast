import { useHistoricalProfiles } from "../features/ghost-gallery/hooks/useHistoricalProfiles.js";
import ProfileCard from "../features/ghost-gallery/components/ProfileCard.js";

export default function GhostGalleryPage() {
  const { profiles, loading, error } = useHistoricalProfiles();

  return (
    <main className="inner-page">
      <span className="eyebrow">THE HISTORICAL ARCHIVE</span>
      <h1>Ghost <em>Gallery</em></h1>
      <p className="page-intro">
        Explore the stories and ideas of people who changed the world.
      </p>

      {loading && <p className="gallery-load-state">Opening the archive...</p>}
      {error && <p className="gallery-load-state" role="alert">{error}</p>}

      {!loading && !error && profiles.length === 0 && (
        <p className="gallery-load-state">No historical figures have been published yet.</p>
      )}

      {!loading && !error && (
        <div className="profile-grid">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </main>
  );
}
