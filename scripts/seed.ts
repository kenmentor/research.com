/**
 * Seed script: a fully interconnected demo dataset for the research platform.
 *
 * Usage: npm run seed   (requires MONGODB_URI in .env.local)
 *
 * What it creates for the 20 seeded personas:
 *   - profiles with bios, experience, education, grants and remote imagery
 *   - 60 publications with real abstracts, venues, DOIs and tags
 *   - ~30 posts (some with a paper, a link or an image) + reposts
 *   - comments, likes and saves across that activity
 *   - a connection graph: accepted links, pending requests, declines
 *   - follows, blocks, topic follows, 5 message threads, notifications
 *
 * Idempotent and non-destructive: only documents owned by the seeded
 * personas are replaced, so any real account data is left untouched.
 *
 * Sign in as any seeded persona using the dev credentials provider
 * (any email, no password) — the emails are logged at the end.
 */
import { connectDB } from "../lib/db";
import { getEnv } from "../lib/env";
import { computeCompleteness } from "../lib/profile";
import { BlockModel } from "../models/block";
import { CommentModel } from "../models/comment";
import { ConnectionModel, connectionPairKey } from "../models/connection";
import {
  ConversationModel,
  conversationPairKey,
} from "../models/conversation";
import { FollowModel } from "../models/follow";
import { LikeModel } from "../models/like";
import { MessageModel } from "../models/message";
import { NotificationModel } from "../models/notification";
import { PostModel } from "../models/post";
import { ProfileModel } from "../models/profile";
import { PublicationModel } from "../models/publication";
import { SaveModel } from "../models/save";
import { TopicFollowModel } from "../models/topic-follow";
import { UserModel } from "../models/user";

/* ------------------------------------------------------------------ *
 * Deterministic helpers
 * ------------------------------------------------------------------ */

