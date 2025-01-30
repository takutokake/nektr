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
  startTime: Timestamp;  // When matches are made and users meet
  registrationDeadline: Timestamp;  // Last time users can register
  location: string;
  maxParticipants: number;
  participants: string[];
  theme: string;
  isSpecialEvent: boolean;
  registeredUsers: string[];
  currentParticipants: number;
  priceRange: string;
  status: 'upcoming' | 'matched' | 'completed' | 'cancelled';
  matchGenerationAttempted?: boolean;
}

export interface MatchResponse {
  status: 'pending' | 'accepted' | 'declined';
  response?: 'accepted' | 'declined' | 'pending';
  respondedAt: Timestamp;
}

export interface Match {
  id: string;
  dropId: string;
  matchPairs: { [userId: string]: string };
  participants: {
    [userId: string]: UserProfile;
  };
  responses: {
    [userId: string]: MatchResponse;
  };
  compatibility: number;
  commonInterests: string[];
  commonCuisines: string[];
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  meetingDetails?: {
    location: string;
    time: Timestamp;
  };
  cuisinePreference: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  displayName: string;
  email: string;
  interests: string[];
  cuisines: string[];
  age?: number;
  gender?: string;
  profilePicture?: string;
  photoURL?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  dietaryRestrictions?: string[];
  socialMediaLinks?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  
  // Restored fields for compatibility
  isAdmin?: boolean;
  tempDisableAdmin?: boolean;
  registeredDrops?: string[];
  profileComplete?: boolean;
  streak?: number;
  totalMatches?: number;
  progress?: number;
  connections?: number;
  completedChallenges?: string[];
  meetingPreference?: string;
  priceRange?: string;
  cuisinePreferences?: string[];
}

export interface DropRegistration {
  dropId: string;
  userId: string;
  registeredAt: Timestamp;
  status: 'pending' | 'confirmed' | 'matched' | 'cancelled';
}

// Centralized Participants Collection
export interface DropParticipants {
  id: string;
  dropId: string;
  dropName: string;
  registeredAt: Timestamp;
  participants: {
    [userId: string]: {
      name: string;
      profileId: string;
      registeredAt: Timestamp;
      status: 'pending' | 'confirmed' | 'cancelled';
    };
  };
  registeredUsers?: {
    [userId: string]: UserProfile & { registeredAt: Timestamp };
  };
  totalParticipants: number;
  maxParticipants: number;
}

// Centralized Matches Collection
export interface DropMatches {
  dropId: string;
  dropName?: string;
  matches: {
    [matchId: string]: Match;
  };
  totalMatches: number;
}

export interface MatchInCollection {
  dropId: string;
  matchId: string;
  participants: {
    [userId: string]: {
      name: string;
      response?: 'accepted' | 'declined';
      respondedAt?: Timestamp;
      profile?: UserProfile;
    }
  };
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  acceptedAt?: Timestamp | null;
}

export interface SuccessfulMatch {
  id: string;
  dropId: string;
  participants: {
    [userId: string]: {
      profile: UserProfile;
      matchedAt: Timestamp;
    }
  };
  matchDetails: {
    compatibility: number;
    commonInterests: string[];
    commonCuisines: string[];
  };
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface MatchOutcome {
  id: string;
  dropId: string;
  participants: {
    [userId: string]: {
      profile: UserProfile;
      response: 'yes' | 'no';
      respondedAt: Timestamp;
    }
  };
  matchDetails: {
    compatibility: number;
    commonInterests: string[];
    commonCuisines: string[];
  };
  status: 'successful' | 'unsuccessful';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Timestamp;
  sender: string;
}

// Default factory functions to help with initialization
export const defaultUserProfile: UserProfile = {
  id: '',
  uid: '',
  displayName: '',
  name: '',
  email: '',
  gender: '',
  age: 0,
  location: '',
  interests: [],
  cuisines: [],
  cuisinePreferences: [],
  dietaryRestrictions: [],
  priceRange: '',
  socialMediaLinks: {}
};

export const createDefaultDrop = (partialDrop: Partial<Drop> = {}): Drop => ({
  id: partialDrop.id || '',
  title: partialDrop.title || 'Untitled Drop',
  description: partialDrop.description || '',
  startTime: partialDrop.startTime || Timestamp.now(),
  registrationDeadline: partialDrop.registrationDeadline || Timestamp.now(),
  location: partialDrop.location || 'TBD',
  maxParticipants: partialDrop.maxParticipants || 10,
  participants: partialDrop.participants || [],
  theme: partialDrop.theme || 'General',
  isSpecialEvent: partialDrop.isSpecialEvent || false,
  registeredUsers: partialDrop.registeredUsers || [],
  currentParticipants: partialDrop.currentParticipants || 0,
  priceRange: partialDrop.priceRange || '$',
  status: partialDrop.status || 'upcoming',
  matchGenerationAttempted: partialDrop.matchGenerationAttempted
});

export const createDefaultMatch = (partialMatch: Partial<Match> = {}): Match => ({
  id: partialMatch.id || '',
  dropId: partialMatch.dropId || '',
  matchPairs: partialMatch.matchPairs || {},
  participants: partialMatch.participants || {},
  responses: partialMatch.responses || {},
  compatibility: partialMatch.compatibility || 0,
  commonInterests: partialMatch.commonInterests || [],
  commonCuisines: partialMatch.commonCuisines || [],
  status: partialMatch.status || 'pending',
  meetingDetails: partialMatch.meetingDetails || {
    location: 'TBD',
    time: Timestamp.now(),
  },
  cuisinePreference: partialMatch.cuisinePreference || '', 
  createdAt: partialMatch.createdAt || Timestamp.now(),
  updatedAt: partialMatch.updatedAt,
});

export const createUserProfile = (partialUser: Partial<UserProfile>): UserProfile => ({
  id: partialUser.id || '',
  uid: partialUser.uid || '',
  name: partialUser.name || 'New User',
  displayName: partialUser.displayName || 'New User',
  email: partialUser.email || '',
  interests: partialUser.interests || [],
  cuisines: partialUser.cuisines || [],
  age: partialUser.age,
  gender: partialUser.gender,
  profilePicture: partialUser.profilePicture || partialUser.photoURL,
  photoURL: partialUser.photoURL || partialUser.profilePicture,
  avatar: partialUser.avatar,
  bio: partialUser.bio,
  location: partialUser.location,
  dietaryRestrictions: partialUser.dietaryRestrictions,
  socialMediaLinks: partialUser.socialMediaLinks,
  createdAt: partialUser.createdAt,
  updatedAt: partialUser.updatedAt,
  
  // Restored fields with default values
  isAdmin: partialUser.isAdmin || false,
  tempDisableAdmin: partialUser.tempDisableAdmin || false,
  registeredDrops: partialUser.registeredDrops || [],
  profileComplete: partialUser.profileComplete || false,
  streak: partialUser.streak || 0,
  totalMatches: partialUser.totalMatches || 0,
  progress: partialUser.progress || 0,
  connections: partialUser.connections || 0,
  completedChallenges: partialUser.completedChallenges || [],
  meetingPreference: partialUser.meetingPreference || '',
  priceRange: partialUser.priceRange || '',
  cuisinePreferences: partialUser.cuisinePreferences || partialUser.cuisines || []
});

export const createPartialUser = (partialUser: Partial<UserProfile>): UserProfile => ({
  ...defaultUserProfile,
  ...partialUser,
  priceRange: partialUser.priceRange || '',
  cuisinePreferences: partialUser.cuisinePreferences || partialUser.cuisines || []
});
