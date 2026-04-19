export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'athlete' | 'scout' | 'admin';
  sport?: string;
  preferredSport?: string;
  bio?: string;
  photoURL?: string;
  createdAt: number;
}

export interface Assessment {
  id: string;
  athleteId: string;
  athleteName: string;
  scoutId?: string;
  type?: 'scout' | 'self';
  sport: string;
  rank?: string;
  metrics: {
    speed: number;
    agility: number;
    strength: number;
    technique: number;
    stamina: number;
  };
  aiInsight: string;
  videoUrl?: string;
  videoAnalysis?: string;
  timestamp: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  imageUrl: string;
}

export interface RankingEntry {
  uid: string;
  name: string;
  score: number;
  rank: number;
  sport: string;
  location?: string;
  change: 'up' | 'down' | 'neutral';
}
