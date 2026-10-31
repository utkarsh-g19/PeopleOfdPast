import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Persona } from "../models/persona.model.js";

interface WikiSummary {
  type?: string;
  title?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
}

interface CommonsImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: string }>;
}

interface CommonsPage {
  title?: string;
  imageinfo?: CommonsImageInfo[];
}

interface CommonsResponse {
  query?: { pages?: Record<string, CommonsPage> };
}

interface PortraitResult {
  url: string;
  credit: string;
  sourceUrl: string;
}

const manualCommonsFiles: Record<string, string> = {
  "hypatia": "Hypatia portrait.png",
  "leonardo-da-vinci": "Leonardo da Vinci - presumed self-portrait - WGA12798.jpg",
  "jane-austen": "Jane Austen Portrait.jpg",
  "mother-teresa": "Mother Teresa.jpg",
  "euclid": "Euclid by Andre Thevet 1584.webp",
  "cleopatra-vii": "CleopatraVII.jpg",
  "benjamin-franklin": "Joseph Siffrein Duplessis - Benjamin Franklin - Google Art Project.jpg",
};

const manualCredits: Record<string, string> = {
  "hypatia": "Jules Maurice Gaspard, imagined portrait (1908) · Wikimedia Commons",
  "leonardo-da-vinci": "Presumed self-portrait · attribution debated · Wikimedia Commons",
  "jane-austen": "Cassandra Austen · Wikimedia Commons · Public domain",
  "mother-teresa": "Evert Odekerken · CC BY 2.5 · Wikimedia Commons",
  "euclid": "André Thevet (1584) · historical depiction · Wikimedia Commons",
  "cleopatra-vii": "Coin of Cleopatra VII · Wikimedia Commons",
  "benjamin-franklin": "Joseph Siffrein Duplessis · Wikimedia Commons",
};

const USER_AGENT =
  "PeopleOfdPast/1.0 (historical portrait archive; educational project)";

