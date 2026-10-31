import { useHistoricalProfiles } from "../features/ghost-gallery/hooks/useHistoricalProfiles.js";
import ProfileCard from "../features/ghost-gallery/components/ProfileCard.js";
import RecentLegacies from "../features/ghost-gallery/components/RecentLegacies.js";

export default function GhostGalleryPage() {
  const { profiles, loading, error } = useHistoricalProfiles();

  return (
    <main className="inner-page">
      <span className="eyebrow">THE HISTORICAL ARCHIVE</span>
      <h1>Ghost <em>Gallery</em></h1>
      <p className="page-intro">
        Explore the stories and ideas of people who changed the world.
      </p>

      <RecentLegacies />

      <section className="archive-all-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE COLLECTION</span>
            <h2>Across <em>time.</em></h2>
            <p>{profiles.length} historical figures in the archive.</p>
          </div>
        </div>

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
      </section>
    </main>
  );
}
