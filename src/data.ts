import type { Domain, Project, Member } from './types';
import { supabase } from './supabase';

// ── SUPABASE FETCH ────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  if (!supabase) return STATIC_PROJECTS;

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) return STATIC_PROJECTS;

  return data.map((row: Record<string, unknown>, idx: number) => {
    const members = (row['members'] as Member[] | null) ?? [];
    const student = members.length
      ? members.map((m: Member) => m.name).join(', ')
      : 'Unknown';
    return {
      id:        typeof row['id'] === 'number' ? row['id'] : idx + 1000,
      name:      String(row['name'] ?? ''),
      student,
      domain:    String(row['domain'] ?? 'social'),
      tech:      (row['tech'] as string[]) ?? [],
      tags:      (row['tags'] as string[]) ?? [],
      short:     String(row['short'] ?? ''),
      full:      String(row['full'] ?? ''),
      emoji:     String(row['emoji'] ?? '🚀'),
      link:      String(row['link'] ?? '#'),
      image_url: row['image_url'] ? String(row['image_url']) : undefined,
      members,
    } satisfies Project;
  });
}

export const DOMAINS: Domain[] = [
  { id: 'ai-ml',     name: 'AI & Machine Learning', color: '#4A90D9', hex: 0x4A90D9, icon: '🤖', pos: { x: -34, z: -34 } },
  { id: 'health',    name: 'Health & Wellbeing',     color: '#27AE60', hex: 0x27AE60, icon: '🏥', pos: { x:  34, z: -34 } },
  { id: 'finance',   name: 'Finance & FinTech',      color: '#F39C12', hex: 0xF39C12, icon: '💰', pos: { x:  44, z:   0 } },
  { id: 'creative',  name: 'Creative & Media',       color: '#9B59B6', hex: 0x9B59B6, icon: '🎨', pos: { x: -44, z:   0 } },
  { id: 'education', name: 'Education & Learning',   color: '#1ABC9C', hex: 0x1ABC9C, icon: '📚', pos: { x:   0, z: -46 } },
  { id: 'social',    name: 'Social & Civic Tech',    color: '#E74C3C', hex: 0xE74C3C, icon: '🌍', pos: { x:   0, z:  46 } },
];

export const TECH_COLORS: Record<string, string> = {
  'Python': '#3776AB', 'JavaScript': '#F7DF1E', 'TypeScript': '#3178C6',
  'React': '#61DAFB', 'Vue.js': '#4FC08D', 'Node.js': '#68A063',
  'TensorFlow': '#FF6F00', 'PyTorch': '#EE4C2C', 'Flutter': '#54C5F8',
  'Swift': '#FA7343', 'Kotlin': '#7F52FF', 'Blockchain': '#F7931A',
  'AR/VR': '#00C9A7', 'IoT': '#FFC75F', 'Computer Vision': '#845EC2',
  'NLP': '#D65DB1', 'ML/AI': '#FF6B6B', 'Data Science': '#F9F871',
  'WebXR': '#00D4AA', 'MongoDB': '#47A248', 'PostgreSQL': '#336791',
};

