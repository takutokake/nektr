import { Timestamp } from 'firebase/firestore';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Drop {
  id: string;
  title: string;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp;
  location: string;
  maxParticipants: number;
  participants: string[];
  theme: string;
  isSpecialEvent: boolean;
  icon?: any;
  
  registeredUsers: string[];
  currentParticipants: number;
  priceRange: string;
  status: 'upcoming' | 'matched' | 'completed';
  registrationDeadline: Timestamp;
}

export interface Match {
  id: string;
  users: string[];
  compatibility: number;
  matchedAt: Timestamp;
  
  dropId: string;
  commonInterests: string[];
  commonCuisines: string[];
  compatibilityScore: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Timestamp;
  meetingDetails: {
    location: string;
    time: Timestamp;
  };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  interests: string[];
  cuisinePreferences: string[];
  location: string;
  priceRange: string;
  isAdmin: boolean;
  streak: number;
  totalMatches: number;
  progress: number;
  connections: number;
  completedChallenges: string[];
  registeredDrops?: string[];
}

export interface DropRegistration {
  dropId: string;
  userId: string;
  registeredAt: Timestamp;
  status: 'pending' | 'confirmed' | 'matched' | 'cancelled';
}

// Default factory functions to help with initialization
export const createDefaultDrop = (partialDrop: Partial<Drop> = {}): Drop => ({
  id: partialDrop.id || '',
  title: partialDrop.title || 'Untitled Drop',
  description: partialDrop.description || '',
  startTime: partialDrop.startTime || Timestamp.now(),
  endTime: partialDrop.endTime || Timestamp.now(),
  location: partialDrop.location || 'TBD',
  maxParticipants: partialDrop.maxParticipants || 10,
  participants: partialDrop.participants || [],
  theme: partialDrop.theme || 'General',
  isSpecialEvent: partialDrop.isSpecialEvent || false,
  registeredUsers: partialDrop.registeredUsers || [],
  currentParticipants: partialDrop.currentParticipants || 0,
  priceRange: partialDrop.priceRange || '$',
  status: partialDrop.status || 'upcoming',
  registrationDeadline: partialDrop.registrationDeadline || Timestamp.now(),
});

export const createDefaultMatch = (partialMatch: Partial<Match> = {}): Match => ({
  id: partialMatch.id || '',
  users: partialMatch.users || [],
  compatibility: partialMatch.compatibility || 0,
  matchedAt: partialMatch.matchedAt || Timestamp.now(),
  dropId: partialMatch.dropId || '',
  commonInterests: partialMatch.commonInterests || [],
  commonCuisines: partialMatch.commonCuisines || [],
  compatibilityScore: partialMatch.compatibilityScore || 0,
  status: partialMatch.status || 'pending',
  createdAt: partialMatch.createdAt || Timestamp.now(),
  meetingDetails: partialMatch.meetingDetails || {
    location: 'TBD',
    time: Timestamp.now(),
  },
});

export const createDefaultUserProfile = (partialUser: Partial<UserProfile> = {}): UserProfile => ({
  uid: partialUser.uid || '',
  displayName: partialUser.displayName || 'New User',
  email: partialUser.email || '',
  photoURL: partialUser.photoURL || '',
  interests: partialUser.interests || [],
  cuisinePreferences: partialUser.cuisinePreferences || [],
  location: partialUser.location || '',
  priceRange: partialUser.priceRange || '$',
  isAdmin: partialUser.isAdmin || false,
  streak: partialUser.streak || 0,
  totalMatches: partialUser.totalMatches || 0,
  progress: partialUser.progress || 0,
  connections: partialUser.connections || 0,
  completedChallenges: partialUser.completedChallenges || [],
  registeredDrops: partialUser.registeredDrops || [],
});
