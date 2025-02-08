import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithRedirect,  
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut,
  getRedirectResult 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { Timestamp } from 'firebase/firestore';
// Analytics events will be handled by the analytics hook

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultUserProfile = (user: User): UserProfile => ({
  id: user.uid,
  uid: user.uid,
  name: user.displayName || 'New User',
  email: user.email || '',
  displayName: user.displayName || '',
  photoURL: user.photoURL || '',
  interests: [],
  cuisines: [],
  cuisinePreferences: [],
  location: '',
  bio: '',
  avatar: '',
  profilePicture: '',
  isAdmin: false,
  tempDisableAdmin: false,
  registeredDrops: [],
  profileComplete: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  streak: 0,
  totalMatches: 0,
  progress: 0,
  connections: 0,
  completedChallenges: [],
  meetingPreference: '',
  priceRange: ''
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          const userProfileRef = doc(db, 'users', firebaseUser.uid);
          const userProfileSnap = await getDoc(userProfileRef);
          
          if (userProfileSnap.exists()) {
            const profile = userProfileSnap.data() as UserProfile;
            setUser(profile);
            setIsAdmin(profile.isAdmin || false);
          } else {
            const newProfile = defaultUserProfile(firebaseUser);
            await setDoc(userProfileRef, newProfile);
            setUser(newProfile);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error('Error logging in:', err);
      setError(err instanceof Error ? err : new Error('Login error'));
    }
  };

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        const { user: firebaseUser } = result;

        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = getDoc(userRef).then((userDoc) => {
          let userProfile: UserProfile;
          if (!userDoc.exists()) {
            // Create a new user profile with minimal information
            userProfile = defaultUserProfile(firebaseUser);
            setDoc(userRef, userProfile);
            setUser(userProfile);
            // Analytics event will be handled by the analytics hook
          } else {
            // Existing user, but might need profile completion
            userProfile = userDoc.data() as UserProfile;
            
            // Ensure profile is not considered complete if key fields are missing
            if (!userProfile.displayName || userProfile.interests.length === 0) {
              userProfile.profileComplete = false;
            }
            
            setUser(userProfile);
          }
        });
      }
    });
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (err) {
      console.error('Error logging out:', err);
      setError(err instanceof Error ? err : new Error('Logout error'));
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
