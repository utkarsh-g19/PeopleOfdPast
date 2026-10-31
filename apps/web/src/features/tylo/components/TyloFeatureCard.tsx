import { Link } from "react-router";
import { Heart, LockKeyhole, Sparkles } from "lucide-react";

export default function TyloFeatureCard() {
  return (
    <section className="tylo-section">
      <div className="tylo-copy">
        <span className="eyebrow"><Heart size={15} /> A PRIVATE SPACE</span>

        <h2>Some voices shaped <em>your life.</em></h2>

        <p>
          Preserve stories, letters and memories. Create a personal AI
          companion grounded in the things you choose to share.
        </p>

        <Link to="/tylo" className="primary-button">
          Enter your personal vault <Sparkles size={17} />
        </Link>

        <span className="privacy-note">
          <LockKeyhole size={14} /> Your memories belong to you.
        </span>
      </div>

      <div className="tylo-art" aria-hidden="true">
        <div className="tylo-orb">✦</div>
        <span className="floating-flower">✿</span>
        <span className="floating-star">✧</span>
        <div className="tylo-art-caption">A place for memories</div>
      </div>
    </section>
  );
}