/** Small LCG so every run produces byte-identical demo data. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const NOW = new Date("2026-03-18T12:00:00.000Z");

/** `daysAgo(3, 14)` -> 3 days back at 14:00. */
function daysAgo(days: number, hour = 10, minute = 0): Date {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

/** Randomuser.me portraits are stable, hotlink-friendly and public. */
const portrait = (gender: "men" | "women", n: number) =>
  `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;

/** Picsum returns a real photograph per seed and needs no API key. */
const coverImage = (seed: string) =>
  `https://picsum.photos/seed/${seed}-cover/1200/400`;
const postImage = (seed: string) => `https://picsum.photos/seed/${seed}-post/1000/600`;

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

type Field =
  | "computational-biology"
  | "climate-science"
  | "machine-learning"
  | "neuroscience"
  | "public-health"
  | "materials-science"
  | "economics"
  | "astronomy"
  | "education"
  | "linguistics";

interface PersonaInput {
  username: string;
  displayName: string;
  headline: string;
  affiliation: string;
  location: string;
  bio: string;
  interests: string[];
  field: Field;
  gender: "men" | "women";
  avatarIndex: number;
  experience: Array<{
    title: string;
    organization: string;
    start: string;
    end?: string;
    current?: boolean;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startYear?: number;
    endYear?: number;
  }>;
  grants?: Array<{ title: string; funder: string; year?: number; amount?: string }>;
}

interface Persona extends PersonaInput {
  email: string;
  avatarUrl: string;
  coverUrl: string;
  grants: Array<{ title: string; funder: string; year?: number; amount?: string }>;
}

interface PaperSpec {
  field: Field;
  title: string;
  venue: string;
  year: number;
  doi: string;
  abstract: string;
  tags: string[];
}

interface PostSpec {
  by: string;
  body: string;
  /** Title of an owned publication to attach. */
  paper?: string;
  link?: string;
  image?: string;
  /** Index into the post list to quote-repost. */
  repostOf?: number;
}

function p(x: PersonaInput): Persona {
  return {
    ...x,
    email: `${x.username}@researcher.local`,
    avatarUrl: portrait(x.gender, x.avatarIndex),
    coverUrl: coverImage(x.username),
    grants: x.grants ?? [],
  };
}

/* ------------------------------------------------------------------ *
 * People
 * ------------------------------------------------------------------ */

export const PERSONAS: Persona[] = [
  p({
    username: "amara.okafor",
    displayName: "Amara Okafor",
    headline: "Computational biologist mapping immune responses at single-cell resolution",
    affiliation: "University of Cape Town",
    location: "Cape Town, South Africa",
    bio: "I build reference atlases of human immune cells so that translational findings are reproducible across donors and tissues. Most of my work sits between careful experimental design and the unglamorous statistics that keep a cell atlas honest. I care about datasets that a visiting student can pick up and trust.",
    interests: ["single-cell", "genomics", "gene regulation", "immunology", "machine learning"],
    field: "computational-biology",
    gender: "women",
    avatarIndex: 12,
    experience: [
      {
        title: "Associate Professor of Computational Biology",
        organization: "University of Cape Town",
        start: "2022",
        current: true,
        description: "Leads a group integrating single-cell assays with probabilistic models; supervises six PhD students across two continents.",
      },
      {
        title: "Postdoctoral Fellow",
        organization: "Wellcome Sanger Institute",
        start: "2018",
        end: "2022",
        description: "Developed the donor-aware normalisation methods still used by the consortium.",
      },
    ],
    education: [
      {
        school: "University of Oxford",
        degree: "DPhil",
        field: "Computational Biology",
        startYear: 2013,
        endYear: 2018,
      },
      {
        school: "University of Ibadan",
        degree: "BSc",
        field: "Biochemistry",
        startYear: 2008,
        endYear: 2012,
      },
    ],
    grants: [
      {
        title: "A reference atlas of immune ageing in African cohorts",
        funder: "Wellcome Trust",
        year: 2024,
        amount: "R 18,400,000",
      },
    ],
  }),
  p({
    username: "tobias.lindqvist",
    displayName: "Tobias Lindqvist",
    headline: "Systems biologist working on gene regulatory network inference",
    affiliation: "Karolinska Institutet",
    location: "Stockholm, Sweden",
    bio: "My group asks how a regulatory network behaves when you perturb it in a controlled way. We publish the code and the processed data by default, because a network model nobody can rerun is a story, not a result.",
    interests: ["gene regulation", "single-cell", "perturbation", "systems biology"],
    field: "computational-biology",
    gender: "men",
    avatarIndex: 33,
    experience: [
      {
        title: "Research Scientist, Systems Biology",
        organization: "Karolinska Institutet",
        start: "2021",
        current: true,
        description: "Runs a four-person group focused on perturbation screens and network reconstruction.",
      },
      {
        title: "Doctoral Researcher",
        organization: "ETH Zürich",
        start: "2016",
        end: "2021",
        description: "Thesis on identifiability in linear gene network models.",
      },
    ],
    education: [
      {
        school: "ETH Zürich",
        degree: "PhD",
        field: "Systems Biology",
        startYear: 2016,
        endYear: 2021,
      },
    ],
  }),
  p({
    username: "ingrid.sorensen",
    displayName: "Ingrid Sørensen",
    headline: "Climate scientist working on Arctic biogeochemistry and thaw timing",
    affiliation: "University of Copenhagen",
    location: "Copenhagen, Denmark",
    bio: "I spend a good part of each year on the ice edge, measuring how quickly Arctic catchments are shifting between frozen and active states. Satellite time series let us see the regional pattern; the field measurements keep us honest about what the pixels mean.",
    interests: ["climate", "remote sensing", "cryosphere", "permafrost", "carbon cycle"],
    field: "climate-science",
    gender: "women",
    avatarIndex: 21,
    experience: [
      {
        title: "Associate Professor, Arctic Biogeochemistry",
        organization: "University of Copenhagen",
        start: "2020",
        current: true,
        description: "Coordinates a multi-institution monitoring network across Greenland and Svalbard.",
      },
    ],
    education: [
      {
        school: "University of Cambridge",
        degree: "PhD",
        field: "Earth Sciences",
        startYear: 2011,
        endYear: 2015,
      },
    ],
    grants: [
      {
        title: "Abrupt thaw: observing transitions in Arctic hydrology",
        funder: "European Research Council",
        year: 2023,
        amount: "€ 1,850,000",
      },
    ],
  }),
  p({
    username: "kwame.boateng",
    displayName: "Kwame Boateng",
    headline: "Professor of climate systems modelling for African agriculture",
    affiliation: "University of Ghana",
    location: "Accra, Ghana",
    bio: "My work connects climate projections to decisions farmers actually make. That means downscaling models to field scale, and being honest with policy colleagues when the uncertainty is wider than the question they asked.",
    interests: ["climate", "agriculture", "crop resilience", "monsoon", "hydrology"],
    field: "climate-science",
    gender: "men",
    avatarIndex: 44,
    experience: [
      {
        title: "Professor of Climate Systems",
        organization: "University of Ghana",
        start: "2017",
        current: true,
        description: "Leads the West African Climate Impact Lab, a partnership with five national meteorological services.",
      },
    ],
    education: [
      {
        school: "University of Reading",
        degree: "PhD",
        field: "Climate Science",
        startYear: 2006,
        endYear: 2011,
      },
    ],
  }),
  p({
    username: "priya.raghunathan",
    displayName: "Priya Raghunathan",
    headline: "Machine learning researcher focused on calibration under distribution shift",
    affiliation: "Indian Institute of Science",
    location: "Bengaluru, India",
    bio: "I work on the unglamorous part of deployed models: what happens to their confidence when the population they serve changes. Most of my papers end with a checklist rather than a benchmark, which I consider a success.",
    interests: ["machine learning", "calibration", "reproducibility", "uncertainty"],
    field: "machine-learning",
    gender: "women",
    avatarIndex: 45,
    experience: [
      {
        title: "Assistant Professor, Machine Learning",
        organization: "Indian Institute of Science",
        start: "2022",
        current: true,
        description: "Teaches the graduate reliability course; advises on calibration for three hospital deployments.",
      },
    ],
    education: [
      {
        school: "Carnegie Mellon University",
        degree: "PhD",
        field: "Machine Learning",
        startYear: 2014,
        endYear: 2019,
      },
    ],
    grants: [
      {
        title: "Reliable uncertainty in clinical decision support",
        funder: "Department of Science and Technology",
        year: 2024,
      },
    ],
  }),
  p({
    username: "daniel.okonkwo",
    displayName: "Daniel Okonkwo",
    headline: "Research scientist in responsible AI and dataset documentation",
    affiliation: "Google DeepMind",
    location: "London, United Kingdom",
    bio: "I audit models for social impact and help teams document their datasets properly. Documentation is not paperwork: it is the only thing that lets a stranger in five years understand what your model was trained on.",
    interests: ["machine learning", "ai safety", "reproducibility", "fairness"],
    field: "machine-learning",
    gender: "men",
    avatarIndex: 15,
    experience: [
      {
        title: "Research Scientist, Responsible AI",
        organization: "Google DeepMind",
        start: "2021",
        current: true,
        description: "Builds auditing tools and co-chairs an internal model documentation standard.",
      },
    ],
    education: [
      {
        school: "Imperial College London",
        degree: "MSc",
        field: "Machine Learning",
        startYear: 2014,
        endYear: 2015,
      },
    ],
  }),
  p({
    username: "lucia.fernandez",
    displayName: "Lucía Fernández",
    headline: "Systems neuroscientist tracking cortical dynamics during decisions",
    affiliation: "Universidad de Buenos Aires",
    location: "Buenos Aires, Argentina",
    bio: "I combine simultaneous EEG and fMRI to ask a narrow question well: how does cortex represent confidence in the decision it is currently making. Small samples, careful controls, no causal overclaiming.",
    interests: ["neuroscience", "eeg", "fmri", "cognition"],
    field: "neuroscience",
    gender: "women",
    avatarIndex: 29,
    experience: [
      {
        title: "Associate Professor, Systems Neuroscience",
        organization: "Universidad de Buenos Aires",
        start: "2019",
        current: true,
        description: "Runs a joint EEG-fMRI lab and a summer methods programme for Latin American students.",
      },
    ],
    education: [
      {
        school: "Universidad de Buenos Aires",
        degree: "PhD",
        field: "Neuroscience",
        startYear: 2009,
        endYear: 2015,
      },
    ],
  }),
  p({
    username: "samuel.adeyemi",
    displayName: "Samuel Adeyemi",
    headline: "Neuroimaging scientist studying thalamic gating of working memory",
    affiliation: "University of Ibadan",
    location: "Ibadan, Nigeria",
    bio: "My work sits at the boundary between thalamic circuitry and the cognitive tasks that depend on it. I am interested in how a small structure gates information, and in building imaging protocols that work in settings where scanners are scarce.",
    interests: ["neuroscience", "thalamus", "working memory", "neuroimaging"],
    field: "neuroscience",
    gender: "men",
    avatarIndex: 52,
    experience: [
      {
        title: "Neuroimaging Scientist",
        organization: "University of Ibadan",
        start: "2020",
        current: true,
        description: "Leads a two-scanner facility and a low-field imaging protocol developed for resource-limited sites.",
      },
    ],
    education: [
      {
        school: "University of Cape Town",
        degree: "PhD",
        field: "Cognitive Neuroscience",
        startYear: 2011,
        endYear: 2016,
      },
    ],
  }),
  p({
    username: "fatima.bello",
    displayName: "Fatima Bello",
    headline: "Epidemiologist working on malaria and child health programmes",
    affiliation: "London School of Hygiene & Tropical Medicine",
    location: "Freetown, Sierra Leone",
    bio: "I work with district health teams on the last mile of malaria prevention, where supply chains and trust matter as much as the intervention. Most of my fieldwork is done with local analysts whose names are on the papers.",
    interests: ["public health", "malaria", "health equity", "immunisation", "surveillance"],
    field: "public-health",
    gender: "women",
    avatarIndex: 47,
    experience: [
      {
        title: "Epidemiologist",
        organization: "London School of Hygiene & Tropical Medicine",
        start: "2018",
        current: true,
        description: "Supports four districts in Sierra Leone with routine data systems and coverage evaluation.",
      },
    ],
    education: [
      {
        school: "University of Sierra Leone",
        degree: "MPH",
        field: "Epidemiology",
        startYear: 2010,
        endYear: 2012,
      },
    ],
  }),
  p({
    username: "joseph.mwangi",
    displayName: "Joseph Mwangi",
    headline: "Professor of public health specialising in community case management",
    affiliation: "University of Nairobi",
    location: "Nairobi, Kenya",
    bio: "I evaluate integrated community case management programmes, with an interest in what happens after the pilot funding ends. Retention of community health workers turns out to predict child outcomes better than the intervention itself.",
    interests: ["public health", "health systems", "malaria", "health equity"],
    field: "public-health",
    gender: "men",
    avatarIndex: 11,
    experience: [
      {
        title: "Professor of Public Health",
        organization: "University of Nairobi",
        start: "2015",
        current: true,
        description: "Chairs the department's health systems group and mentors eight graduate researchers.",
      },
    ],
    education: [
      {
        school: "University of Nairobi",
        degree: "PhD",
        field: "Public Health",
        startYear: 2004,
        endYear: 2010,
      },
    ],
  }),
  p({
    username: "yuki.tanaka",
    displayName: "Yuki Tanaka",
    headline: "Materials chemist studying perovskite solar cell degradation",
    affiliation: "University of Tokyo",
    location: "Tokyo, Japan",
    bio: "I want perovskite photovoltaics to stop failing in interesting ways. My group runs damp heat and illumination stress tests for longer than is fashionable, and we publish the failures alongside the record efficiencies.",
    interests: ["materials science", "perovskites", "photovoltaics", "energy materials"],
    field: "materials-science",
    gender: "women",
    avatarIndex: 5,
    experience: [
      {
        title: "Associate Professor, Materials Chemistry",
        organization: "University of Tokyo",
        start: "2019",
        current: true,
        description: "Directs a laboratory of eleven studying degradation mechanisms in emerging photovoltaics.",
      },
    ],
    education: [
      {
        school: "Kyoto University",
        degree: "PhD",
        field: "Materials Chemistry",
        startYear: 2008,
        endYear: 2013,
      },
    ],
    grants: [
      {
        title: "Stability by design in metal halide perovskites",
        funder: "Japan Society for the Promotion of Science",
        year: 2023,
        amount: "¥ 52,000,000",
      },
    ],
  }),
  p({
    username: "marcus.weber",
    displayName: "Marcus Weber",
    headline: "Professor of materials science focused on high-entropy alloys",
    affiliation: "RWTH Aachen University",
    location: "Aachen, Germany",
    bio: "I work on multi-principal-element alloys, using machine learning to narrow composition space before anyone heats a furnace. Additive manufacturing gives us the throughput to test what the models predict.",
    interests: ["materials science", "alloys", "machine learning", "additive manufacturing"],
    field: "materials-science",
    gender: "men",
    avatarIndex: 67,
    experience: [
      {
        title: "Professor of Materials Science",
        organization: "RWTH Aachen University",
        start: "2016",
        current: true,
        description: "Heads the Institute for Materials Chemistry and Machines; co-founded a spin-out for alloy design.",
      },
    ],
    education: [
      {
        school: "TU München",
        degree: "Dr.-Ing.",
        field: "Materials Science",
        startYear: 2003,
        endYear: 2009,
      },
    ],
  }),
  p({
    username: "grace.mwangi",
    displayName: "Grace Mwangi",
    headline: "Development economist studying household resilience in East Africa",
    affiliation: "University of Cape Town",
    location: "Cape Town, South Africa",
    bio: "I study whether digital finance actually makes households more resilient, or merely more observed. Much of my work is careful measurement of money flows that were previously invisible to any dataset.",
    interests: ["economics", "development", "mobile money", "labour markets", "health equity"],
    field: "economics",
    gender: "women",
    avatarIndex: 32,
    experience: [
      {
        title: "Professor of Development Economics",
        organization: "University of Cape Town",
        start: "2018",
        current: true,
        description: "Leads a five-country panel survey on digital finance and household welfare.",
      },
    ],
    education: [
      {
        school: "Harvard University",
        degree: "PhD",
        field: "Economics",
        startYear: 2005,
        endYear: 2011,
      },
    ],
  }),
  p({
    username: "rahul.menon",
    displayName: "Rahul Menon",
    headline: "Economist evaluating cash transfers and firm formation",
    affiliation: "Indian Institute for Human Development",
    location: "Bengaluru, India",
    bio: "I run randomised evaluations of transfer programmes, mostly with small firms. The hardest part is never the treatment; it is measuring whether a new firm would exist anyway.",
    interests: ["economics", "public policy", "labour markets", "development"],
    field: "economics",
    gender: "men",
    avatarIndex: 18,
    experience: [
      {
        title: "Economist, Public Policy",
        organization: "Indian Institute for Human Development",
        start: "2017",
        current: true,
        description: "Directs a portfolio of transfer and credit evaluations across four states.",
      },
    ],
    education: [
      {
        school: "Delhi School of Economics",
        degree: "PhD",
        field: "Economics",
        startYear: 2004,
        endYear: 2010,
      },
    ],
  }),
  p({
    username: "nia.williams",
    displayName: "Nia Williams",
    headline: "Radio astronomer detecting fast radio bursts at scale",
    affiliation: "University of Cape Town",
    location: "Cape Town, South Africa",
    bio: "I work on real-time detection pipelines for fast radio bursts, which means writing code that has to be right on the first try, at 3am, on a noisy signal. I also care a great deal about the data being usable by people who are not me.",
    interests: ["astronomy", "radio astronomy", "machine learning", "time-domain"],
    field: "astronomy",
    gender: "women",
    avatarIndex: 8,
    experience: [
      {
        title: "Astrophysicist, Radio Astronomy",
        organization: "University of Cape Town",
        start: "2020",
        current: true,
        description: "Principal investigator on an FRB detection pipeline shared with three partner observatories.",
      },
    ],
    education: [
      {
        school: "University of Manchester",
        degree: "PhD",
        field: "Radio Astronomy",
        startYear: 2011,
        endYear: 2016,
      },
    ],
  }),
  p({
    username: "carlos.mendes",
    displayName: "Carlos Mendes",
    headline: "Staff astronomer studying galaxy nuclei and stellar populations",
    affiliation: "European Southern Observatory",
    location: "Garching, Germany",
    bio: "I use large spectroscopic surveys to understand how small galaxies grow their central black holes. Much of my time is spent on calibration, which is exactly as unglamorous as it sounds.",
    interests: ["astronomy", "galaxies", "spectroscopy", "exoplanets"],
    field: "astronomy",
    gender: "men",
    avatarIndex: 60,
    experience: [
      {
        title: "Staff Astronomer",
        organization: "European Southern Observatory",
        start: "2016",
        current: true,
        description: "Serves as instrument scientist for a multi-object spectrograph and chairs a working group on data processing.",
      },
    ],
    education: [
      {
        school: "Universidade de Lisboa",
        degree: "PhD",
        field: "Astrophysics",
        startYear: 2005,
        endYear: 2011,
      },
    ],
  }),
  p({
    username: "zainab.yusuf",
    displayName: "Zainab Yusuf",
    headline: "Associate professor of education researching feedback and revision",
    affiliation: "University of Nairobi",
    location: "Nairobi, Kenya",
    bio: "I study what students do after they receive feedback, which is almost never what we assume they do. My classroom work is mostly in undergraduate science, where revision habits are still forming.",
    interests: ["education", "learning sciences", "feedback", "science education"],
    field: "education",
    gender: "women",
    avatarIndex: 38,
    experience: [
      {
        title: "Associate Professor of Education",
        organization: "University of Nairobi",
        start: "2018",
        current: true,
        description: "Coordinates a multi-site classroom study on formative feedback in science.",
      },
    ],
    education: [
      {
        school: "University of Amsterdam",
        degree: "PhD",
        field: "Learning Sciences",
        startYear: 2008,
        endYear: 2014,
      },
    ],
  }),
  p({
    username: "peter.walsh",
    displayName: "Peter Walsh",
    headline: "Senior lecturer in learning sciences and multilingual instruction",
    affiliation: "University of Melbourne",
    location: "Melbourne, Australia",
    bio: "I work with multilingual classrooms, mostly in mathematics and science, and I am sceptical of findings that disappear once you teach the lesson for longer than a workshop. Replication is a design constraint, not a virtue.",
    interests: ["education", "multilingualism", "learning sciences", "assessment"],
    field: "education",
    gender: "men",
    avatarIndex: 24,
    experience: [
      {
        title: "Senior Lecturer, Learning Sciences",
        organization: "University of Melbourne",
        start: "2019",
        current: true,
        description: "Leads a longitudinal study of language of instruction across three school systems.",
      },
    ],
    education: [
      {
        school: "University of Sydney",
        degree: "PhD",
        field: "Education",
        startYear: 2007,
        endYear: 2013,
      },
    ],
  }),
  p({
    username: "amina.traore",
    displayName: "Amina Traoré",
    headline: "Sociolinguist documenting code-switching in urban Senegalese speech",
    affiliation: "Université Cheikh Anta Diop",
    location: "Dakar, Senegal",
    bio: "I build corpora of urban Wolof-French speech with the people who speak it, which means the corpus is as much a community project as a linguistic one. I am interested in what code-switching encodes rather than what it fails at.",
    interests: ["linguistics", "sociolinguistics", "corpus", "multilingualism"],
    field: "linguistics",
    gender: "women",
    avatarIndex: 26,
    experience: [
      {
        title: "Professor of Sociolinguistics",
        organization: "Université Cheikh Anta Diop",
        start: "2014",
        current: true,
        description: "Directs a corpus project with two community language trusts in the Dakar region.",
      },
    ],
    education: [
      {
        school: "Université Paris VII",
        degree: "Doctorat",
        field: "Linguistics",
        startYear: 2001,
        endYear: 2008,
      },
    ],
  }),
  p({
    username: "chen.wei",
    displayName: "Chen Wei",
    headline: "Computational linguist building speech recognition for low-resource languages",
    affiliation: "Peking University",
    location: "Beijing, China",
    bio: "I work on speech and language technology where labelled data simply does not exist. Self-supervised pretraining helps, but the honest answer is still data collection, and I would rather say so than benchmark around it.",
    interests: ["linguistics", "speech recognition", "machine learning", "low-resource"],
    field: "linguistics",
    gender: "men",
    avatarIndex: 73,
    experience: [
      {
        title: "Computational Linguist",
        organization: "Peking University",
        start: "2019",
        current: true,
        description: "Leads a group of seven working on speech recognition for twelve under-resourced languages.",
      },
    ],
    education: [
      {
        school: "Tsinghua University",
        degree: "PhD",
        field: "Computational Linguistics",
        startYear: 2010,
        endYear: 2016,
      },
    ],
  }),
];

/* ------------------------------------------------------------------ *
 * Publications
 * ------------------------------------------------------------------ */

export const PAPERS: PaperSpec[] = [
  // Computational biology
  {
    field: "computational-biology",
    title: "A single-cell atlas of immune responses to seasonal influenza vaccination",
    venue: "Nature Immunology",
    year: 2024,
    doi: "10.1038/s41590-024-01742-1",
    abstract:
      "We profiled 1.2 million peripheral immune cells from 148 donors across three vaccination cohorts to map the kinetics of interferon response and memory B-cell formation. Resolving donor-level variation revealed a myeloid state, absent from bulk studies, that predicts antibody titre eight weeks after immunisation.",
    tags: ["single-cell", "immunology", "genomics"],
  },
  {
    field: "computational-biology",
    title: "Scalable alignment of single-cell transcriptomics across tissues and donors",
    venue: "Genome Biology",
    year: 2023,
    doi: "10.1186/s13059-023-03412-7",
    abstract:
      "Batch correction in single-cell data has historically traded biological signal for visual tidy-ness. We introduce a donor-aware hierarchical model that preserves rare populations while removing technical structure, and show it recovers cell types that standard integration erases.",
    tags: ["single-cell", "genomics", "machine learning"],
  },
  {
    field: "computational-biology",
    title: "Inferring gene regulatory networks from sparse perturbation screens",
    venue: "Cell Systems",
    year: 2025,
    doi: "10.1016/j.cels.2025.01.009",
    abstract:
      "Sparse CRISPR perturbation screens constrain gene regulatory networks more efficiently than dense observational data, but identifiability remains a practical obstacle. We derive conditions under which the network is recoverable and validate the resulting models against 41 published screens.",
    tags: ["gene regulation", "perturbation", "single-cell"],
  },
  {
    field: "computational-biology",
    title: "Benchmarking variant effect predictors on under-represented genome cohorts",
    venue: "Nature Genetics",
    year: 2024,
    doi: "10.1038/s41588-024-01730-y",
    abstract:
      "Variant effect predictors are trained overwhelmingly on European reference panels. We evaluate eleven predictors on 2,400 variants from African genome cohorts and show that calibration error more than doubles in variants carried at higher frequency in these populations.",
    tags: ["genomics", "machine learning", "fairness"],
  },
  {
    field: "computational-biology",
    title: "Protein language models for de novo enzyme design",
    venue: "Nature Biotechnology",
    year: 2025,
    doi: "10.1038/s41587-024-02261-4",
    abstract:
      "We adapt protein language models to propose enzymes for reactions with no natural catalyst, filtering candidates with an active-site geometry constraint. Six of nine designed enzymes showed measurable activity, and the two most active were fully characterised.",
    tags: ["genomics", "machine learning", "protein design"],
  },
  {
    field: "computational-biology",
    title: "Separating cell state from cell identity in Perturb-seq experiments",
    venue: "PLOS Computational Biology",
    year: 2023,
    doi: "10.1371/journal.pcbi.1010714",
    abstract:
      "Perturb-seq conflates a cell's identity with the state induced by a perturbation, and downstream differential expression inherits that confusion. We formalise the confound and propose a design that separates the two factors in a controlled combinatorial screen.",
    tags: ["perturbation", "single-cell", "systems biology"],
  },

  // Climate science
  {
    field: "climate-science",
    title: "Abrupt thaw timing in Greenland outlet glaciers from Sentinel-2 time series",
    venue: "The Cryosphere",
    year: 2024,
    doi: "10.5194/tc-18-1105-2024",
    abstract:
      "Daily Sentinel-2 imagery resolves the onset of surface melt on four outlet glaciers to within three days. Thaw onset now clusters tightly with basal hydrology rather than air temperature, implying that drainage events trigger rather than follow the melt season.",
    tags: ["cryosphere", "remote sensing", "climate"],
  },
  {
    field: "climate-science",
    title: "Monsoon onset variability and smallholder yield in the Sudano-Sahel",
    venue: "Nature Climate Change",
    year: 2023,
    doi: "10.1038/s41558-023-01621-4",
    abstract:
      "Linking 38 years of satellite rainfall onset dates to 62,000 smallholder harvest records, we find that yield sensitivity to a delayed onset is concentrated in the first three weeks after planting. Late onset is a better predictor of loss than total seasonal rainfall.",
    tags: ["monsoon", "agriculture", "remote sensing", "climate"],
  },
  {
    field: "climate-science",
    title: "Bias-corrected downscaling of CMIP6 for African agro-ecological zones",
    venue: "Journal of Climate",
    year: 2025,
    doi: "10.1175/JCLI-D-24-0417.1",
    abstract:
      "We present a quantile-mapping workflow that preserves temporal dependence and skew, and apply it to 24 CMIP6 models across nine agro-ecological zones. Corrected ensembles reproduce observed yield variance substantially better than raw projections.",
    tags: ["climate", "agriculture", "hydrology"],
  },
  {
    field: "climate-science",
    title: "Methane emissions from West African wetlands reconciled with satellite retrievals",
    venue: "Atmospheric Chemistry and Physics",
    year: 2024,
    doi: "10.5194/acp-24-8871-2024",
    abstract:
      "Chamber measurements and airborne campaigns disagree with satellite retrievals by a factor of two across flooded inland deltas. We attribute most of the gap to canopy reabsorption and propose a correction that brings ground and remote estimates into agreement.",
    tags: ["carbon cycle", "remote sensing", "climate"],
  },
  {
    field: "climate-science",
    title: "Frequency and future risk of compound heat and drought events in the Sahel",
    venue: "Environmental Research Letters",
    year: 2025,
    doi: "10.1088/1748-9326/ad9f22",
    abstract:
      "Using 70 years of station records, we show compound heat and drought events have increased five-fold since 1950. Regional climate model ensembles project a further tripling by 2050, with the highest exposure falling on pastoralist communities.",
    tags: ["climate", "agriculture", "hydrology"],
  },
  {
    field: "climate-science",
    title: "Sea-level rise exposure modelling for twelve delta megacities",
    venue: "Nature Sustainability",
    year: 2023,
    doi: "10.1038/s41893-023-01074-5",
    abstract:
      "We combine subsidence measurements, adaptive capacity indicators and 2100 sea-level projections to rank flood exposure across twelve megacities. The spread in outcomes between optimistic and pessimistic subsidence assumptions exceeds the spread attributable to sea level itself.",
    tags: ["climate", "hydrology", "remote sensing"],
  },

  // Machine learning
  {
    field: "machine-learning",
    title: "Calibration under distribution shift: a framework for clinical deployment",
    venue: "NeurIPS",
    year: 2024,
    doi: "10.5555/3692070.3694488",
    abstract:
      "Models that are well calibrated on their development cohort lose calibration quickly once the patient population changes. We derive a monitoring procedure that detects calibration failure from routine outcome data alone, without a labelled shift set.",
    tags: ["machine learning", "calibration", "uncertainty"],
  },
  {
    field: "machine-learning",
    title: "Sparse mixture-of-experts routing for low-resource language modelling",
    venue: "ACL",
    year: 2025,
    doi: "10.18653/v1/2025.acl-long.412",
    abstract:
      "Routing every token to a large model is wasteful for languages with limited parallel data. We show that a sparse router trained on perplexity alone recovers much of the quality of full routing at a fraction of the compute, and analyse where routing fails.",
    tags: ["machine learning", "low-resource", "uncertainty"],
  },
  {
    field: "machine-learning",
    title: "Auditing demographic parity in clinical risk models across health systems",
    venue: "Nature Medicine",
    year: 2024,
    doi: "10.1038/s41591-024-03221-7",
    abstract:
      "We evaluate 14 widely deployed clinical risk models across five health systems. Parity gaps are not a property of a model but of a threshold chosen for a particular system, and the same model can satisfy parity in one site and violate it badly in another.",
    tags: ["machine learning", "fairness", "health equity"],
  },
  {
    field: "machine-learning",
    title: "Conformal prediction sets that remain valid under temporal drift",
    venue: "Journal of Machine Learning Research",
    year: 2023,
    doi: "10.5555/3648699.3648760",
    abstract:
      "Conformal prediction guarantees assume exchangeability, which time series violate by construction. We present an online procedure that maintains marginal coverage under detected drift and quantify the price of validity in terms of average set size.",
    tags: ["machine learning", "calibration", "uncertainty"],
  },
  {
    field: "machine-learning",
    title: "Dataset documentation practice and downstream reproducibility",
    venue: "Patterns",
    year: 2024,
    doi: "10.1016/j.patter.2024.101044",
    abstract:
      "We linked 900 machine learning papers to artefact-availability statements and attempted to re-run reported results. Papers with structured datasheets were substantially more likely to reproduce, and the gap was not explained by author seniority or venue.",
    tags: ["reproducibility", "fairness", "machine learning"],
  },
  {
    field: "machine-learning",
    title: "On the limits of synthetic pretraining data for reasoning tasks",
    venue: "ICLR",
    year: 2025,
    doi: "10.5555/3578290.3578401",
    abstract:
      "Models trained predominantly on synthetic data reproduce surface reasoning patterns while failing compositional transfer. We characterise this collapse with an information-theoretic bound and show that mixing ten percent human-written data restores compositional generalisation.",
    tags: ["machine learning", "ai safety", "reproducibility"],
  },

  // Neuroscience
  {
    field: "neuroscience",
    title: "Cortical signatures of decision confidence from simultaneous EEG and fMRI",
    venue: "Journal of Neuroscience",
    year: 2024,
    doi: "10.1523/JNEUROSCI.1124-23.2024",
    abstract:
      "Simultaneous EEG-fMRI in 42 participants shows that decision confidence is encoded in midcingulate activity before a response is committed. A late parietal component tracks reported confidence independently of accuracy, dissociating the two.",
    tags: ["eeg", "fmri", "cognition"],
  },
  {
    field: "neuroscience",
    title: "Thalamic gating of working memory updates during task switching",
    venue: "Nature Neuroscience",
    year: 2023,
    doi: "10.1038/s41593-023-01471-4",
    abstract:
      "Thalamic mediodorsal activity precedes working memory updates during rule switching, and experimentally disrupting the thalamocortical loop selectively impairs updating while leaving maintenance intact. The dissociation argues for a gating rather than storage role.",
    tags: ["thalamus", "working memory", "neuroimaging"],
  },
  {
    field: "neuroscience",
    title: "Resting-state connectivity predicts individual differences in working memory",
    venue: "NeuroImage",
    year: 2025,
    doi: "10.1016/j.neuroimage.2025.113289",
    abstract:
      "Frontoparietal resting-state connectivity explains modest but reliable variance in working memory capacity across 310 adults. Effects survive adjustment for head motion and IQ, though they shrink substantially when out-of-sample prediction is used.",
    tags: ["neuroimaging", "working memory", "fmri"],
  },
  {
    field: "neuroscience",
    title: "Population coding of reward expectation in the dopaminergic ventral tegmental area",
    venue: "eLife",
    year: 2024,
    doi: "10.7554/eLife.93812",
    abstract:
      "Large-scale electrode recordings show that reward expectation is represented by the geometry of population activity rather than the firing rate of single neurons. The code is stable across sessions despite substantial turnover in the contributing units.",
    tags: ["neuroimaging", "cognition", "thalamus"],
  },
  {
    field: "neuroscience",
    title: "Cross-modal integration deficits after temporoparietal lesions: a longitudinal study",
    venue: "Brain",
    year: 2023,
    doi: "10.1093/brain/awad318",
    abstract:
      "Following 19 patients with temporoparietal lesions for two years, cross-modal binding recovers incompletely while unimodal recognition does not. The deficit is specific to stimuli requiring integration across sensory modalities, not to attention.",
    tags: ["cognition", "neuroimaging"],
  },
  {
    field: "neuroscience",
    title: "Quantifying sleep spindle coupling to overnight memory consolidation",
    venue: "Current Biology",
    year: 2025,
    doi: "10.1016/j.cub.2025.02.019",
    abstract:
      "Spindle-hippocampal coupling measured overnight predicts next-day recall of spatial sequences, accounting for sleep duration. Coupling during slow-wave sleep explained more variance than spindle count alone in 88 healthy adults.",
    tags: ["cognition", "eeg", "neuroimaging"],
  },

  // Public health
  {
    field: "public-health",
    title: "Intermittent preventive treatment uptake and anaemia in children under five",
    venue: "The Lancet Global Health",
    year: 2024,
    doi: "10.1016/S2214-109X(24)00091-3",
    abstract:
      "Across 11 districts, seasonal chemoprevention reduced anaemia prevalence by 11 percentage points, with effects concentrated in the poorest quintile. Uptake was limited by stock-outs in four districts, suggesting supply rather than adherence is the binding constraint.",
    tags: ["malaria", "public health", "health equity", "surveillance"],
  },
  {
    field: "public-health",
    title: "Community health worker retention after digital payment reform",
    venue: "Health Policy and Planning",
    year: 2023,
    doi: "10.1093/heapol/czad017",
    abstract:
      "Moving community health worker payments onto mobile money raised monthly earnings but also increased attrition by 8 points, concentrated among workers with long commutes. Promptness of payment mattered more than payment amount in explaining who stayed.",
    tags: ["health systems", "public health", "health equity"],
  },
  {
    field: "public-health",
    title: "Modelling the last mile of malaria vaccine rollout in high-transmission districts",
    venue: "Malaria Journal",
    year: 2025,
    doi: "10.1186/s12936-025-03514-2",
    abstract:
      "A district-level model calibrated to 38 rollout programmes identifies the coverage plateau that occurs once routine services absorb most appointments. Reaching the final ten percent of the target population requires a distinct delivery channel, not more of the same.",
    tags: ["malaria", "immunisation", "surveillance", "health systems"],
  },
  {
    field: "public-health",
    title: "Household air pollution and childhood stunting: a prospective cohort",
    venue: "International Journal of Epidemiology",
    year: 2024,
    doi: "10.1093/ije/dyad288",
    abstract:
      "Exposure to household smoke from solid cooking fuel predicts stunting by 24 months in a cohort of 4,100 children, with an association that persists after adjusting for wealth and diet. Cleaner cookstoves were not sufficient to remove the effect without sustained use.",
    tags: ["health equity", "public health", "surveillance"],
  },
  {
    field: "public-health",
    title: "Routine data quality dashboards for district surveillance systems",
    venue: "BMC Public Health",
    year: 2023,
    doi: "10.1186/s12889-023-40188-6",
    abstract:
      "We describe a district-facing dashboard that scores completeness, timeliness and internal consistency of routine health data. Districts using it improved reporting completeness by 23 percent over two years relative to matched comparison districts.",
    tags: ["surveillance", "health systems", "public health"],
  },
  {
    field: "public-health",
    title: "Cost-effectiveness of integrated community case management in fragile settings",
    venue: "PLOS Medicine",
    year: 2025,
    doi: "10.1371/journal.pmed.1004512",
    abstract:
      "Integrated community case management is cost-effective for pneumonia and diarrhoea in stable settings, but in two fragile districts the cost per treated episode rose sharply as travel time to referral increased. Redistribution rather than expansion appeared the better value.",
    tags: ["health systems", "public health", "health equity"],
  },

  // Materials science
  {
    field: "materials-science",
    title: "Degradation pathways in perovskite solar cells under damp heat and open-circuit stress",
    venue: "Nature Energy",
    year: 2024,
    doi: "10.1038/s41560-024-01488-7",
    abstract:
      "Accelerated damp heat testing of 400 device variants identifies halide segregation as the dominant reversible loss mechanism, with lead migration following rather than preceding it. Interface passivation that suppresses segregation retains 92 percent of initial efficiency at 1,000 hours.",
    tags: ["perovskites", "photovoltaics", "energy materials"],
  },
  {
    field: "materials-science",
    title: "Machine-learning-assisted synthesis of high-entropy alloy thin films",
    venue: "Advanced Materials",
    year: 2025,
    doi: "10.1002/adma.202509812",
    abstract:
      "A Bayesian loop proposing compositions from a sparse experimental grid reduced the number of required syntheses to reach a target hardness by 60 percent. Achieved compositions span regions of composition space that manual intuition had not explored.",
    tags: ["alloys", "machine learning", "materials science"],
  },
  {
    field: "materials-science",
    title: "Grain boundary engineering in nickel superalloys for additive manufacturing",
    venue: "Acta Materialia",
    year: 2023,
    doi: "10.1016/j.actamat.2023.118502",
    abstract:
      "In-situ grain boundary engineering during laser powder bed fusion raises creep resistance by 34 percent at 950 degrees Celsius. The improvement is retained after post-build heat treatment, which is unusual for as-built microstructures.",
    tags: ["alloys", "additive manufacturing", "materials science"],
  },
  {
    field: "materials-science",
    title: "MOF-derived electrocatalysts for carbon dioxide reduction at low overpotential",
    venue: "ACS Catalysis",
    year: 2024,
    doi: "10.1021/acscatal.4c01288",
    abstract:
      "Porous coordination polymer precursors converted into bimetallic catalysts reduce carbon dioxide to carbon monoxide at 320 mV overpotential. Active-site density, rather than composition, explains most of the activity variation across the series.",
    tags: ["energy materials", "materials science"],
  },
  {
    field: "materials-science",
    title: "Solid-state electrolytes for lithium metal anodes: interface chemistry review",
    venue: "Chemical Reviews",
    year: 2023,
    doi: "10.1021/acs.chemrev.3c00119",
    abstract:
      "We review 412 studies of solid electrolyte interphases and argue that dendrite formation is better described as a transport problem than a mechanical one. We propose a reporting standard for interfacial resistance that would make results more comparable.",
    tags: ["energy materials", "materials science", "perovskites"],
  },
  {
    field: "materials-science",
    title: "Self-healing polymer coatings under sustained marine exposure",
    venue: "Nature Communications",
    year: 2025,
    doi: "10.1038/s41467-025-51204-9",
    abstract:
      "Microencapsulated catalyst coatings recover 81 percent of scratch area after 90 days of continuous salt immersion. Healing requires a second immersion event, so repeated exposure rather than a single immersion produces the strongest recovery.",
    tags: ["materials science", "energy materials"],
  },

  // Economics
  {
    field: "economics",
    title: "Mobile money, remittances and household resilience in rural East Africa",
    venue: "World Development",
    year: 2024,
    doi: "10.1016/j.worlddev.2024.106451",
    abstract:
      "Panel data covering 2,600 households over six years shows that mobile remittance receipt smooths consumption during shocks, with no offsetting reduction in labour supply. The effect is concentrated in households without access to formal credit.",
    tags: ["mobile money", "development", "labour markets"],
  },
  {
    field: "economics",
    title: "Long-run effects of school feeding programmes on attendance and attainment",
    venue: "Economics of Education Review",
    year: 2023,
    doi: "10.1016/j.econedurev.2023.102564",
    abstract:
      "A phased-in school feeding programme produced persistent attendance gains after meals ended, but no detectable effect on standardised attainment scores. We argue the two outcomes should not be treated as substitutes in programme appraisal.",
    tags: ["development", "public policy", "labour markets"],
  },
  {
    field: "economics",
    title: "Measuring labour market frictions with linked administrative data",
    venue: "Journal of Labor Economics",
    year: 2025,
    doi: "10.1086/729114",
    abstract:
      "Linking vacancy records to social security contributions over four years yields duration measures of frictions that are otherwise unobserved. Estimated frictions are substantially lower than survey-based estimates, and closer to textbook values.",
    tags: ["labour markets", "public policy"],
  },
  {
    field: "economics",
    title: "Cash transfers and firm formation: evidence from a randomised evaluation",
    venue: "Econometrica",
    year: 2024,
    doi: "10.3982/ECTA21377",
    abstract:
      "Unconditional cash transfers raised firm entry by 3.1 percentage points over 18 months, with a further 1.4 points when paired with business training. Two years after the transfer ended, the survival advantage of treated firms remained.",
    tags: ["development", "public policy", "labour markets"],
  },
  {
    field: "economics",
    title: "Informal credit networks and the diffusion of agricultural technology",
    venue: "American Economic Review",
    year: 2023,
    doi: "10.1257/aer.20201518",
    abstract:
      "Adoption of a new planting technology spreads fastest through existing informal credit relationships rather than through extension officers. Targeting lenders rather than farmers is therefore more cost-effective for early adoption.",
    tags: ["development", "mobile money", "public policy"],
  },
  {
    field: "economics",
    title: "Fiscal capacity and the quality of public spending in fragile states",
    venue: "Journal of Public Economics",
    year: 2025,
    doi: "10.1016/j.jpubeco.2025.105022",
    abstract:
      "Across 26 fragile states, spending quality is more strongly predicted by tax administration capacity than by aid volume. Where administration is weak, an additional unit of aid is associated with measurably worse composition of spending.",
    tags: ["public policy", "development", "labour markets"],
  },

  // Astronomy
  {
    field: "astronomy",
    title: "Deep learning detection of fast radio bursts in ASKAP voltage data",
    venue: "Monthly Notices of the Royal Astronomical Society",
    year: 2024,
    doi: "10.1093/mnras/stae2415",
    abstract:
      "A convolutional model operating on raw voltage captures runs in real time at 11 per cent false positive rate, halving candidate volume for human inspection. The model is insensitive to galactic dispersion, unlike per-channel classifiers.",
    tags: ["radio astronomy", "time-domain", "machine learning"],
  },
  {
    field: "astronomy",
    title: "Gas kinematics in the nuclei of 300 low-mass active galactic nuclei",
    venue: "The Astrophysical Journal",
    year: 2023,
    doi: "10.3847/1538-4357/ac9b21",
    abstract:
      "Spatially resolved spectroscopy of 300 low-mass active nuclei reveals broad line regions confined to within one light-year in more than half the sample. Such compactness is difficult to reconcile with standard accretion disc scalings.",
    tags: ["galaxies", "spectroscopy", "radio astronomy"],
  },
  {
    field: "astronomy",
    title: "Constraints on the stellar initial mass function from resolved young clusters",
    venue: "Astronomy & Astrophysics",
    year: 2025,
    doi: "10.1051/0004-6361/202452288",
    abstract:
      "Resolved photometry of 24 young clusters within 5 kpc supports a characteristic mass scale near 260 solar masses. The high-mass slope is steeper than commonly assumed, which reduces the integrated luminosity of a cluster by 15 percent.",
    tags: ["galaxies", "spectroscopy"],
  },
  {
    field: "astronomy",
    title: "Cosmological constraints from deep-field weak lensing",
    venue: "JCAP",
    year: 2024,
    doi: "10.1088/1475-7516/2024/06/042",
    abstract:
      "Weak lensing in a 0.2 square degree field constrains the growth rate of structure at 2.1 sigma, and is consistent with both LCDM and a mildly modified gravity model. We identify the redshift range that drives the degeneracy.",
    tags: ["galaxies", "radio astronomy"],
  },
  {
    field: "astronomy",
    title: "Exoplanet occurrence rates from a two-year radial velocity survey",
    venue: "Nature Astronomy",
    year: 2023,
    doi: "10.1038/s41550-023-02124-0",
    abstract:
      "A two-year survey of 82 solar-type stars yields occurrence rates consistent with the core-accretion prediction for giants and 3.4 times higher for small planets. Completeness falls sharply below 40 day periods, where most detections are absent.",
    tags: ["exoplanets", "spectroscopy"],
  },
  {
    field: "astronomy",
    title: "Time-domain follow-up of extreme variability quasars with a distributed network",
    venue: "The Astronomical Journal",
    year: 2025,
    doi: "10.3847/1538-3881/ad91c2",
    abstract:
      "Eleven observatories on four continents combine to give near-continuous coverage of extreme variability quasars, resolving flares shorter than six hours. Intrinsic rest-frame timescales are 40 percent shorter than previously estimated.",
    tags: ["time-domain", "radio astronomy", "galaxies"],
  },

  // Education
  {
    field: "education",
    title: "Formative feedback and student revision strategies in undergraduate science",
    venue: "Studies in Higher Education",
    year: 2024,
    doi: "10.1080/03075079.2024.2318827",
    abstract:
      "Video-recordings of 60 students revising after feedback show that most re-read their own answer rather than the feedback. A structured feedback template increased substantive revision by 34 percent, and the effect persisted in final coursework.",
    tags: ["feedback", "learning sciences", "science education"],
  },
  {
    field: "education",
    title: "Multilingual instruction and concept learning in multilingual classrooms",
    venue: "Learning and Instruction",
    year: 2023,
    doi: "10.1016/j.learninstruc.2023.101894",
    abstract:
      "Across 14 classrooms, explicit use of learners' home languages for initial instruction improved conceptual attainment in science by 0.4 standard deviations, with no cost in language proficiency. Effects were smaller where teachers had no bilingual training.",
    tags: ["multilingualism", "learning sciences", "assessment"],
  },
  {
    field: "education",
    title: "Teacher professional development and classroom practice: a multi-year study",
    venue: "Educational Researcher",
    year: 2025,
    doi: "10.3102/0013189X251122304",
    abstract:
      "Three years of professional development shifted classroom practice on average 0.3 standard deviations towards more student talk, but gains faded in schools where coaching stopped after year one. Institutional conditions mattered more than programme design.",
    tags: ["learning sciences", "feedback", "assessment"],
  },
  {
    field: "education",
    title: "Retrieval practice across disciplines: a meta-analysis",
    venue: "Review of Educational Research",
    year: 2024,
    doi: "10.3102/00346543241265519",
    abstract:
      "Meta-analysis of 148 classroom experiments estimates a moderate positive effect of retrieval practice on delayed test performance, moderated by whether retrieval was spaced and whether feedback accompanied the retrieval.",
    tags: ["learning sciences", "science education", "assessment"],
  },
  {
    field: "education",
    title: "Peer assessment calibration and feedback uptake in blended courses",
    venue: "Internet and Higher Education",
    year: 2023,
    doi: "10.1016/j.iheduc.2023.100394",
    abstract:
      "Peer scores correlate with staff marks at 0.62, but students revise more in response to feedback from peers they believe are similar to themselves. Providing a stated rationale for each score doubled the rate of substantive revision.",
    tags: ["assessment", "feedback", "learning sciences"],
  },
  {
    field: "education",
    title: "Learning analytics dashboards and student self-regulation behaviour",
    venue: "British Journal of Educational Technology",
    year: 2025,
    doi: "10.1111/bjet.13418",
    abstract:
      "Students given a dashboard showing their own engagement trends engaged in more planning activities, but only when the display covered a full term. A single week of data produced no detectable behavioural change.",
    tags: ["learning sciences", "assessment", "multilingualism"],
  },

  // Linguistics
  {
    field: "linguistics",
    title: "Code-switching in urban Senegalese speech: a corpus and acoustic study",
    venue: "Language in Society",
    year: 2024,
    doi: "10.1017/S0047404524001283",
    abstract:
      "A 240-hour corpus of Dakar Wolof-French speech shows that switch points cluster at discourse boundaries rather than randomly. Speakers shift to French for technical vocabulary at a rate consistent with lexical accommodation, not code-borrowing.",
    tags: ["sociolinguistics", "corpus", "multilingualism"],
  },
  {
    field: "linguistics",
    title: "Morphological typology and transfer in second-language acquisition",
    venue: "Language Learning",
    year: 2023,
    doi: "10.1111/lang.12517",
    abstract:
      "Comparing learners of two typologically distant second languages, we find that morphological transfer is asymmetric: noun-class systems transfer more readily than verb aspect marking. Instruction effects depend on which side of the typological distance is acquired first.",
    tags: ["multilingualism", "corpus", "sociolinguistics"],
  },
  {
    field: "linguistics",
    title: "Multilingual language models for low-resource dialect identification",
    venue: "ACL",
    year: 2025,
    doi: "10.18653/v1/2025.acl-long.1883",
    abstract:
      "Continued pretraining on 40 million tokens of dialect data raises identification accuracy for 9 low-resource varieties by 21 points. The gains hold when the model is evaluated on speakers whose dialect is not represented in training.",
    tags: ["low-resource", "machine learning", "multilingualism"],
  },
  {
    field: "linguistics",
    title: "Prosodic marking of focus across West African tone languages",
    venue: "Phonetics and Phonology",
    year: 2024,
    doi: "10.1017/S0025103024000121",
    abstract:
      "Focus marking in four West African tone languages is realised primarily through duration rather than pitch, contradicting tonal tone analysis. Speakers shift their focus strategy when the sentence contains a lexical tone requiring contrast.",
    tags: ["sociolinguistics", "corpus"],
  },
  {
    field: "linguistics",
    title: "Lexical borrowings in postcolonial administrative registers",
    venue: "Journal of Sociolinguistics",
    year: 2023,
    doi: "10.1111/josl.12611",
    abstract:
      "Administrative documents from four Anglophone and Francophone jurisdictions show parallel borrowing patterns despite differing colonial languages. Terms enter through definitional synonymy rather than direct translation, and stabilise within two decades.",
    tags: ["sociolinguistics", "multilingualism", "corpus"],
  },
  {
    field: "linguistics",
    title: "Speech recognition with limited labelled data: lessons from 12 languages",
    venue: "Speech Communication",
    year: 2025,
    doi: "10.1016/j.specom.2025.103512",
    abstract:
      "Self-supervised pretraining plus 20 hours of transcribed speech reaches useful word error rates for nine of 12 languages. Three languages with complex tone inventories and no orthographic standard remain out of reach at this data scale.",
    tags: ["speech recognition", "low-resource", "machine learning"],
  },
];

/* ------------------------------------------------------------------ *
 * Activity
 * ------------------------------------------------------------------ */

const POSTS: PostSpec[] = [
  {
    by: "amara.okafor",
    body: "Three years of donor-level metadata and the atlas finally works across sites. The myeloid state that predicts antibody response was invisible in every bulk assay we ran. Preprint is out — the code that produces the figures is in the second repo.",
    paper: "A single-cell atlas of immune responses to seasonal influenza vaccination",
    link: "https://www.biorxiv.org/",
  },
  {
    by: "tobias.lindqvist",
    body: "Reminder that identifiability is not a technicality you fix after the fact. If your perturbation screen cannot in principle identify the network, a better optimiser will not help you. Reviewer-facing version of this argument is in the new preprint.",
    paper: "Separating cell state from cell identity in Perturb-seq experiments",
  },
  {
    by: "ingrid.sorensen",
    body: "Twelve days on the ice edge this season and the drainage event we hypothesised in 2022 fired exactly where the model said it would. Field note with the raw data is up. A paper that only works from satellite pixels is not evidence.",
    image: "greenland-thaw",
  },
  {
    by: "kwame.boateng",
    body: "The clearest result of the year: yield loss tracks the first three weeks after planting, not the seasonal total. If you are advising on sowing dates, the seasonal rainfall total is the number you should stop optimising for.",
    paper: "Monsoon onset variability and smallholder yield in the Sudano-Sahel",
  },
  {
    by: "priya.raghunathan",
    body: "Every clinical model I have audited this year was well calibrated at the site it was built on and badly calibrated everywhere else. The threshold, not the model, is what encodes the fairness decision. Short write-up of the monitoring procedure.",
    paper: "Calibration under distribution shift: a framework for clinical deployment",
  },
  {
    by: "daniel.okonkwo",
    body: "We tried to re-run 900 papers' results. Papers with structured datasheets reproduced substantially more often, and author seniority did not explain the gap. Documentation is doing real work in the research process, not paperwork after it.",
    paper: "Dataset documentation practice and downstream reproducibility",
  },
  {
    by: "lucia.fernandez",
    body: "New preprint up. Decision confidence and decision accuracy dissociate in the parietal window we expected, and not in the midcingulate window. The more interesting result is in the failures: three participants encoded confidence but not accuracy, which nobody has modelled before.",
    paper: "Cortical signatures of decision confidence from simultaneous EEG and fMRI",
  },
  {
    by: "samuel.adeyemi",
    body: "The thalamus is a gate, not a store. Our disruption results are the cleanest version of this I have seen, and they took nine years. Low-field protocol is shared, because none of this is reproducible without access.",
    paper: "Thalamic gating of working memory updates during task switching",
  },
  {
    by: "fatima.bello",
    body: "Four of eleven districts had stock-outs during the chemoprevention window. Uptake is the story analysts tell; supply is the story that explains uptake. Coverage data from the full season is in the preprint.",
    paper: "Intermittent preventive treatment uptake and anaemia in children under five",
  },
  {
    by: "joseph.mwangi",
    body: "We moved community health worker payments to mobile money. Earnings went up, attrition went up more, and the workers who left were the ones with the longest commutes. Promptness beat amount as the retention lever.",
    paper: "Community health worker retention after digital payment reform",
  },
  {
    by: "yuki.tanaka",
    body: "Nine hundred hours of damp heat testing. The failures are more informative than the record efficiencies and we are publishing all of them. Halide segregation is reversible; lead migration is not. Different design responses follow from that distinction.",
    paper: "Degradation pathways in perovskite solar cells under damp heat and open-circuit stress",
  },
  {
    by: "marcus.weber",
    body: "The Bayesian synthesis loop hit our target hardness with 40 percent fewer experiments than the traditional grid. More interesting: it proposed compositions in regions of the space that our materials intuition had been avoiding.",
    paper: "Machine-learning-assisted synthesis of high-entropy alloy thin films",
  },
  {
    by: "grace.mwangi",
    body: "Three years of panel data on digital remittances. The resilience effect is real and it is concentrated in households without formal credit. What it is not is a substitute for credit — that was the hypothesis and it did not survive the data.",
    paper: "Mobile money, remittances and household resilience in rural East Africa",
  },
  {
    by: "rahul.menon",
    body: "Preprint on cash transfers and firm formation. The training effect only appears with the transfer, and the survival advantage is still visible two years later. Measurement of counterfactual firm formation is, of course, the hard part.",
    paper: "Cash transfers and firm formation: evidence from a randomised evaluation",
  },
  {
    by: "nia.williams",
    body: "New detection pipeline is live. Running on raw voltage in real time, which means it does not care about galactic dispersion — that was the whole design goal. Figure below is a real detection from last night's run.",
    paper: "Deep learning detection of fast radio bursts in ASKAP voltage data",
    image: "frb-detection",
  },
  {
    by: "carlos.mendes",
    body: "Three hundred low-mass AGN and most of them have broad line regions confined to a light year. I do not think standard disc scalings survive that. Someone with a better model than mine should tell me why they do.",
    paper: "Gas kinematics in the nuclei of 300 low-mass active galactic nuclei",
  },
  {
    by: "zainab.yusuf",
    body: "Video coding of students revising after feedback. Most re-read their own answer. The template that made them read the feedback cut re-reading by a third and improved final work. It is an embarrassingly simple intervention.",
    paper: "Formative feedback and student revision strategies in undergraduate science",
  },
  {
    by: "peter.walsh",
    body: "Twelve years into multilingual instruction research and the finding that survives is the boring one: home language for initial instruction helps concepts, and only if the teacher is trained for it. Everything else replicates in about half the studies.",
    paper: "Multilingual instruction and concept learning in multilingual classrooms",
  },
  {
    by: "amina.traore",
    body: "The Dakar corpus is now 240 hours and openly available. Switch points cluster at discourse boundaries, which suggests the switching is doing interactional work rather than filling a lexical gap. Analysis code is in the repository.",
    paper: "Code-switching in urban Senegalese speech: a corpus and acoustic study",
  },
  {
    by: "chen.wei",
    body: "Twenty hours of transcribed speech plus self-supervised pretraining gets nine of our twelve languages to usable. The three that fail all have complex tone inventories and no orthographic standard. That is a data problem, not a model problem.",
    paper: "Speech recognition with limited labelled data: lessons from 12 languages",
  },
  // Reposts of earlier posts.
  {
    by: "priya.raghunathan",
    body: "This is the clearest statement I have read of why calibration monitoring belongs in the deployment pipeline rather than the model card.",
    repostOf: 4,
  },
  {
    by: "tobias.lindqvist",
    body: "Re-posting because this is the standard I send to every new student in the group. Identifiability first, optimisation second.",
    repostOf: 1,
  },
  {
    by: "joseph.mwangi",
    body: "Worth reading for the uptake-versus-supply framing, which we have been arguing about internally for two years without a clean way to put it.",
    repostOf: 8,
  },
  {
    by: "marcus.weber",
    body: "Anyone doing alloy search should read this. The composition space argument applies well outside materials science.",
    paper: "Machine-learning-assisted synthesis of high-entropy alloy thin films",
  },
  {
    by: "samuel.adeyemi",
    body: "Consolidating a list of open problems in thalamic gating. Happy to argue that the store versus gate framing is itself the problem.",
    image: "thalamus-notes",
  },
  {
    by: "fatima.bello",
    body: "District surveillance dashboard went live in four regions this month. The improvement in reporting completeness is larger than any training intervention I have run. Feedback loops beat training, as usual.",
    paper: "Routine data quality dashboards for district surveillance systems",
  },
  {
    by: "peter.walsh",
    body: "Classroom-level finding from the multi-year study: gains fade where coaching stops after year one. Institutional conditions beat programme design, again.",
  },
  {
    by: "grace.mwangi",
    body: "Reminder that our five-country panel has been running for six years and still has not finished data collection. Longitudinal work is a staffing commitment, not a grant commitment.",
  },
  {
    by: "nia.williams",
    body: "The instrument team published a bug in last month's dispersion correction. Anyone who ran data through it after the 12th should reprocess. Sorry for the extra work.",
  },
];

const CONVERSATIONS: Array<{
  pair: [string, string];
  messages: Array<{ from: 0 | 1; body: string; daysAgo: number; hour: number; state?: "sent" | "delivered" | "read" }>;
}> = [
  {
    pair: ["amara.okafor", "tobias.lindqvist"],
    messages: [
      { from: 0, body: "Your perturbation preprint — does the identifiability condition hold if we only have two perturbations per gene?", daysAgo: 9, hour: 9, state: "read" },
      { from: 1, body: "Not in general. Two is enough to bound the diagonal but not the off-diagonal structure. Three works in practice, four is comfortable.", daysAgo: 9, hour: 11, state: "read" },
      { from: 0, body: "That matches what we are seeing. I will run the identifiability check per screen and report which of our 41 pass.", daysAgo: 8, hour: 8, state: "read" },
      { from: 1, body: "Good. If it is useful I can send the diagnostic script before the review deadline.", daysAgo: 8, hour: 9, state: "read" },
      { from: 0, body: "Yes please. That would save me a day of reimplementing your estimator.", daysAgo: 2, hour: 16, state: "delivered" },
    ],
  },
  {
    pair: ["ingrid.sorensen", "kwame.boateng"],
    messages: [
      { from: 1, body: "Our downscaled ensemble for the Sudano-Sahel is finished. Your onset dates plug straight into the yield model.", daysAgo: 12, hour: 14, state: "read" },
      { from: 0, body: "Excellent. One request: can you keep the raw bias-correction chain rather than only the corrected series?", daysAgo: 12, hour: 15, state: "read" },
      { from: 1, body: "It is all in the repository, including the quantile mappings.", daysAgo: 11, hour: 10, state: "read" },
      { from: 0, body: "I am in Copenhagen in March. Coffee if you are ever in this hemisphere.", daysAgo: 3, hour: 12, state: "sent" },
    ],
  },
  {
    pair: ["fatima.bello", "joseph.mwangi"],
    messages: [
      { from: 0, body: "The stock-out data for the four districts came through. I can send the clean version this afternoon.", daysAgo: 6, hour: 17, state: "read" },
      { from: 1, body: "Please do. I want to run it against the retention data before we write anything up.", daysAgo: 6, hour: 18, state: "read" },
      { from: 0, body: "Sent. One caveat: two districts changed reporting definitions mid-season, so the second quarter is not comparable.", daysAgo: 5, hour: 9, state: "read" },
      { from: 1, body: "Noted. That actually strengthens the argument — the districts with the best reporting are the ones with the stock-outs.", daysAgo: 5, hour: 10, state: "delivered" },
    ],
  },
  {
    pair: ["zainab.yusuf", "peter.walsh"],
    messages: [
      { from: 0, body: "The feedback template is outperforming our whole prior intervention. Coding clips are up if you want to reuse the protocol.", daysAgo: 4, hour: 13, state: "read" },
      { from: 1, body: "This is exactly the intervention my reviewers asked me to drop three years ago. Reinstating it with your data is the best possible outcome.", daysAgo: 4, hour: 15, state: "read" },
      { from: 0, body: "Happy for it to be cited. The clips are anonymised.", daysAgo: 4, hour: 16, state: "read" },
    ],
  },
  {
    pair: ["amara.okafor", "priya.raghunathan"],
    messages: [
      { from: 0, body: "Your calibration monitoring procedure — would it detect a cohort shift in a validation set we only see every six months?", daysAgo: 1, hour: 10, state: "read" },
      { from: 1, body: "Not from the data alone. You would need at least monthly outcome returns, even partial ones.", daysAgo: 1, hour: 11, state: "delivered" },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

export interface SeedResult {
  profiles: number;
  publications: number;
  posts: number;
  comments: number;
  likes: number;
  saves: number;
  connections: number;
  pending: number;
  follows: number;
  blocks: number;
  conversations: number;
  messages: number;
  notifications: number;
  topicFollows: number;
  emails: string[];
}

export async function runSeed(): Promise<SeedResult> {
  getEnv();
  await connectDB();

  const random = rng(20260318);
  const pick = <T,>(items: T[]): T => items[Math.floor(random() * items.length)];

  const byField = new Map<Field, Persona[]>();
  for (const persona of PERSONAS) {
    const list = byField.get(persona.field) ?? [];
    list.push(persona);
    byField.set(persona.field, list);
  }

  // --- users + profiles -------------------------------------------------
  const idByUsername = new Map<string, string>();
  for (const persona of PERSONAS) {
    const user = await UserModel.findOneAndUpdate(
      { email: persona.email },
      {
        $set: { name: persona.displayName, image: persona.avatarUrl },
        $setOnInsert: { email: persona.email, emailVerified: NOW },
      },
      { upsert: true, returnDocument: "after" },
    );
    const profile = await ProfileModel.findOneAndUpdate(
      { username: persona.username },
      {
        $setOnInsert: { userId: user._id },
        $set: {
          displayName: persona.displayName,
          headline: persona.headline,
          affiliation: persona.affiliation,
          location: persona.location,
          bio: persona.bio,
          interests: persona.interests,
          avatarUrl: persona.avatarUrl,
          coverUrl: persona.coverUrl,
          visibility: "public",
          sectionVisibility: {
            about: "public",
            interests: "public",
            experience: "public",
            education: "public",
            grants: "public",
          },
          experience: persona.experience,
          education: persona.education,
          grants: persona.grants,
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    idByUsername.set(persona.username, String(profile._id));
  }

  const ids = [...idByUsername.values()];
  const idOf = (username: string) => idByUsername.get(username);
  const usernames = PERSONAS.map((x) => x.username);

  // --- clear previously seeded content (seed-owned only) ---------------
  const previousConversations = await ConversationModel.find({
    participants: { $in: ids },
  })
    .select("_id")
    .lean();
  await MessageModel.deleteMany({
    conversationId: { $in: previousConversations.map((c) => c._id) },
  });
  await Promise.all([
    ConversationModel.deleteMany({ participants: { $in: ids } }),
    NotificationModel.deleteMany({ recipient: { $in: ids } }),
    TopicFollowModel.deleteMany({ profile: { $in: ids } }),
    CommentModel.deleteMany({ author: { $in: ids } }),
    LikeModel.deleteMany({ profile: { $in: ids } }),
    SaveModel.deleteMany({ profile: { $in: ids } }),
    PostModel.deleteMany({ author: { $in: ids } }),
    PublicationModel.deleteMany({ owner: { $in: ids } }),
    BlockModel.deleteMany({
      $or: [{ blocker: { $in: ids } }, { blocked: { $in: ids } }],
    }),
    FollowModel.deleteMany({
      $or: [{ follower: { $in: ids } }, { following: { $in: ids } }],
    }),
  ]);

  // Connections: rebuild every pair key among seeded personas.
  await ConnectionModel.deleteMany({
    $or: [{ requester: { $in: ids } }, { recipient: { $in: ids } }],
  });

  // --- publications -----------------------------------------------------
  const publicationDocs = PAPERS.map((paper, i) => {
    const fieldPeople = byField.get(paper.field) ?? [];
    const owner = fieldPeople[i % fieldPeople.length];
    const partner = fieldPeople[(i + 1) % fieldPeople.length];
    const age = 2026 - paper.year;
    const citations = Math.max(
      0,
      Math.round((1200 / (age + 1.6)) * (0.55 + random() * 0.9)),
    );
    const reads = Math.round(citations * (7 + random() * 22) + 400 * random());
    return {
      owner: idByUsername.get(owner.username),
      title: paper.title,
      authors: [owner, partner]
        .filter((a, index, all) => all.findIndex((x) => x.username === a.username) === index)
        .map((a) => ({ name: a.displayName, profileId: idByUsername.get(a.username) })),
      venue: paper.venue,
      year: paper.year,
      doi: paper.doi,
      abstract: paper.abstract,
      tags: paper.tags,
      fileUrl: "",
      fileMime: "",
      fileSize: 0,
      featured: citations > 60 && i % 7 === 0,
      readsCount: reads,
      downloadsCount: Math.round(reads * (0.04 + random() * 0.08)),
      citationsCount: citations,
      createdAt: daysAgo(Math.max(2, age * 90 + i), 9),
      updatedAt: daysAgo(Math.max(2, age * 90 + i), 9),
    };
  });
  const publications = await PublicationModel.insertMany(publicationDocs);
  const pubByTitle = new Map(publications.map((p) => [p.title, p]));

  // --- posts ------------------------------------------------------------
  // Inserted without repostOf first, then linked once the ids exist.
  const postDocs = POSTS.map((spec, i) => ({
    author: idOf(spec.by),
    body: spec.body,
    linkUrl: spec.link ?? "",
    imageUrl: spec.image ? postImage(spec.image) : "",
    publicationId: spec.paper ? pubByTitle.get(spec.paper)?._id : undefined,
    likesCount: 0,
    commentsCount: 0,
    repostsCount: 0,
    createdAt: daysAgo(POSTS.length - i, 8 + (i % 9), (i * 7) % 60),
    updatedAt: daysAgo(POSTS.length - i, 8 + (i % 9), (i * 7) % 60),
  }));
  const posts = await PostModel.insertMany(postDocs);
  for (const [i, spec] of POSTS.entries()) {
    if (spec.repostOf === undefined) continue;
    await PostModel.updateOne(
      { _id: posts[i]._id },
      { $set: { repostOf: posts[spec.repostOf]._id } },
    );
  }
  const postById = new Map(posts.map((p) => [String(p._id), p]));

  // --- comments, likes, saves ------------------------------------------
  const commentBodies = [
    "Excellent point. I have been arguing the opposite for two years and this is convincing.",
    "Is the code available? I would like to rerun this on our own cohort.",
    "Very useful. The limitation section is more informative than most papers I review.",
    "We tried something similar and got a different answer, though our sample was much smaller.",
    "Bookmarking this. Directly relevant to a review I am writing.",
    "The framing here is much better than the version that was on the lab page.",
    "Do you have the sensitivity analysis for the alternative threshold?",
    "This has changed how I think about our own results. Thank you for posting it.",
  ];

  const commentDocs: Record<string, unknown>[] = [];
  const likeDocs: Record<string, unknown>[] = [];
  const saveDocs: Record<string, unknown>[] = [];

  for (const post of posts) {
    const authorId = String(post.author);
    const likers = usernames.filter(
      (u) => idOf(u) !== authorId && random() < 0.42,
    );
    for (const u of likers) {
      likeDocs.push({ post: post._id, profile: idOf(u), createdAt: post.createdAt });
    }
    for (const u of usernames.filter(
      (u) => idOf(u) !== authorId && random() < 0.14,
    )) {
      saveDocs.push({ post: post._id, profile: idOf(u), createdAt: post.createdAt });
    }
    const commentCount = Math.floor(random() * 3.3);
    const commenters = usernames.filter(
      (u) => idOf(u) !== authorId && random() < 0.3,
    );
    for (let c = 0; c < Math.min(commentCount, commenters.length); c += 1) {
      commentDocs.push({
        post: post._id,
        author: idOf(commenters[c]),
        body: pick(commentBodies),
        createdAt: new Date(
          new Date(post.createdAt).getTime() + (c + 1) * 5_400_000,
        ),
        updatedAt: new Date(
          new Date(post.createdAt).getTime() + (c + 1) * 5_400_000,
        ),
      });
    }
  }

  if (commentDocs.length) await CommentModel.insertMany(commentDocs);
  if (likeDocs.length) await LikeModel.insertMany(likeDocs);
  if (saveDocs.length) await SaveModel.insertMany(saveDocs);

  // --- connections ------------------------------------------------------
  const connectionDocs: Record<string, unknown>[] = [];
  const connectionKeys = new Set<string>();
  const addConnection = (a: string, b: string, status: string) => {
    const idA = idOf(a);
    const idB = idOf(b);
    if (!idA || !idB) return;
    const key = connectionPairKey(idA, idB);
    if (connectionKeys.has(key)) return;
    connectionKeys.add(key);
    connectionDocs.push({
      requester: idA,
      recipient: idB,
      status,
      pairKey: key,
      createdAt: daysAgo(Math.floor(random() * 120) + 5, 12),
      updatedAt: daysAgo(Math.floor(random() * 120) + 5, 12),
    });
  };

  // A ring plus two chord sets, so nobody is isolated.
  for (let i = 0; i < usernames.length; i += 1) {
    for (const step of [1, 2, 7]) {
      const a = usernames[i];
      const b = usernames[(i + step) % usernames.length];
      if (i < (i + step) % usernames.length) addConnection(a, b, "accepted");
    }
  }
  // Pending requests aimed at the first persona (the default demo login),
  // plus a handful elsewhere so /network is never empty.
  for (const who of [
    "kwame.boateng",
    "lucia.fernandez",
    "chen.wei",
    "marcus.weber",
    "rahul.menon",
  ]) {
    addConnection(who, usernames[0], "pending");
  }
  for (const [from, to] of [
    ["priya.raghunathan", "carlos.mendes"],
    ["nia.williams", "peter.walsh"],
    ["amina.traore", "samuel.adeyemi"],
  ] as const) {
    addConnection(from, to, "pending");
  }
  for (const [from, to] of [
    ["daniel.okonkwo", "yuki.tanaka"],
    ["grace.mwangi", "fatima.bello"],
  ] as const) {
    addConnection(from, to, "declined");
  }
  if (connectionDocs.length) await ConnectionModel.insertMany(connectionDocs);

  // --- follows, blocks, topic follows ----------------------------------
  const followDocs: Record<string, unknown>[] = [];
  const followKeys = new Set<string>();
  for (let i = 0; i < usernames.length; i += 1) {
    for (const step of [3, 5, 9]) {
      const follower = usernames[i];
      const following = usernames[(i + step) % usernames.length];
      const idF = idOf(follower);
      const idT = idOf(following);
      if (!idF || !idT) continue;
      const key = `${idF}:${idT}`;
      if (followKeys.has(key)) continue;
      followKeys.add(key);
      followDocs.push({
        follower: idF,
        following: idT,
        createdAt: daysAgo(Math.floor(random() * 90) + 2, 15),
      });
    }
  }
  if (followDocs.length) await FollowModel.insertMany(followDocs);

  await BlockModel.insertMany([
    {
      blocker: idOf(usernames[19]),
      blocked: idOf(usernames[13]),
      createdAt: daysAgo(40, 10),
    },
    {
      blocker: idOf(usernames[17]),
      blocked: idOf(usernames[4]),
      createdAt: daysAgo(28, 10),
    },
  ]);

  const topicFollowDocs: Record<string, unknown>[] = [];
  const topicKeys = new Set<string>();
  for (const persona of PERSONAS) {
    for (const tag of persona.interests) {
      const key = `${persona.username}:${tag}`;
      if (topicKeys.has(key)) continue;
      topicKeys.add(key);
      topicFollowDocs.push({
        profile: idOf(persona.username),
        tag,
        createdAt: daysAgo(Math.floor(random() * 60) + 3, 11),
      });
    }
  }
  if (topicFollowDocs.length) await TopicFollowModel.insertMany(topicFollowDocs);

  // --- conversations and messages --------------------------------------
  const conversationDocs: Record<string, unknown>[] = [];
  for (const thread of CONVERSATIONS) {
    const idA = idOf(thread.pair[0]);
    const idB = idOf(thread.pair[1]);
    if (!idA || !idB) continue;
    const last = thread.messages[thread.messages.length - 1];
    conversationDocs.push({
      pairKey: conversationPairKey(idA, idB),
      participants: [idA, idB],
      status: "active",
      lastMessageAt: daysAgo(last.daysAgo, last.hour),
      createdAt: daysAgo(last.daysAgo + 1, last.hour),
      updatedAt: daysAgo(last.daysAgo, last.hour),
    });
  }
  const conversations = await ConversationModel.insertMany(conversationDocs);
  const convByPair = new Map(
    conversations.map((c, i) => [threadKeyOf(CONVERSATIONS[i]), c]),
  );

  const messageDocs: Record<string, unknown>[] = [];
  for (const thread of CONVERSATIONS) {
    const conversation = convByPair.get(threadKeyOf(thread));
    if (!conversation) continue;
    for (const m of thread.messages) {
      const sender = idOf(thread.pair[m.from]);
      const at = daysAgo(m.daysAgo, m.hour);
      messageDocs.push({
        conversationId: conversation._id,
        sender,
        body: m.body,
        state: m.state ?? "read",
        createdAt: at,
        updatedAt: at,
      });
    }
  }
  if (messageDocs.length) await MessageModel.insertMany(messageDocs);

  // --- notifications (centred on the first persona) --------------------
  const viewer = usernames[0];
  const viewerId = idOf(viewer);
  const notificationDocs: Record<string, unknown>[] = [
    {
      recipient: viewerId,
      type: "connect_request",
      actor: idOf("kwame.boateng"),
      targetKind: "profile",
      targetId: idOf("kwame.boateng"),
      read: false,
      createdAt: daysAgo(1, 9),
    },
    {
      recipient: viewerId,
      type: "connect_request",
      actor: idOf("lucia.fernandez"),
      targetKind: "profile",
      targetId: idOf("lucia.fernandez"),
      read: false,
      createdAt: daysAgo(3, 14),
    },
    {
      recipient: viewerId,
      type: "connect_accept",
      actor: idOf("tobias.lindqvist"),
      targetKind: "profile",
      targetId: idOf("tobias.lindqvist"),
      read: true,
      createdAt: daysAgo(6, 10),
    },
    {
      recipient: viewerId,
      type: "message",
      actor: idOf("priya.raghunathan"),
      targetKind: "conversation",
      targetId: convByPair.get(threadKeyOf(CONVERSATIONS[4]))?._id,
      read: false,
      createdAt: daysAgo(1, 11),
    },
    {
      recipient: viewerId,
      type: "mention",
      actor: idOf("daniel.okonkwo"),
      targetKind: "post",
      targetId: postById.get(String(posts[5]._id))?._id,
      read: false,
      createdAt: daysAgo(2, 16),
    },
    {
      recipient: viewerId,
      type: "cite",
      actor: undefined,
      targetKind: "publication",
      targetId: pubByTitle.get(
        "A single-cell atlas of immune responses to seasonal influenza vaccination",
      )?._id,
      read: true,
      createdAt: daysAgo(7, 8),
    },
  ];
  await NotificationModel.insertMany(notificationDocs.filter((n) => n.recipient));

  // --- presence ---------------------------------------------------------
  await Promise.all(
    PERSONAS.map((persona, i) =>
      ProfileModel.updateOne(
        { _id: idOf(persona.username) },
        {
          $set: {
            lastActiveAt: daysAgo(
              i % 4 === 0 ? 0 : i % 4 === 1 ? 1 : i % 4 === 2 ? 4 : 11,
              9 + (i % 8),
            ),
          },
        },
      ),
    ),
  );

  // --- denormalised counters -------------------------------------------
  await recomputeCounters(ids);

  return {
    profiles: PERSONAS.length,
    publications: publications.length,
    posts: posts.length,
    comments: commentDocs.length,
    likes: likeDocs.length,
    saves: saveDocs.length,
    connections: connectionDocs.filter(
      (c) => (c as { status: string }).status === "accepted",
    ).length,
    pending: connectionDocs.filter(
      (c) => (c as { status: string }).status === "pending",
    ).length,
    follows: followDocs.length,
    blocks: 2,
    conversations: conversations.length,
    messages: messageDocs.length,
    notifications: notificationDocs.length,
    topicFollows: topicFollowDocs.length,
    emails: PERSONAS.map((p) => p.email),
  };
}

function threadKeyOf(thread: { pair: [string, string] }): string {
  return [thread.pair[0], thread.pair[1]].sort().join(":");
}

/**
 * Recompute every counter the UI denormalises, straight from the source
 * collections, so the demo data is internally consistent.
 */
async function recomputeCounters(ids: string[]): Promise<void> {
  const [acceptedConnections, followerRows, followingRows, postCounts, commentCounts, repostCounts] =
    await Promise.all([
      ConnectionModel.find({ status: "accepted" })
        .select("requester recipient")
        .lean(),
      FollowModel.aggregate<{ _id: string; n: number }>([
        { $match: { following: { $in: ids } } },
        { $group: { _id: "$following", n: { $sum: 1 } } },
      ]),
      FollowModel.aggregate<{ _id: string; n: number }>([
        { $match: { follower: { $in: ids } } },
        { $group: { _id: "$follower", n: { $sum: 1 } } },
      ]),
      LikeModel.aggregate<{ _id: string; n: number }>([
        { $group: { _id: "$post", n: { $sum: 1 } } },
      ]),
      CommentModel.aggregate<{ _id: string; n: number }>([
        { $group: { _id: "$post", n: { $sum: 1 } } },
      ]),
      PostModel.aggregate<{ _id: string; n: number }>([
        { $match: { repostOf: { $ne: null } } },
        { $group: { _id: "$repostOf", n: { $sum: 1 } } },
      ]),
    ]);

  const perProfileConnections = new Map<string, number>();
  for (const row of acceptedConnections) {
    for (const id of [row.requester, row.recipient]) {
      const key = String(id);
      perProfileConnections.set(key, (perProfileConnections.get(key) ?? 0) + 1);
    }
  }

  const [pubAgg, profileIds] = await Promise.all([
    PublicationModel.aggregate<{
      _id: string;
      citations: number;
      reads: number;
    }>([
      { $group: { _id: "$owner", citations: { $sum: "$citationsCount" }, reads: { $sum: "$readsCount" } } },
    ]),
    ProfileModel.find({ _id: { $in: ids } }).select("_id").lean(),
  ]);

  await Promise.all([
    ...followerRows.map((r) =>
      ProfileModel.updateOne({ _id: r._id }, { $set: { followersCount: r.n } }),
    ),
    ...followingRows.map((r) =>
      ProfileModel.updateOne({ _id: r._id }, { $set: { followingCount: r.n } }),
    ),
    ...pubAgg.map((r) =>
      ProfileModel.updateOne(
        { _id: r._id },
        { $set: { citationsCount: r.citations, readsCount: r.reads } },
      ),
    ),
    ...profileIds.map((p) =>
      ProfileModel.findById(p._id).then(async (doc) => {
        if (!doc) return;
        const { pct } = computeCompleteness(
          doc.toObject() as unknown as Record<string, unknown>,
        );
        await ProfileModel.updateOne({ _id: p._id }, { $set: { completeness: pct } });
      }),
    ),
    ...profileIds.map((p) =>
      ProfileModel.updateOne(
        { _id: p._id },
        {
          $set: {
            connectionsCount: perProfileConnections.get(String(p._id)) ?? 0,
          },
        },
      ),
    ),
  ]);

  await PostModel.updateMany(
    { _id: { $in: postCounts.map((p) => p._id) } },
    { $set: { likesCount: 0, commentsCount: 0, repostsCount: 0 } },
  );
  for (const row of postCounts) {
    await PostModel.updateOne({ _id: row._id }, { $set: { likesCount: row.n } });
  }
  for (const row of commentCounts) {
    await PostModel.updateOne({ _id: row._id }, { $set: { commentsCount: row.n } });
  }
  for (const row of repostCounts) {
    await PostModel.updateOne({ _id: row._id }, { $set: { repostsCount: row.n } });
  }
}

async function main(): Promise<void> {
  const result = await runSeed();
  console.log(
    [
      "[seed] done",
      `  profiles        ${result.profiles}`,
      `  publications    ${result.publications}`,
      `  posts           ${result.posts} (with comments, likes, saves)`,
      `  comments        ${result.comments}`,
      `  likes           ${result.likes}`,
      `  saves           ${result.saves}`,
      `  connections     ${result.connections} accepted, ${result.pending} pending`,
      `  follows         ${result.follows}`,
      `  blocks          ${result.blocks}`,
      `  conversations   ${result.conversations} (${result.messages} messages)`,
      `  notifications   ${result.notifications}`,
      `  topic follows   ${result.topicFollows}`,
      "",
      "[seed] sign in with any of these emails (dev login, no password):",
      ...result.emails.map((e) => `  ${e}`),
    ].join("\n"),
  );
  process.exit(0);
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/seed.ts");
if (isMain) {
  main().catch((error) => {
    console.error("[seed] failed", error);
    process.exit(1);
  });
}