export const STATIC_PROJECTS: Project[] = [
  // AI & ML
  { id: 1,  name: 'MediScan AI',   student: 'Aisha Patel',     domain: 'ai-ml',
    tech: ['Python', 'TensorFlow', 'Computer Vision'],
    short: 'Detects skin conditions from photos using deep learning',
    full: 'MediScan AI uses a convolutional neural network trained on 50,000+ dermatology images to classify 12 common skin conditions. It achieves 89% accuracy, comparable to GP-level diagnosis in preliminary trials. The app runs on-device for full privacy.',
    tags: ['Healthcare', 'CNN', 'Medical Imaging'], emoji: '🔬', link: '#' },

  { id: 2,  name: 'LexiSense',     student: 'Marcus Webb',     domain: 'ai-ml',
    tech: ['Python', 'NLP', 'TensorFlow'],
    short: 'Reads legal documents and flags potential risks automatically',
    full: 'LexiSense is an NLP pipeline that parses contract language, identifies ambiguous clauses, and generates plain-English risk summaries. Built with a fine-tuned BERT model on a corpus of 10,000 UK contracts. Reduces legal review time by an estimated 60%.',
    tags: ['Legal Tech', 'NLP', 'Document Analysis'], emoji: '⚖️', link: '#' },

  { id: 3,  name: 'TrafficMind',   student: 'Yuki Tanaka',     domain: 'ai-ml',
    tech: ['Python', 'Computer Vision', 'IoT'],
    short: 'AI-powered traffic signal optimisation using real-time camera feeds',
    full: 'TrafficMind deploys edge-computing vision models at intersections to measure real-time vehicle density and dynamically adjust signal timing. Simulation results show a 34% reduction in average wait times. Hardware costs under £200 per junction.',
    tags: ['Smart Cities', 'Edge AI', 'Optimisation'], emoji: '🚦', link: '#' },

  // Health & Wellbeing
  { id: 4,  name: 'MindBridge',    student: 'Zara Ahmed',      domain: 'health',
    tech: ['React', 'Node.js', 'ML/AI'],
    short: 'Mental wellness app that detects early signs of burnout',
    full: 'MindBridge collects passive signals from typing patterns, calendar density, and optional self-reports to model burnout risk. When risk rises, it nudges users with science-backed micro-interventions. Built with full GDPR compliance and no data leaving the device.',
    tags: ['Mental Health', 'Wellbeing', 'Passive Sensing'], emoji: '🧠', link: '#' },

  { id: 5,  name: 'PhysioTrack',   student: 'Tom Eriksson',    domain: 'health',
    tech: ['Swift', 'Computer Vision', 'ML/AI'],
    short: 'Phone-based physiotherapy form correction using pose estimation',
    full: 'PhysioTrack uses the device camera and MediaPipe pose estimation to guide patients through physiotherapy exercises, giving real-time audio and visual feedback on form and tracking recovery milestones over weeks. 40 patients completed pilot with positive outcomes.',
    tags: ['Physiotherapy', 'Pose Estimation', 'Recovery'], emoji: '🏋️', link: '#' },

  { id: 6,  name: 'NutriLens',     student: 'Priya Sharma',    domain: 'health',
    tech: ['Flutter', 'Computer Vision', 'ML/AI'],
    short: 'Point your phone at food to instantly get nutritional information',
    full: 'NutriLens identifies meals from photos, estimates portion sizes using depth sensing, and calculates macro and micronutrient breakdowns. Integrates with Apple Health and Google Fit. Supports 480 food categories with 91% recognition accuracy.',
    tags: ['Nutrition', 'Computer Vision', 'Health Tracking'], emoji: '🥗', link: '#' },

  // Finance & FinTech
  { id: 7,  name: 'Grana',         student: 'Leo Okonkwo',     domain: 'finance',
    tech: ['React', 'Node.js', 'Data Science'],
    short: 'Gamified savings app designed for Gen Z spending habits',
    full: 'Grana combines behavioural economics with game mechanics to make saving compelling for 18–25 year olds. Users set "quests" (savings goals) and earn rewards for consistent contributions. Pilot users saved an average of 18% more per month versus the control group.',
    tags: ['Savings', 'Gamification', 'Gen Z'], emoji: '🎮', link: '#' },

  { id: 8,  name: 'CarbonLedger',  student: 'Mei Lin',         domain: 'finance',
    tech: ['Blockchain', 'Node.js', 'React'],
    short: 'Blockchain-verified carbon credit trading for SMEs',
    full: 'CarbonLedger provides small and medium businesses with a transparent, auditable marketplace for carbon credits built on Ethereum. Smart contracts automate verification and prevent double-counting. 12 SMEs onboarded in the pilot, trading 340 verified credits.',
    tags: ['Sustainability', 'Blockchain', 'Carbon Markets'], emoji: '🌿', link: '#' },

  { id: 9,  name: 'PayGuard',      student: 'Nia Clarke',      domain: 'finance',
    tech: ['Python', 'ML/AI', 'Data Science'],
    short: 'Real-time payment fraud detection using behavioural biometrics',
    full: 'PayGuard profiles user interaction patterns — typing rhythm, mouse speed, tap pressure — to build a continuous authentication model that detects account takeover attacks. Achieves 97.3% accuracy at sub-50ms latency. Designed to run as a bank API middleware.',
    tags: ['Fraud Detection', 'Biometrics', 'Security'], emoji: '🛡️', link: '#' },

  // Creative & Media
  { id: 10, name: 'AuralSpace',    student: 'Dante Russo',     domain: 'creative',
    tech: ['JavaScript', 'React', 'WebXR'],
    short: 'Compose music spatially — place instruments in 3D space with WebXR',
    full: "AuralSpace is a browser-based spatial audio DAW where users place virtual instruments in a 3D environment. The listener's position determines the mix, enabling truly immersive compositions. Used by two independent musicians to produce released tracks.",
    tags: ['Music', 'Spatial Audio', 'WebXR'], emoji: '🎵', link: '#' },

  { id: 11, name: 'Puppeteer',     student: 'Jade Wu',         domain: 'creative',
    tech: ['Python', 'Computer Vision', 'ML/AI'],
    short: 'Animate any character in real-time using just your webcam',
    full: 'Puppeteer maps facial expressions and body gestures to animated characters in real-time using MediaPipe landmark detection. Supports custom rigged characters via a drag-and-drop upload. Used by indie developers to prototype game animations without mocap hardware.',
    tags: ['Animation', 'Motion Capture', 'Real-time'], emoji: '🎭', link: '#' },

  { id: 12, name: 'StoryWeave',    student: 'Sam Obi',         domain: 'creative',
    tech: ['Python', 'NLP', 'React'],
    short: 'Collaborative AI fiction writing with branching narratives',
    full: 'StoryWeave is a co-writing platform where multiple users and an LLM co-author branching narratives. The system tracks story state, maintains character consistency, and suggests plot branches when momentum drops. Used in a secondary school creative writing class of 28 students.',
    tags: ['Creative Writing', 'LLM', 'Collaboration'], emoji: '📖', link: '#' },

  // Education & Learning
  { id: 13, name: 'QuizForge',     student: 'Ben Adeyemi',     domain: 'education',
    tech: ['Python', 'NLP', 'Vue.js'],
    short: 'Auto-generates adaptive quizzes from any study material',
    full: "QuizForge ingests lecture notes, PDFs, or web articles and generates personalised quiz questions calibrated to Bloom's taxonomy. A spaced-repetition engine schedules review. Students using QuizForge scored 14% higher on end-of-term exams in the pilot cohort.",
    tags: ['EdTech', 'NLP', 'Spaced Repetition'], emoji: '📝', link: '#' },

  { id: 14, name: 'LabSim',        student: 'Chloe Beaumont',  domain: 'education',
    tech: ['JavaScript', 'AR/VR', 'React'],
    short: 'Virtual chemistry lab with real physics and reaction simulation',
    full: 'LabSim provides a WebXR virtual chemistry lab where students safely perform experiments with real molecular physics simulation handling actual reaction pathways. Deployed in 3 secondary schools. Post-trial surveys showed a 28-point increase in lab confidence scores.',
    tags: ['Science Education', 'VR', 'Simulation'], emoji: '⚗️', link: '#' },

  { id: 15, name: 'TongueSwift',   student: 'Isabel Santos',   domain: 'education',
    tech: ['Flutter', 'NLP', 'ML/AI'],
    short: 'Language learning app that coaches your pronunciation with AI',
    full: 'TongueSwift analyses speech at the phoneme level, identifies accent-specific errors, and delivers targeted pronunciation drills with native-speaker comparison audio. Supports 14 languages. 500+ beta users with a 4.6/5 satisfaction rating after 30-day trials.',
    tags: ['Language Learning', 'Speech Recognition', 'Pronunciation'], emoji: '🗣️', link: '#' },

  // Social & Civic Tech
  { id: 16, name: 'CivicPulse',    student: 'Omar Hassan',     domain: 'social',
    tech: ['React', 'Data Science', 'Node.js'],
    short: 'Aggregates local civic issues from social media for councils',
    full: 'CivicPulse scrapes and clusters community complaints from Twitter, Nextdoor, and council portals using NLP topic modelling. Generates weekly heatmaps and priority reports for local government officers. Piloted with two London boroughs — reduced triage time by 45%.',
    tags: ['GovTech', 'NLP', 'Community'], emoji: '🏛️', link: '#' },

  { id: 17, name: 'SafeRoute',     student: 'Amara Diallo',    domain: 'social',
    tech: ['Flutter', 'Data Science', 'ML/AI'],
    short: 'Suggests the safest walking routes using live crime and lighting data',
    full: 'SafeRoute combines live crime API data, street lighting maps, and crowdsourced safety ratings to recommend optimal walking routes. Features real-time community alerts and an emergency contact ping system. 1,200 users in pilot; 89% reported feeling safer.',
    tags: ['Safety', 'Maps', 'Crowdsourcing'], emoji: '🗺️', link: '#' },

  { id: 18, name: 'FoodBridge',    student: 'Lena Kowalski',   domain: 'social',
    tech: ['React', 'Node.js', 'MongoDB'],
    short: 'Connects food surplus from restaurants to local food banks instantly',
    full: 'FoodBridge is a real-time surplus food redistribution platform. Restaurants log surplus; nearby food banks or volunteers claim it within minutes. Tracks CO₂ savings and waste diverted. Has redirected 4.2 tonnes of food in its 3-month pilot across 18 restaurants.',
    tags: ['Food Waste', 'Social Impact', 'Logistics'], emoji: '🍱', link: '#' },
];
