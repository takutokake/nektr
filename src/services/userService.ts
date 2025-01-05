import { 
  doc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { UserProfile } from '../types';

// Add local cache for user profiles
const userProfileCache = new Map<string, {
  data: UserProfile;
  timestamp: number;
}>();

export const updateUserProfile = async (
  uid: string, 
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
    userProfileCache.delete(uid); // Clear cache after update
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const uploadProfilePicture = async (
  uid: string, 
  file: File
): Promise<string> => {
  try {
    // Create a reference to the profile picture location
    const profilePicRef = ref(storage, `profilePictures/${uid}`);
    
    // Upload the file
    const snapshot = await uploadBytes(profilePicRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update user profile with new photo URL
    await updateUserProfile(uid, { photoURL: downloadURL });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    // Check cache validity (5 minutes)
    const cached = userProfileCache.get(uid);
    const now = Date.now();
    if (cached && now - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const profile = userSnap.data() as UserProfile;
      userProfileCache.set(uid, { data: profile, timestamp: now });
      return profile;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
