import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Persona } from "../models/persona.model.js";

interface SeedProfile {
  slug: string;
  name: string;
  shortBio: string;
  biography: string;
  era: string;
  country: string;
  city: string;
  disciplines: string[];
  referenceTitle: string;
  referenceUrl: string;
  recentLegacy?: boolean;
  deathDate?: Date;
}

function make(
  slug: string,
  name: string,
  shortBio: string,
  era: string,
  country: string,
  city: string,
  fields: string,
  biography: string,
  referenceUrl: string,
  referenceTitle?: string,
): SeedProfile {
  return {
    slug, name, shortBio, era, country, city,
    disciplines: fields.split("|"),
    biography: biography.trim(),
    referenceTitle: referenceTitle ?? `${name} — biographical reference`,
    referenceUrl,
  };
}

const archive: SeedProfile[] = [
  make("marie-curie", "Marie Curie",
    "Physicist and chemist whose research on radioactivity transformed science. The first woman to receive a Nobel Prize and the first person to win Nobel Prizes in two scientific fields.",
    "19th–20th century", "Poland / France", "Warsaw",
    "Physics|Chemistry|Radioactivity",
    `Marie Skłodowska Curie was born in Warsaw in 1867 and later moved to Paris to study at the Sorbonne. Working with Pierre Curie, she investigated radioactive materials and helped identify polonium and radium. She shared the 1903 Nobel Prize in Physics and received the 1911 Nobel Prize in Chemistry. During the First World War she helped develop mobile X-ray units for medical use.`,
    "https://www.nobelprize.org/prizes/physics/1903/marie-curie/facts/",
    "Nobel Prize — Marie Curie"),

  make("isaac-newton", "Isaac Newton",
    "English mathematician and physicist whose laws of motion and universal gravitation became foundations of classical mechanics.",
    "17th–18th century", "England", "Woolsthorpe",
    "Physics|Mathematics|Astronomy",
    `Isaac Newton was born in 1642 in Woolsthorpe, England. At Cambridge he developed ideas that became central to calculus, optics and mechanics. His 1687 work Principia Mathematica set out the laws of motion and universal gravitation. He later served as president of the Royal Society and Master of the Royal Mint.`,
    "https://www.britannica.com/biography/Isaac-Newton"),

  make("nikola-tesla", "Nikola Tesla",
    "Inventor and electrical engineer whose work on alternating-current power systems helped shape modern electricity distribution.",
    "19th–20th century", "Serbia / United States", "Smiljan",
    "Electrical engineering|Invention|Physics",
    `Nikola Tesla was born in 1856 in Smiljan, then part of the Austrian Empire. He worked in Europe before moving to the United States in 1884. His work on alternating-current motors and polyphase power systems became important to electrical distribution. He also experimented with wireless transmission, high-frequency electricity and remote control.`,
    "https://www.britannica.com/biography/Nikola-Tesla"),

  make("charles-darwin", "Charles Darwin",
    "Naturalist whose theory of evolution by natural selection transformed biology and the study of life's diversity.",
    "19th century", "England", "Shrewsbury",
    "Biology|Natural history|Evolution",
    `Charles Darwin was born in 1809 in Shrewsbury, England. His voyage aboard HMS Beagle from 1831 to 1836 gave him observations that informed his later work. In On the Origin of Species, published in 1859, he presented evidence for evolution and explained natural selection as a major mechanism of evolutionary change. His work reshaped biological science.`,
    "https://www.britannica.com/biography/Charles-Darwin"),

  make("alan-turing", "Alan Turing",
    "Mathematician and computing pioneer whose theoretical work helped establish computer science and whose wartime codebreaking work contributed to Allied intelligence.",
    "20th century", "United Kingdom", "London",
    "Mathematics|Computer science|Cryptanalysis",
    `Alan Turing was born in London in 1912. In 1936 he described an abstract computing machine that became a foundation of theoretical computer science. During the Second World War he worked at Bletchley Park, contributing to efforts to break German Enigma communications. His later work explored machine intelligence and mathematical biology.`,
    "https://www.britannica.com/biography/Alan-Turing"),

  make("katherine-johnson", "Katherine Johnson",
    "NASA mathematician whose orbital calculations supported early American human spaceflight missions.",
    "20th–21st century", "United States", "White Sulphur Springs",
    "Mathematics|Aerospace|Spaceflight",
    `Katherine Johnson was born in West Virginia in 1918 and showed exceptional mathematical ability from childhood. She joined the National Advisory Committee for Aeronautics, later NASA, in 1953. Her calculations supported the trajectories of Alan Shepard's 1961 flight and John Glenn's orbital mission in 1962. She later worked on Apollo and Space Shuttle programmes.`,
    "https://www.nasa.gov/people/katherine-johnson/"),

  make("rosalind-franklin", "Rosalind Franklin",
    "Chemist and X-ray crystallographer whose research produced crucial evidence about the molecular structure of DNA.",
    "20th century", "United Kingdom", "London",
    "Chemistry|Crystallography|Molecular biology",
    `Rosalind Franklin was born in London in 1920. She trained as a chemist and became an expert in X-ray diffraction. At King's College London, her work on DNA fibres produced important diffraction images and measurements that informed the double-helix model. She later conducted influential research on viruses at Birkbeck College.`,
    "https://www.kcl.ac.uk/people/rosalind-franklin"),

  make("grace-hopper", "Grace Hopper",
    "Computer scientist and US Navy officer who helped develop early programming languages and popularise machine-independent programming.",
    "20th century", "United States", "New York City",
    "Computer science|Programming languages|Military service",
    `Grace Hopper was born in New York in 1906 and earned a doctorate in mathematics from Yale. During the Second World War she joined the US Navy and worked on the Harvard Mark I computer. She helped develop the compiler concept and contributed to COBOL, a language designed to make business programming more accessible. She continued serving in the Navy for decades.`,
    "https://www.britannica.com/biography/Grace-Hopper"),

  make("c-v-raman", "C. V. Raman",
    "Indian physicist who discovered the Raman effect, demonstrating how light changes wavelength when scattered by molecules.",
    "19th–20th century", "India", "Tiruchirappalli",
    "Physics|Optics|Scientific research",
    `Chandrasekhara Venkata Raman was born in 1888 in Tiruchirappalli. His investigations into light scattering led to the discovery announced in 1928 that became known as the Raman effect. He received the 1930 Nobel Prize in Physics, becoming the first Asian scientist to win a Nobel Prize in the sciences. He founded research institutions and mentored generations of Indian scientists.`,
    "https://www.nobelprize.org/prizes/physics/1930/raman/facts/"),

  make("srinivasa-ramanujan", "Srinivasa Ramanujan",
    "Indian mathematician whose original discoveries in number theory, infinite series and continued fractions profoundly influenced modern mathematics.",
    "20th century", "India", "Erode",
    "Mathematics|Number theory|Analysis",
    `Srinivasa Ramanujan was born in 1887 in Erode, India. Largely self-taught, he developed original mathematical results while working in Madras. In 1913 he wrote to G. H. Hardy at Cambridge, beginning a celebrated collaboration. Despite a short life, his work on partitions, modular forms and infinite series remains influential.`,
    "https://www.britannica.com/biography/Srinivasa-Ramanujan"),

  make("homi-bhabha", "Homi J. Bhabha",
    "Theoretical physicist and institution-builder who played a central role in establishing India's nuclear research programme.",
    "20th century", "India", "Mumbai",
    "Physics|Nuclear science|Institution building",
    `Homi Jehangir Bhabha was born in Bombay in 1909. He studied at Cambridge and made important contributions to theoretical physics, including work on cosmic rays and electron-positron interactions. After returning to India, he founded the Tata Institute of Fundamental Research in 1945 and helped shape the country's atomic energy programme.`,
    "https://www.tifr.res.in/"),

  make("kalpana-chawla", "Kalpana Chawla",
    "Indian-born aerospace engineer and NASA astronaut who became the first woman of Indian origin to travel to space.",
    "20th–21st century", "India / United States", "Karnal",
    "Aerospace engineering|Spaceflight|Science",
    `Kalpana Chawla was born in Karnal, India, in 1962. She studied aeronautical engineering in India and the United States before joining NASA's astronaut corps in 1994. She flew aboard Space Shuttle Columbia in 1997 and again in 2003. She and her six crewmates died when Columbia disintegrated during re-entry on 1 February 2003.`,
    "https://www.nasa.gov/people/kalpana-chawla/"),

  make("avicenna", "Avicenna",
    "Persian polymath and physician whose Canon of Medicine and philosophical writings influenced scholarship across several regions for centuries.",
    "10th–11th century", "Persia", "Bukhara region",
    "Medicine|Philosophy|Science",
    `Avicenna, also known as Ibn Sina, was born around 980 in the region of Bukhara. He wrote extensively on medicine, logic, metaphysics and natural philosophy. His Canon of Medicine organised medical knowledge in a systematic form and became an important teaching text in parts of Europe and the Middle East. He died in 1037 in Hamadan.`,
    "https://plato.stanford.edu/entries/ibn-sina/"),

  make("ibn-al-haytham", "Ibn al-Haytham",
    "Scientist and mathematician whose experimental work on optics helped establish important principles of visual science.",
    "10th–11th century", "Iraq / Egypt", "Basra",
    "Optics|Mathematics|Scientific method",
    `Ibn al-Haytham, known in Latin as Alhazen, was born around 965 in Basra. His Book of Optics examined vision, light, reflection and refraction through mathematical analysis and experiment. He challenged earlier theories that assumed the eye emitted rays. His approach became influential in later scientific traditions.`,
    "https://www.britannica.com/biography/Ibn-al-Haytham"),

  make("hypatia", "Hypatia",
    "Mathematician, astronomer and teacher in late antique Alexandria, remembered as a prominent scholar and public intellectual.",
    "4th–5th century", "Roman Egypt", "Alexandria",
    "Mathematics|Astronomy|Philosophy",
    `Hypatia lived in Alexandria in the late fourth and early fifth centuries. The daughter of mathematician Theon, she taught philosophy and mathematics and became a respected public intellectual. Surviving accounts describe her work as a teacher and commentator, although much of her own writing is lost. She was killed in 415 CE during political and religious conflict in the city.`,
    "https://www.britannica.com/biography/Hypatia"),

  make("william-shakespeare", "William Shakespeare",
    "English playwright and poet whose tragedies, comedies and histories became central to world literature and theatre.",
    "16th–17th century", "England", "Stratford-upon-Avon",
    "Literature|Theatre|Poetry",
    `William Shakespeare was born in Stratford-upon-Avon in 1564; the exact day is not documented, though he was baptised on 26 April. He worked in London as an actor and playwright and was associated with the Lord Chamberlain's Men, later the King's Men. His plays include Hamlet, Macbeth, Othello and A Midsummer Night's Dream. He died in 1616.`,
    "https://www.shakespeare.org.uk/explore-shakespeare/shakespedia/william-shakespeare/"),

  make("leonardo-da-vinci", "Leonardo da Vinci",
    "Renaissance artist, engineer and investigator whose paintings and notebooks reveal an unusually broad curiosity about art, anatomy and mechanics.",
    "15th–16th century", "Italy", "Vinci",
    "Art|Engineering|Anatomy|Invention",
    `Leonardo da Vinci was born in 1452 near Vinci in Tuscany. He trained in Florence and worked for patrons in Milan, Rome and France. His paintings include the Mona Lisa and The Last Supper. His notebooks contain observations and designs involving anatomy, flight, water, machines and the natural world.`,
    "https://www.britannica.com/biography/Leonardo-da-Vinci"),

  make("frida-kahlo", "Frida Kahlo",
    "Mexican painter known for intensely personal self-portraits exploring identity, the body, pain and Mexican culture.",
    "20th century", "Mexico", "Coyoacán",
    "Painting|Modern art|Culture",
    `Frida Kahlo was born in 1907 in Coyoacán, Mexico City. A serious bus accident in 1925 caused lifelong injuries and influenced the subjects of many of her paintings. Her work drew on Mexican popular culture, symbolism and personal experience. She was married to muralist Diego Rivera and became internationally recognised after her death in 1954.`,
    "https://www.britannica.com/biography/Frida-Kahlo"),

  make("wolfgang-amadeus-mozart", "Wolfgang Amadeus Mozart",
    "Austrian composer whose operas, symphonies, concertos and chamber music became central works of the Classical period.",
    "18th century", "Austria", "Salzburg",
    "Music|Composition|Opera",
    `Wolfgang Amadeus Mozart was born in Salzburg in 1756. A child prodigy, he performed across Europe before establishing himself as a composer and musician in Vienna. His works include The Marriage of Figaro, Don Giovanni, The Magic Flute and more than forty symphonies. He died in Vienna in 1791 at age 35.`,
    "https://www.britannica.com/biography/Wolfgang-Amadeus-Mozart"),

  make("ludwig-van-beethoven", "Ludwig van Beethoven",
    "German composer whose music bridged the Classical and Romantic periods and expanded the scale and emotional range of symphonic composition.",
    "18th–19th century", "Germany", "Bonn",
    "Music|Composition|Piano",
    `Ludwig van Beethoven was born in Bonn in 1770 and built his career in Vienna. His works include nine symphonies, piano concertos, string quartets and piano sonatas. He experienced progressive hearing loss yet continued composing major works, including the Ninth Symphony. He died in Vienna in 1827.`,
    "https://www.beethoven.de/en/"),

  make("rabindranath-tagore", "Rabindranath Tagore",
    "Bengali poet, novelist, composer and educator who became the first non-European Nobel laureate in Literature.",
    "19th–20th century", "India", "Kolkata",
    "Literature|Poetry|Music|Education",
    `Rabindranath Tagore was born in Calcutta in 1861. He wrote poetry, fiction, essays, plays and songs, and composed what became the national anthems of India and Bangladesh. His Gitanjali poems helped earn him the 1913 Nobel Prize in Literature. He founded the school at Santiniketan, which developed into Visva-Bharati University.`,
    "https://www.nobelprize.org/prizes/literature/1913/tagore/facts/"),

  make("rumi", "Rumi",
    "13th-century Persian-language poet and Sufi thinker whose works explore love, spiritual transformation and the search for the divine.",
    "13th century", "Persia / Anatolia", "Balkh",
    "Poetry|Philosophy|Sufism",
    `Jalal al-Din Muhammad Rumi was born in 1207, probably in the region of Balkh. He later settled in Konya, where he taught and wrote. His major work, the Masnavi, is a long Persian poem combining stories, spiritual reflection and moral teaching. His poetry has been read and translated across many languages.`,
    "https://www.britannica.com/biography/Jalal-al-Din-al-Rumi"),

  make("jane-austen", "Jane Austen",
    "English novelist whose precise, witty fiction examined marriage, class, money and women's choices in Georgian society.",
    "18th–19th century", "England", "Steventon",
    "Literature|Fiction|Social history",
    `Jane Austen was born in 1775 in Steventon, Hampshire. Her novels include Pride and Prejudice, Sense and Sensibility, Emma and Persuasion. She wrote about family life, social status, money and marriage with irony and close attention to character. Her novels were published anonymously during her lifetime. She died in 1817.`,
    "https://janeaustens.house/"),

  make("mahatma-gandhi", "Mahatma Gandhi",
    "Indian independence leader who advanced nonviolent civil disobedience and mass political mobilisation against colonial rule.",
    "19th–20th century", "India", "Porbandar",
    "Politics|Civil rights|Nonviolence",
    `Mohandas Karamchand Gandhi was born in Porbandar in 1869. After studying law in London, he worked in South Africa, where he developed methods of satyagraha, or nonviolent resistance. He became a leading figure in India's independence movement and organised campaigns including the Salt March of 1930. He was assassinated in 1948.`,
    "https://www.gandhiheritageportal.org/"),

  make("nelson-mandela", "Nelson Mandela",
    "South African anti-apartheid leader who became the country's first democratically elected president in 1994.",
    "20th–21st century", "South Africa", "Mvezo",
    "Politics|Human rights|Reconciliation",
    `Nelson Rolihlahla Mandela was born in 1918 in Mvezo, South Africa. He joined the African National Congress and became a prominent opponent of apartheid. After the Rivonia Trial he spent 27 years in prison before his release in 1990. He shared the 1993 Nobel Peace Prize and served as president of South Africa from 1994 to 1999.`,
    "https://www.nelsonmandela.org/content/page/biography"),

  make("martin-luther-king-jr", "Martin Luther King Jr.",
    "American Baptist minister and civil rights leader who advocated nonviolent resistance to racial segregation and discrimination.",
    "20th century", "United States", "Atlanta",
    "Civil rights|Religion|Public speaking",
    `Martin Luther King Jr. was born in Atlanta in 1929. He became a central leader of the US civil rights movement, helping organise the Montgomery bus boycott and the 1963 March on Washington. His leadership and public advocacy helped build support for major civil rights legislation. He received the 1964 Nobel Peace Prize and was assassinated in 1968.`,
    "https://kinginstitute.stanford.edu/king-papers/documents/biography-martin-luther-king-jr"),

  make("rosa-parks", "Rosa Parks",
    "American civil rights activist whose refusal to give up her bus seat in Montgomery became a catalyst for the Montgomery bus boycott.",
    "20th–21st century", "United States", "Tuskegee",
    "Civil rights|Activism|Community organising",
    `Rosa Parks was born in Alabama in 1913. She worked with the NAACP and was active in civil rights organising before her arrest in Montgomery in December 1955 for refusing to surrender her seat on a segregated bus. Her arrest helped spark the Montgomery bus boycott. She continued working for civil rights and received the Presidential Medal of Freedom and Congressional Gold Medal.`,
    "https://www.nps.gov/people/rosa-parks.htm"),

  make("harriet-tubman", "Harriet Tubman",
    "Abolitionist and humanitarian who escaped enslavement and repeatedly helped others reach freedom through the Underground Railroad.",
    "19th century", "United States", "Dorchester County",
    "Abolitionism|Human rights|Military history",
    `Harriet Tubman was born into slavery in Maryland, probably in the early 1820s. After escaping in 1849, she returned repeatedly to the South to guide enslaved people to freedom. During the American Civil War she served the Union as a scout, nurse and intelligence operative. Later she supported women's suffrage and established a home for older people.`,
    "https://www.nps.gov/people/harriet-tubman.htm"),

  make("savitribai-phule", "Savitribai Phule",
    "Indian educator and social reformer who helped establish schools for girls and challenged caste and gender discrimination.",
    "19th century", "India", "Naigaon",
    "Education|Social reform|Women's rights",
    `Savitribai Phule was born in Maharashtra in 1831. Alongside her husband Jyotirao Phule, she helped open a school for girls in Pune in 1848. She campaigned for education for women and marginalised communities and worked against caste discrimination. She also supported widows and founded initiatives for vulnerable women. She died in 1897 while helping during a plague outbreak.`,
    "https://www.britannica.com/biography/Savitribai-Phule"),

  make("br-ambedkar", "B. R. Ambedkar",
    "Indian jurist, economist and social reformer who chaired the Constitution's Drafting Committee and campaigned against caste oppression.",
    "20th century", "India", "Mhow",
    "Law|Economics|Social justice|Politics",
    `Bhimrao Ramji Ambedkar was born in 1891 in Mhow, India. He studied at Columbia University and the London School of Economics and became a leading advocate for the rights of oppressed communities. As chair of the Constitution's Drafting Committee, he played a central role in preparing independent India's Constitution. He also served as India's first Law Minister and embraced Buddhism in 1956.`,
    "https://ambedkarfoundation.nic.in/"),

  make("subhas-chandra-bose", "Subhas Chandra Bose",
    "Indian nationalist leader who organised the Indian National Army and sought international support for ending British colonial rule.",
    "20th century", "India", "Cuttack",
    "Politics|Independence movement|Military history",
    `Subhas Chandra Bose was born in Cuttack in 1897. He became a prominent nationalist leader and was elected president of the Indian National Congress in 1938 and 1939. During the Second World War he sought international support for India's independence and reorganised the Indian National Army in Southeast Asia. The circumstances of his reported death in 1945 remain a subject of historical discussion.`,
    "https://www.netaji.org/"),

  make("bhagat-singh", "Bhagat Singh",
    "Indian revolutionary whose writings and role in the anti-colonial movement made him an enduring figure in India's struggle for independence.",
    "20th century", "India", "Banga",
    "Independence movement|Political thought|Writing",
    `Bhagat Singh was born in 1907 in Punjab. Influenced by revolutionary and anti-colonial movements, he joined the Hindustan Socialist Republican Association. He was involved in the 1929 Central Legislative Assembly bombing, intended as a protest, and was tried and executed by the British in 1931. His prison writings and political arguments remain widely discussed.`,
    "https://www.britannica.com/biography/Bhagat-Singh"),

  make("ashoka", "Ashoka",
    "Mauryan emperor whose rule over much of the Indian subcontinent became associated with Buddhist patronage and the promotion of dhamma.",
    "3rd century BCE", "Ancient India", "Pataliputra",
    "History|Governance|Buddhism",
    `Ashoka was a ruler of the Mauryan Empire in the third century BCE. After the Kalinga War, his inscriptions describe remorse over the suffering caused by conquest and a commitment to dhamma, a moral policy emphasising restraint and welfare. He supported Buddhist institutions and communicated royal messages through inscriptions placed across the empire. Details of his early life remain debated.`,
    "https://www.britannica.com/biography/Ashoka"),

  make("akbar", "Akbar",
    "Mughal emperor whose long reign expanded imperial administration and promoted a court culture of religious and intellectual exchange.",
    "16th century", "India", "Umarkot",
    "History|Governance|Military history",
    `Akbar was born in 1542 and became the third Mughal emperor in 1556. His reign saw significant territorial expansion and administrative reforms, including the mansabdari system. He cultivated debate among scholars of different religious traditions and supported art, architecture and translation projects at court. He died in 1605.`,
    "https://www.britannica.com/biography/Akbar"),

  make("rani-lakshmibai", "Rani Lakshmibai",
    "Queen of Jhansi who became one of the best-known leaders of the Indian uprising against British rule in 1857–58.",
    "19th century", "India", "Varanasi",
    "History|Leadership|Military history",
    `Lakshmibai was born Manikarnika Tambe in 1828 and became the queen of Jhansi through marriage. Disputes over succession and British annexation brought her into conflict with colonial authorities. During the uprising of 1857 she led forces defending Jhansi and later fought near Gwalior. She died in battle in June 1858 and became a symbol of resistance.`,
    "https://www.britannica.com/biography/Lakshmi-Bai"),

  make("mother-teresa", "Mother Teresa",
    "Catholic religious sister who founded the Missionaries of Charity and worked with people living in poverty in Kolkata and elsewhere.",
    "20th century", "Albania / India", "Skopje",
    "Humanitarian work|Religion|Social care",
    `Anjezë Gonxhe Bojaxhiu was born in 1910 in Skopje. She joined the Sisters of Loreto and arrived in India in 1929. In 1950 she founded the Missionaries of Charity in Kolkata, an organisation that established homes and services for people in need. She received the 1979 Nobel Peace Prize and died in 1997.`,
    "https://www.nobelprize.org/prizes/peace/1979/teresa/facts/"),

  make("socrates", "Socrates",
    "Athenian philosopher remembered for questioning assumptions and using dialogue to examine ethics, knowledge and civic life.",
    "5th century BCE", "Ancient Greece", "Athens",
    "Philosophy|Ethics|Critical inquiry",
    `Socrates lived in Athens during the fifth century BCE. He left no writings of his own, and most knowledge of his thought comes through works by Plato, Xenophon and other ancient authors. He became associated with a method of questioning that tests definitions and assumptions. In 399 BCE he was tried and executed by the Athenian state.`,
    "https://plato.stanford.edu/entries/socrates/"),

  make("plato", "Plato",
    "Athenian philosopher whose dialogues explored justice, knowledge, political life and the nature of reality.",
    "5th–4th century BCE", "Ancient Greece", "Athens",
    "Philosophy|Political thought|Education",
    `Plato was born around 428 or 427 BCE and became a student of Socrates. His surviving philosophical works are written largely as dialogues, including the Republic, Symposium and Phaedo. He founded the Academy in Athens, an influential centre of philosophical and mathematical study. His ideas shaped later traditions in philosophy and education.`,
    "https://plato.stanford.edu/entries/plato/"),

  make("aristotle", "Aristotle",
    "Greek philosopher whose work ranged across logic, biology, physics, ethics, politics and literary theory.",
    "4th century BCE", "Ancient Greece", "Stagira",
    "Philosophy|Biology|Logic|Politics",
    `Aristotle was born in Stagira in 384 BCE and studied at Plato's Academy in Athens. He later tutored Alexander of Macedon and founded his own school, the Lyceum. His surviving works cover logic, ethics, politics, biology, physics, metaphysics and poetry. His writings influenced scholarship across Europe, North Africa and the Middle East.`,
    "https://plato.stanford.edu/entries/aristotle/"),

  make("confucius", "Confucius",
    "Chinese teacher and philosopher whose teachings on ethics, family, learning and public responsibility shaped East Asian traditions.",
    "6th–5th century BCE", "China", "Qufu",
    "Philosophy|Ethics|Education|Governance",
    `Confucius, known in Chinese as Kongzi, lived from 551 to 479 BCE. Later followers collected sayings and conversations associated with him in the Analects. His teachings emphasised moral cultivation, respect within relationships, ritual, learning and ethical government. Confucian traditions became deeply influential in Chinese political and educational life.`,
    "https://plato.stanford.edu/entries/confucius/"),

  make("archimedes", "Archimedes",
    "Ancient Greek mathematician and engineer whose work on geometry, mechanics and hydrostatics became foundational to later science.",
    "3rd century BCE", "Ancient Greece", "Syracuse",
    "Mathematics|Engineering|Physics",
    `Archimedes lived in Syracuse in the third century BCE. He developed mathematical methods for calculating areas and volumes and studied levers, centres of gravity and floating bodies. Ancient accounts credit him with engineering devices used in Syracuse's defence, though some stories are embellished. He died during the Roman capture of Syracuse in 212 BCE.`,
    "https://mathshistory.st-andrews.ac.uk/Biographies/Archimedes/"),

  make("euclid", "Euclid",
    "Ancient Greek mathematician whose Elements organised geometry and number theory into a systematic deductive framework.",
    "3rd century BCE", "Ancient Greece", "Alexandria",
    "Mathematics|Geometry|Logic",
    `Euclid taught in Alexandria around 300 BCE. His Elements arranged geometric knowledge into definitions, postulates and propositions proved through logical argument. The work became one of the most influential mathematical texts in history and shaped the teaching of geometry for centuries. Little is known about Euclid's personal life.`,
    "https://mathshistory.st-andrews.ac.uk/Biographies/Euclid/"),

  make("cleopatra-vii", "Cleopatra VII",
    "Last active ruler of the Ptolemaic Kingdom of Egypt, known for her political alliances with Julius Caesar and Mark Antony.",
    "1st century BCE", "Ptolemaic Egypt", "Alexandria",
    "History|Politics|Diplomacy",
    `Cleopatra VII became queen of Egypt in 51 BCE, ruling initially with her brother Ptolemy XIII. She formed a political and personal alliance with Julius Caesar and later allied with Mark Antony. Their defeat by Octavian at Actium in 31 BCE ended her rule. She died in 30 BCE, after which Egypt became a Roman province.`,
    "https://www.britannica.com/biography/Cleopatra-queen-of-Egypt"),

  make("florence-nightingale", "Florence Nightingale",
    "British nurse, statistician and reformer whose work helped transform hospital sanitation, nursing education and public health.",
    "19th century", "United Kingdom", "Florence",
    "Nursing|Statistics|Public health",
    `Florence Nightingale was born in 1820 in Florence, Italy, to a British family. During the Crimean War she organised nursing care at the British military hospital in Scutari. She used statistical analysis and visual presentation to argue for sanitary reform. In 1860 she helped establish a professional nursing school at St Thomas' Hospital in London.`,
    "https://www.florence-nightingale.co.uk/"),

  make("emily-dickinson", "Emily Dickinson",
    "American poet whose compressed language, striking imagery and unconventional punctuation helped reshape modern poetry.",
    "19th century", "United States", "Amherst",
    "Poetry|Literature",
    `Emily Dickinson was born in Amherst, Massachusetts, in 1830. She lived much of her life in her family home and wrote nearly 1,800 poems, most of which were unpublished during her lifetime. Her poetry explored death, nature, faith, consciousness and personal experience through compressed language and unusual form. A substantial body of her work appeared after her death in 1886.`,
    "https://www.emilydickinsonmuseum.org/"),

  make("vincent-van-gogh", "Vincent van Gogh",
    "Dutch Post-Impressionist painter whose expressive colour and brushwork influenced modern art.",
    "19th century", "Netherlands", "Zundert",
    "Painting|Modern art",
    `Vincent van Gogh was born in the Netherlands in 1853. He began painting seriously in adulthood and produced more than 2,000 artworks, including about 860 oil paintings. Works such as Sunflowers, The Bedroom and The Starry Night are recognised for expressive colour and brushwork. He died in France in 1890.`,
    "https://www.vangoghmuseum.nl/en"),

  make("benjamin-franklin", "Benjamin Franklin",
    "American printer, writer, scientist and diplomat who helped shape the founding of the United States.",
    "18th century", "British America / United States", "Boston",
    "Science|Politics|Writing|Diplomacy",
    `Benjamin Franklin was born in Boston in 1706. He became a successful printer and publisher before gaining recognition for experiments involving electricity. He helped draft and secure support for the Declaration of Independence and later served as a diplomat in France, helping obtain crucial French support during the American Revolution. He was also involved in civic projects, libraries and scientific societies.`,
    "https://www.fi.edu/benjamin-franklin"),

];

