export interface Domain {
  id: string;
  name: string;
  color: string;
  hex: number;
  icon: string;
  pos: { x: number; z: number };
}

export interface Project {
  id: number;
  name: string;
  student: string;
  domain: string;
  tech: string[];
  tags: string[];
  short: string;
  full: string;
  emoji: string;
  link: string;
  thumbnail?: string;
}

export interface BoothMeta {
  project: Project;
  domain: Domain;
  isBooth: true;
}
