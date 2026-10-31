import { historicalProfiles } from "../features/ghost-gallery/data/profiles.js";
import ProfileCard from "../features/ghost-gallery/components/ProfileCard.js";

export default function GhostGalleryPage() {
  return (
    <main className="inner-page">
      <span className="eyebrow">THE HISTORICAL ARCHIVE</span>
      <h1>Ghost <em>Gallery</em></h1>
      <p className="page-intro">
        Explore the stories and ideas of people who changed the world.
      </p>

      <div className="profile-grid">
        {historicalProfiles.map((profile) => (
          <ProfileCard key={profile.id} profile={profile} />
        ))}
      </div>
    </main>
  );
}
