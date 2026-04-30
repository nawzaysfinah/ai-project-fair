export interface Domain {
  id: string;
  name: string;
  color: string;
  hex: number;
  icon: string;
  pos: { x: number; z: number };
}

export interface Member {
  name: string;
  linkedin: string;
}

export interface Project {
  id: number;
  name: string;
  student: string;      // derived: comma-separated member names
  domain: string;
  tech: string[];
  tags: string[];
  short: string;
  full: string;
  emoji: string;
  link: string;
  image_url?: string;
  members?: Member[];
  thumbnail?: string;
  user_id?: string;
}

export interface BoothMeta {
  project: Project;
  domain: Domain;
  isBooth: true;
}
