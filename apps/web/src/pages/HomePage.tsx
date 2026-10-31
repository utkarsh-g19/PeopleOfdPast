import { ArrowDown, Flame, Flower2, Sparkles } from "lucide-react";
import GhostGalleryPreview from "../features/ghost-gallery/components/GhostGalleryPreview.js";
import TyloFeatureCard from "../features/tylo/components/TyloFeatureCard.js";

export default function HomePage() {
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-decoration hero-decoration-left">✦</div>
          <div className="hero-decoration hero-decoration-right">✧</div>

          <div className="fairy-lights">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} />
            ))}
          </div>

          <span className="eyebrow hero-eyebrow">
            <Sparkles size={14} /> THE PAST IS CLOSER THAN YOU THINK
          </span>

          <h1>
            Some voices shaped <em>history.</em>
            <br />
            Some shaped <span>you.</span>
          </h1>

          <p>
            Explore extraordinary lives. Preserve the memories that matter.
            Conversations with the past, in two very different ways.
          </p>

          <div className="hero-actions">
            <a href="#ghost-gallery" className="primary-button">
              Explore the archive <Flame size={17} />
            </a>
            <a href="#tylo" className="secondary-button">
              Discover TYLO
            </a>
          </div>

          <div className="hero-bottom">
            <span><Flower2 size={16} /> TWO WORLDS. ONE PLACE.</span>
            <a href="#ghost-gallery"><ArrowDown size={17} /> SCROLL TO EXPLORE</a>
          </div>

          <div className="pumpkin pumpkin-left">🎃</div>
          <div className="pumpkin pumpkin-right">🎃</div>
        </section>

        <div className="home-content">
          <GhostGalleryPreview />
          <div id="tylo">
            <TyloFeatureCard />
          </div>
        </div>
      </main>
    </>
  );
}
