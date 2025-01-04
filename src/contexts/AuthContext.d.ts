import { UserProfile } from '../types';

export interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, profileData: Partial<UserProfile>) => Promise<void>;
}

export function useAuth(): AuthContextType;
