import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  interests: string[];
  cuisinePreferences: string[];
  location: string;
  priceRange: string;
  isAdmin?: boolean;
  
  // Add default values to prevent undefined errors
  streak: number;
  totalMatches: number;
  progress: number;
  connections: number;
  completedChallenges: string[];
}

export interface Drop {
  id: string;
  title: string;
  description: string;
  location: string;
  priceRange: string;
  maxParticipants: number;
  currentParticipants: number;
  startTime: Timestamp;
  registrationDeadline?: Timestamp;
  registeredUsers: string[];
  status: 'upcoming' | 'matched' | 'completed';
}

export interface DropRegistration {
  dropId: string;
  userId: string;
  email: string;
  displayName: string;
  registeredAt: Timestamp;
  status: 'pending' | 'confirmed' | 'matched' | 'cancelled';
}

export interface Match {
  id: string;
  dropId: string;
  users: string[];
  commonInterests: string[];
  commonCuisines: string[];
  compatibilityScore: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Timestamp;
  meetingDetails?: {
    location?: string;
    time?: Timestamp;
  };
}
