import { useMemo, useState } from "react";
import { useHistoricalProfiles } from "../features/ghost-gallery/hooks/useHistoricalProfiles.js";
import ProfileCard from "../features/ghost-gallery/components/ProfileCard.js";
import RecentLegacies from "../features/ghost-gallery/components/RecentLegacies.js";

export default function GhostGalleryPage() {
  const { profiles, loading, error } = useHistoricalProfiles();
  const [countryFilter, setCountryFilter] = useState("all");

  const countries = useMemo(() => {
    const values = profiles.flatMap((profile) =>
      (profile.country ?? "")
        .split("/")
        .map((value) => value.trim())
        .filter(Boolean),
    );
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    if (countryFilter === "all") return profiles;

    return profiles.filter((profile) =>
      (profile.country ?? "")
        .split("/")
        .map((value) => value.trim())
        .includes(countryFilter),
    );
  }, [profiles, countryFilter]);

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
            <p>
              {loading
                ? "Loading the collection..."
                : `Showing ${filteredProfiles.length} of ${profiles.length} lives across time.`}
            </p>
          </div>
        </div>

        <div className="archive-controls">
          <label htmlFor="country-filter">FILTER BY COUNTRY</label>
          <select
            id="country-filter"
            value={countryFilter}
            onChange={(event) => setCountryFilter(event.target.value)}
          >
            <option value="all">All countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          {countryFilter !== "all" && (
            <button
              className="clear-country-filter"
              type="button"
              onClick={() => setCountryFilter("all")}
            >
              Clear filter
            </button>
          )}
        </div>

        {loading && <p className="gallery-load-state">Opening the archive...</p>}
        {error && <p className="gallery-load-state" role="alert">{error}</p>}

        {!loading && !error && filteredProfiles.length === 0 && (
          <p className="gallery-load-state">
            No figures found for this country.
          </p>
        )}

        {!loading && !error && filteredProfiles.length > 0 && (
          <div className="profile-grid">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
