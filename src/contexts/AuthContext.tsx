import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, createDefaultUserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  signup: (email: string, password: string, additionalInfo?: Partial<UserProfile>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const userProfileFetchedRef = useRef<boolean>(false);

  const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  };

  const createUserProfile = async (
    firebaseUser: FirebaseUser, 
    email: string = '', 
    additionalInfo: Partial<UserProfile> = {}
  ): Promise<UserProfile> => {
    const userProfile = createDefaultUserProfile({
      uid: firebaseUser.uid,
      email: firebaseUser.email || email,
      displayName: additionalInfo.displayName || firebaseUser.email?.split('@')[0] || 'New User',
      ...additionalInfo
    });

    await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
    return userProfile;
  };

  const signup = async (
    email: string, 
    password: string, 
    additionalInfo: Partial<UserProfile> = {}
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userProfile = await createUserProfile(firebaseUser, email, additionalInfo);
      setUser(userProfile);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Don't fetch profile here, let the auth state listener handle it
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      userProfileFetchedRef.current = false;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !userProfileFetchedRef.current) {
        try {
          let profile = await fetchUserProfile(firebaseUser);
          if (!profile) {
            profile = await createUserProfile(firebaseUser);
          }
          setUser(profile);
          userProfileFetchedRef.current = true;
        } catch (error) {
          console.error('Error in auth state change:', error);
        }
      } else if (!firebaseUser) {
        setUser(null);
        userProfileFetchedRef.current = false;
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
