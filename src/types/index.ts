import { Timestamp } from 'firebase/firestore';

export type MeetingType = 'platonic' | 'professional' | 'exploratory';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  interests: string[];
  meetingPreferences: string[];
  cuisinePreferences: string[];
  points: number;
  streak: number;
  badges: Badge[];
  completedChallenges: Challenge[];
  activeChallenges: Challenge[];
  matches: Match[];
  createdAt: Date;
  lastActive: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  unlockedAt: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  progress: number;
  target: number;
  startDate: Date;
  endDate: Date;
  isCompleted: boolean;
}

export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  meetingTime?: Date;
  meetingLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Drop {
  id: string;
  theme: string;
  description: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
  maxParticipants: number;
  isSpecialEvent: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
  streak: number;
  rank: number;
  avatarUrl?: string;
}