const recent: SeedProfile[] = [
  {
    ...make(
      "miso-kovac",
      "Mišo Kovač",
      "Croatian singer whose powerful voice and decades-long career made him one of the most recognisable performers in Croatian popular music.",
      "20th–21st century",
      "Croatia",
      "Šibenik",
      "Music|Popular culture|Performance",
      `Mate Mišo Kovač was born in Šibenik on 16 July 1941. He began his recording career in the early 1960s and became one of Croatia's best-known popular singers. His repertoire and distinctive stage presence connected with audiences across generations. His career included more than thirty albums and songs that became part of Croatian popular music. He died on 31 October 2026.`,
      "https://glashrvatske.hrt.hr/en/culture/goodbye-miso-the-voice-that-united-generations-of-croats-12986053",
      "HRT — Goodbye, Mišo! The voice that united generations of Croats",
    ),
    recentLegacy: true,
    deathDate: new Date("2026-10-31T00:00:00.000Z"),
  },
  {
    ...make(
      "william-nordhaus",
      "William Nordhaus",
      "American economist and Nobel laureate whose work integrated climate change into long-run economic analysis.",
      "20th–21st century",
      "United States",
      "Albuquerque",
      "Economics|Climate change|Public policy",
      `William D. Nordhaus was an economist and Sterling Professor at Yale University. His research examined economic growth, technological change and the costs and benefits of climate policy. He developed influential integrated assessment models linking economic activity and climate systems. He received the 2018 Nobel Prize in Economic Sciences for integrating climate change into long-run macroeconomic analysis. He died on 30 October 2026.`,
      "https://news.yale.edu/2026/10/30/william-nordhaus-nobel-laureate-who-integrated-economics-and-climate-change-devoted-yale",
      "Yale News — William Nordhaus, Nobel laureate",
    ),
    recentLegacy: true,
    deathDate: new Date("2026-10-30T00:00:00.000Z"),
  },
  {
    ...make(
      "jean-claude-passeron",
      "Jean-Claude Passeron",
      "French sociologist whose work with Pierre Bourdieu helped shape the sociology of education and social reproduction.",
      "20th–21st century",
      "France",
      "Nice",
      "Sociology|Education|Social theory",
      `Jean-Claude Passeron was a French sociologist and academic. His work with Pierre Bourdieu, including Les Héritiers and La Reproduction, examined how education systems and cultural institutions can reproduce social inequalities. He also wrote on sociological reasoning, methodology and the interpretation of social evidence. He died during the night of 29–30 October 2026.`,
      "https://www.lemonde.fr/societe/article/2026/10/31/jean-claude-passeron-sociologue-specialiste-de-l-education-est-mort_6803480_3224.html",
      "Le Monde — Jean-Claude Passeron, sociologist",
    ),
    recentLegacy: true,
    deathDate: new Date("2026-10-30T00:00:00.000Z"),
  },
  {
    ...make(
      "patrick-stewart",
      "Patrick Stewart",
      "English actor celebrated for Shakespearean theatre, Captain Jean-Luc Picard in Star Trek and Professor Charles Xavier in the X-Men films.",
      "20th–21st century",
      "United Kingdom",
      "Mirfield",
      "Acting|Theatre|Film|Television",
      `Patrick Stewart was born in Mirfield, Yorkshire, in 1940. He spent nearly two decades with the Royal Shakespeare Company, performing in major classical roles before becoming internationally known as Captain Jean-Luc Picard in Star Trek: The Next Generation. He also portrayed Professor Charles Xavier in the X-Men films. His career spanned theatre, television, film and voice work. He died on 28 October 2026.`,
      "https://www.washingtonpost.com/obituaries/2026/10/29/patrick-stewart-shakespearean-actor-star-trek-star-dies-86/",
      "The Washington Post — Patrick Stewart obituary",
    ),
    recentLegacy: true,
    deathDate: new Date("2026-10-28T00:00:00.000Z"),
  },
  {
    ...make(
      "dolores-huerta",
      "Dolores Huerta",
      "American labour leader and civil rights activist who co-founded the United Farm Workers and championed farmworker and women's rights.",
      "20th–21st century",
      "United States",
      "Dawson",
      "Labour rights|Civil rights|Community organising",
      `Dolores Clara Fernández Huerta was born in 1930 in Dawson, New Mexico. She co-founded the United Farm Workers with César Chávez and helped organise campaigns for better wages, safer working conditions and collective bargaining for agricultural workers. Her rallying phrase "Sí, se puede" became widely associated with grassroots organising. She received the Presidential Medal of Freedom in 2012 and remained active in public advocacy into her later years. She died on 28 October 2026.`,
      "https://www.washingtonpost.com/local/obituaries/2026/10/28/dolores-huerta-dies/75ca979c-d2e8-11f1-9931-2a41b76fc976_story.html",
      "The Washington Post / Associated Press — Dolores Huerta obituary",
    ),
    recentLegacy: true,
    deathDate: new Date("2026-10-28T00:00:00.000Z"),
  },
];

async function seedExpansion(): Promise<void> {
  await connectDatabase();

  console.info(`[Archive] Adding ${archive.length} historical profiles.`);
  console.info(`[Recent Legacies] Adding ${recent.length} profiles.`);

  for (const item of [...archive, ...recent]) {
    const { referenceTitle, referenceUrl, ...fields } = item;

    await Persona.updateOne(
      { slug: item.slug },
      {
        $set: {
          ...fields,
          featured: false,
          status: "published",
          sources: [
            {
              title: referenceTitle,
              url: referenceUrl,
              sourceType: "reference",
            },
          ],
        },
      },
      { upsert: true },
    );

    console.info(`[Seed] ${item.name}`);
  }

  console.info("\n[Seed complete]");
  console.info(`Historical archive additions: ${archive.length}`);
  console.info(`Recent Legacies: ${recent.length}`);
  console.info(`Expected core gallery total: ${archive.length + 3}`);
}

seedExpansion()
  .catch((error: unknown) => {
    console.error("[Archive seed failed]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
