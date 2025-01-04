import React, { createContext, useState, useContext, useEffect } from 'react';
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

  const signup = async (
    email: string, 
    password: string, 
    additionalInfo: Partial<UserProfile> = {}
  ) => {
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      const userProfile: UserProfile = createDefaultUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || email,
        displayName: additionalInfo.displayName || firebaseUser.email?.split('@')[0] || 'New User',
        ...additionalInfo
      });

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);

      setUser(userProfile);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        setUser(userDoc.data() as UserProfile);
      } else {
        // Create profile if it doesn't exist
        const userProfile: UserProfile = createDefaultUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email || email,
          displayName: firebaseUser.displayName || email.split('@')[0] || 'New User'
        });

        await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            // Create profile if it doesn't exist
            const userProfile: UserProfile = createDefaultUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User'
            });

            await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
            setUser(userProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUser(null);
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
