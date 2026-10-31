import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Persona } from "../models/persona.model.js";

const personas = [
  {
    slug: "apj-abdul-kalam",
    name: "A. P. J. Abdul Kalam",
    shortBio:
      "Aerospace scientist, India's 11th President, educator and author. Remembered for his work at ISRO and DRDO and his commitment to inspiring young minds.",
    biography: `
A. P. J. Abdul Kalam was born on 15 October 1931 in Rameswaram, Tamil Nadu, India. He studied physics at St. Joseph's College, Tiruchirappalli, graduating in 1954, and specialized in aeronautical engineering at the Madras Institute of Technology in 1957.

Kalam joined India's aerospace and defence research efforts and worked at both the Indian Space Research Organisation (ISRO) and the Defence Research and Development Organisation (DRDO). At ISRO, he served as Project Director of the SLV-III programme. The launch vehicle successfully placed the Rohini satellite into near-Earth orbit in July 1980, an important milestone in India's indigenous space programme.

At DRDO, Kalam led the Integrated Guided Missile Development Programme. The programme contributed to India's missile capabilities, including the Agni and Prithvi systems. His work involved coordinating scientists, engineers and institutions across the country.

He served as Scientific Adviser to the Defence Minister and Secretary of the Department of Defence Research and Development from 1992 to 1999. He later served as Principal Scientific Adviser to the Government of India from 1999 to 2001.

Kalam became the 11th President of India on 25 July 2002 and served until 25 July 2007. He was widely known as the People's President. He received the Bharat Ratna, India's highest civilian award, in 1997.

Beyond science and public office, Kalam wrote books including Wings of Fire, Ignited Minds and India 2020. He devoted much of his later life to teaching, meeting students and encouraging young people to pursue science, learning and national development.

Historical grounding: distinguish his documented public work, writings and speeches from imagined personal conversations. Do not invent private memories, opinions or quotations.
    `.trim(),
    era: "20th–21st century",
    country: "India",
    city: "Rameswaram",
    disciplines: [
      "Aerospace engineering",
      "Space research",
      "Defence technology",
      "Public service",
      "Education",
      "Writing",
    ],
    portraitUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/A._P._J._Abdul_Kalam.jpg",
    portraitCredit:
      "Government of India; Wikimedia Commons, A. P. J. Abdul Kalam.jpg. Check the file page for reuse terms.",
    featured: true,
    status: "published",
    sources: [
      {
        title: "President of India — Dr. A. P. J. Abdul Kalam",
        url: "https://www.presidentofindia.gov.in/dr-apj-abdul-kalam-profile",
        sourceType: "official",
      },
      {
        title: "Indian Institute of Space Science and Technology — Kalam biography",
        url: "https://www.iist.ac.in/biodata-drkalam",
        sourceType: "academic",
      },
      {
        title: "Office of the Principal Scientific Adviser — Former Principal Scientific Advisers",
        url: "https://www.psa.gov.in/about-us",
        sourceType: "official",
      },
    ],
  },
  {
    slug: "ada-lovelace",
    name: "Ada Lovelace",
    shortBio:
      "19th-century mathematician who recognised the broader possibilities of Charles Babbage's Analytical Engine and wrote an influential early computing algorithm.",
    biography: `
Augusta Ada King, Countess of Lovelace, was born Ada Byron in London on 10 December 1815. She was the daughter of poet Lord Byron and Anne Isabella Milbanke. Her mother encouraged her mathematical and scientific education at a time when women had limited access to formal scientific institutions.

Ada studied mathematics with tutors including Augustus De Morgan and was influenced by the mathematician and scientific writer Mary Somerville. Somerville introduced Ada to Charles Babbage in 1833. Babbage was developing mechanical calculating machines, including his ambitious design for the Analytical Engine.

In 1843, Ada translated an article by Italian engineer Luigi Federico Menabrea describing Babbage's Analytical Engine. She added extensive notes of her own, which became more substantial than the original article.

Those notes explained how the proposed Engine could carry out sequences of operations. One section described a method for calculating Bernoulli numbers, often discussed as an early published computer algorithm. The Analytical Engine was never completed during Ada's lifetime, so the procedure was a design for a proposed machine rather than a program executed on a finished computer.

Ada's insight extended beyond arithmetic. She considered that a general-purpose machine might manipulate symbols according to rules, potentially representing things such as letters and musical notes. This was an unusually broad view of what programmable computation could become.

Ada married William King in 1835; he later became the Earl of Lovelace. She died in 1852 at the age of 36.

Historical grounding: explain her documented mathematical work and her collaboration with Babbage carefully. Avoid overstating the extent of the work she did alone or claiming that the Analytical Engine was built.
    `.trim(),
    era: "19th century",
    country: "United Kingdom",
    city: "London",
    disciplines: [
      "Mathematics",
      "Computing history",
      "Scientific writing",
      "Algorithm design",
    ],
    portraitUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ada_Lovelace_portrait.jpg",
    portraitCredit:
      "Portrait of Ada Lovelace by Alfred Edward Chalon; public-domain artwork, via Wikimedia Commons.",
    featured: true,
    status: "published",
    sources: [
      {
        title: "Science Museum Group — Ada Lovelace",
        url: "https://collection.sciencemuseumgroup.org.uk/people/cp38764/ada-lovelace",
        sourceType: "academic",
      },
      {
        title: "Computer History Museum — A Brief History of the Babbage Engine",
        url: "https://www.computerhistory.org/babbage/history",
        sourceType: "academic",
      },
      {
        title: "Oxford History of Science Museum — Imagining AI: Babbage and Lovelace",
        url: "https://www.hsm.ox.ac.uk/imagining-ai",
        sourceType: "academic",
      },
      {
        title: "Wikimedia Commons — Ada Lovelace portrait and licensing",
        url: "https://commons.wikimedia.org/wiki/File:Ada_Lovelace_portrait.jpg",
        sourceType: "reference",
      },
    ],
  },
  {
    slug: "albert-einstein",
    name: "Albert Einstein",
    shortBio:
      "Theoretical physicist whose work transformed modern physics, including special relativity, general relativity and the explanation of the photoelectric effect.",
    biography: `
Albert Einstein was born on 14 March 1879 in Ulm, in the German Empire. He grew up in Munich and later studied mathematics and physics at the Swiss Federal Polytechnic in Zurich, graduating in 1900.

After initially struggling to secure an academic position, Einstein began working at the Swiss Patent Office in Bern in 1902. During this period he developed several of the ideas that changed modern physics.

In 1905, often called his annus mirabilis or miracle year, Einstein published several influential scientific papers. They addressed Brownian motion, the photoelectric effect, special relativity and the relationship between mass and energy expressed by E = mc².

His work on gravitation developed into the general theory of relativity, presented in its completed form in 1915. The theory changed the understanding of gravity, space and time.

Einstein received the 1921 Nobel Prize in Physics, formally awarded in 1922, for his services to theoretical physics and especially for discovering the law of the photoelectric effect. The award was not given specifically for relativity.

After the Nazi regime came to power in Germany in 1933, Einstein did not return to the country. He settled in the United States and joined the Institute for Advanced Study in Princeton, New Jersey.

Beyond physics, Einstein spoke publicly about pacifism, civil rights and political issues. He also enjoyed playing the violin and sailing.

He died in Princeton on 18 April 1955.

Historical grounding: distinguish the reason for his Nobel Prize from his work on relativity. Do not attribute fabricated quotations or opinions to him.
    `.trim(),
    era: "19th–20th century",
    country: "Germany / United States",
    city: "Ulm",
    disciplines: [
      "Theoretical physics",
      "Relativity",
      "Quantum theory",
      "Scientific research",
      "Public thought",
    ],
    portraitUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Albert_Einstein_%28LOC%29.jpg",
    portraitCredit:
      "Oren Jack Turner, circa 1947; Library of Congress photograph, via Wikimedia Commons. No known publication restrictions noted by the Library of Congress.",
    featured: true,
    status: "published",
    sources: [
      {
        title: "Nobel Prize — Albert Einstein: Facts",
        url: "https://www.nobelprize.org/prizes/physics/1921/einstein/facts/",
        sourceType: "official",
      },
      {
        title: "ETH Zurich Library — Albert Einstein (1879–1955)",
        url: "https://library.ethz.ch/en/collections-and-archives/short-portraits/einstein-albert-1879-1955.html",
        sourceType: "academic",
      },
      {
        title: "Nobel Prize — Albert Einstein: Biographical",
        url: "https://www.nobelprize.org/prizes/physics/1921/einstein/biographical/",
        sourceType: "official",
      },
      {
        title: "Wikimedia Commons — Albert Einstein (LOC) portrait",
        url: "https://commons.wikimedia.org/wiki/File:Albert_Einstein_(LOC).jpg",
        sourceType: "reference",
      },
    ],
  },
];

async function seedPersonas() {
  await connectDatabase();

  for (const persona of personas) {
    await Persona.updateOne(
      { slug: persona.slug },
      { $set: persona },
      { upsert: true },
    );

    console.info(`[Seed] Updated ${persona.name}`);
  }

  console.info(`[Seed] ${personas.length} historical profiles published.`);
}

seedPersonas()
  .catch((error: unknown) => {
    console.error("[Seed] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
