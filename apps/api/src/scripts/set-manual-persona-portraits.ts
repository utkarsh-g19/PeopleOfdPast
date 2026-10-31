import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Persona } from "../models/persona.model.js";

const portraits = [
  {
    slug: "jane-austen",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Jane_Austen_Portrait.jpg?width=640",
    credit: "Cassandra Austen · Public domain",
    source: "https://commons.wikimedia.org/wiki/File:Jane_Austen_Portrait.jpg",
  },
  {
    slug: "mother-teresa",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mother_Teresa.jpg?width=640",
    credit: "Evert Odekerken · CC BY 2.5",
    source: "https://commons.wikimedia.org/wiki/File:Mother_Teresa.jpg",
  },
  {
    slug: "cleopatra-vii",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/CleopatraVII.jpg?width=640",
    credit: "PHGCOM · Photograph of a Cleopatra VII coin",
    source: "https://commons.wikimedia.org/wiki/File:CleopatraVII.jpg",
  },
  {
    slug: "euclid",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Euclid_by_Andre_Thevet_1584.webp?width=640",
    credit: "André Thevet, 1584 · Historical depiction",
    source: "https://commons.wikimedia.org/wiki/File:Euclid_by_Andre_Thevet_1584.webp",
  },
  {
    slug: "benjamin-franklin",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Benjamin_Franklin_by_Joseph_Duplessis_1778.jpg?width=640",
    credit: "Joseph-Siffred Duplessis · Public domain portrait",
    source: "https://commons.wikimedia.org/wiki/File:Benjamin_Franklin_by_Joseph_Duplessis_1778.jpg",
  },
];

async function main() {
  await connectDatabase();

  try {
    for (const portrait of portraits) {
      const result = await Persona.updateOne(
        { slug: portrait.slug },
        {
          $set: {
            portraitUrl: portrait.url,
            portraitCredit: portrait.credit,
            portraitSourceUrl: portrait.source,
          },
        },
      );

      console.log(
        result.matchedCount
          ? `[ADDED] ${portrait.slug}`
          : `[NOT FOUND IN DB] ${portrait.slug}`,
      );
    }
  } finally {
    await disconnectDatabase();
  }
}

void main();