const titleOverrides: Record<string, string> = {
  "c-v-raman": "C. V. Raman",
  "homi-bhabha": "Homi J. Bhabha",
  "miso-kovac": "Mišo Kovač",
  "jean-claude-passeron": "Jean-Claude Passeron",
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function cleanMetadata(value?: string): string {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeCredit(info?: CommonsImageInfo | null): string {
  const metadata = info?.extmetadata ?? {};
  const artist = cleanMetadata(
    metadata.Artist?.value || metadata.Credit?.value,
  );
  const license = cleanMetadata(metadata.LicenseShortName?.value);

  return [artist, license, "Wikimedia Commons"]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 220);
}

function imageSource(info?: CommonsImageInfo | null, fallback = ""): string {
  return info?.descriptionurl || fallback;
}

async function getCommonsFileInfo(
  imageUrl: string,
): Promise<CommonsImageInfo | null> {
  try {
    const pathname = new URL(imageUrl).pathname;
    let filename = decodeURIComponent(pathname.split("/").pop() ?? "");
    filename = filename.replace(/^\d+px-/, "");

    if (!filename || filename.includes("/")) return null;

    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      prop: "imageinfo",
      titles: `File:${filename}`,
      iiprop: "url|extmetadata",
      iiurlwidth: "640",
    });

    const result = await fetchJson<CommonsResponse>(
      `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
    );

    const pages = Object.values(result?.query?.pages ?? {});
    return pages.find((page) => page.imageinfo?.length)?.imageinfo?.[0] ?? null;
  } catch {
    return null;
  }
}

async function getCommonsFileByTitle(
  fileTitle: string,
): Promise<CommonsImageInfo | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    prop: "imageinfo",
    titles: `File:${fileTitle}`,
    iiprop: "url|extmetadata",
    iiurlwidth: "640",
  });

  const result = await fetchJson<CommonsResponse>(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
  );

  const pages = Object.values(result?.query?.pages ?? {});
  return pages.find((page) => page.imageinfo?.length)?.imageinfo?.[0] ?? null;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function searchCommons(name: string): Promise<PortraitResult | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: `"${name}"`,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "640",
  });

  const result = await fetchJson<CommonsResponse>(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
  );

  const pages = Object.values(result?.query?.pages ?? {});
  const tokens = normalize(name)
    .split(" ")
    .filter((token) => token.length > 2 && !["the", "and"].includes(token));

  const candidates = pages
    .filter((page) => page.imageinfo?.[0]?.thumburl)
    .map((page) => {
      const info = page.imageinfo![0];
      const description = cleanMetadata(
        info.extmetadata?.ImageDescription?.value,
      );
      const searchable = normalize(`${page.title ?? ""} ${description}`);
      const matches = tokens.filter((token) => searchable.includes(token));
      return {
        info,
        score: tokens.length ? matches.length / tokens.length : 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (!best || best.score < 0.34 || !best.info.thumburl) return null;

  return {
    url: best.info.thumburl,
    credit: makeCredit(best.info),
    sourceUrl: best.info.descriptionurl || "https://commons.wikimedia.org/",
  };
}

async function findPortrait(
  slug: string,
  name: string,
): Promise<PortraitResult | null> {
  const manualFile = manualCommonsFiles[slug];

  if (manualFile) {
    const info = await getCommonsFileByTitle(manualFile);
    const imageUrl = info?.thumburl || info?.url;

    if (imageUrl) {
      return {
        url: imageUrl,
        credit: manualCredits[slug] || makeCredit(info),
        sourceUrl: info?.descriptionurl || "https://commons.wikimedia.org/",
      };
    }

    console.log(`[MANUAL FILE NOT FOUND] ${name}: ${manualFile}`);
  }

  const title = titleOverrides[slug] ?? name;
  const encodedTitle = encodeURIComponent(title.replace(/\s+/g, "_"));

  const summary = await fetchJson<WikiSummary>(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
  );

  if (summary?.thumbnail?.source && summary.type !== "disambiguation") {
    const fileUrl =
      summary.originalimage?.source ?? summary.thumbnail.source;
    const info = await getCommonsFileInfo(fileUrl);

    return {
      url: info?.thumburl || summary.thumbnail.source,
      credit: makeCredit(info) || "Wikipedia / Wikimedia Commons",
      sourceUrl:
        imageSource(info, summary.content_urls?.desktop?.page) ||
        "https://www.wikipedia.org/",
    };
  }

  return searchCommons(title);
}
async function main() {
  await connectDatabase();

  try {
    const profiles = await Persona.find({ status: "published" })
      .select("slug name portraitUrl")
      .lean();

    let nextIndex = 0;
    let updated = 0;
    let alreadyHadImages = 0;
    const misses: string[] = [];

    async function worker() {
      while (true) {
        const index = nextIndex++;
        if (index >= profiles.length) return;

        const profile = profiles[index];

        try {
          if (profile.portraitUrl) {
            const info = await getCommonsFileInfo(profile.portraitUrl);

            if (info) {
              await Persona.updateOne(
                { slug: profile.slug },
                {
                  $set: {
                    portraitCredit: makeCredit(info),
                    portraitSourceUrl:
                      info.descriptionurl || "https://commons.wikimedia.org/",
                  },
                },
              );
            }

            alreadyHadImages++;
            console.log(`[KEPT] ${profile.name}`);
            continue;
          }

          const portrait = await findPortrait(profile.slug, profile.name);

          if (!portrait) {
            misses.push(profile.name);
            console.log(`[NO MATCH] ${profile.name}`);
            continue;
          }

          await Persona.updateOne(
            { slug: profile.slug },
            {
              $set: {
                portraitUrl: portrait.url,
                portraitCredit: portrait.credit,
                portraitSourceUrl: portrait.sourceUrl,
              },
            },
          );

          updated++;
          console.log(`[ADDED] ${profile.name}`);
        } catch (error) {
          misses.push(profile.name);
          console.error(
            `[ERROR] ${profile.name}:`,
            error instanceof Error ? error.message : error,
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 180));
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(4, Math.max(1, profiles.length)) },
        () => worker(),
      ),
    );

    console.log("\n========== PORTRAIT BACKFILL ==========");
    console.log(`Profiles checked: ${profiles.length}`);
    console.log(`New portraits added: ${updated}`);
    console.log(`Existing portraits kept: ${alreadyHadImages}`);
    console.log(`Still needing manual review: ${misses.length}`);

    if (misses.length) {
      console.log("\nProfiles needing manual image selection:");
      misses.forEach((name) => console.log(`- ${name}`));
    }
  } finally {
    await disconnectDatabase();
  }
}

void main();


