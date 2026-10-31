import { Link } from "react-router";
import { ArrowRight, Ghost } from "lucide-react";
import { historicalProfiles } from "../data/profiles.js";
import ProfileCard from "./ProfileCard.js";

export default function GhostGalleryPreview() {
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

      <div className="profile-grid">
        {historicalProfiles.map((profile) => (
          <ProfileCard key={profile.id} profile={profile} />
        ))}
      </div>
    </section>
  );
}
