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
  phoneNumber: string;
  phoneNumberVerified: boolean;
  smsNotificationsEnabled: boolean;
  location?: string;
  priceRange?: string;
  id?: string;
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

export interface DropParticipant {
  name: string;
  profileId: string;
  registeredAt: Timestamp;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface DropParticipants {
  dropId: string;
  dropName: string;
  registeredAt: Timestamp;
  participants: Record<string, DropParticipant>;
  totalParticipants: number;
  maxParticipants: number;
}

export interface Drop {
  id: string;
  theme: string;
  description: string;
  startTime: Date;
  endTime: Date;
  participants: DropParticipants;
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
