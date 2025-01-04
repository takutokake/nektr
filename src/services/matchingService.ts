import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Drop, Match, createDefaultMatch } from '../types';

interface MatchScore {
  userId: string;
  score: number;
  commonInterests: string[];
  commonCuisines: string[];
}

export const generateDropMatches = async (dropId: string): Promise<Match[]> => {
  try {
    // Fetch drop details
    const dropsRef = collection(db, 'drops');
    const usersRef = collection(db, 'users');

    // Fetch all users registered for this drop
    const registeredUsersQuery = query(usersRef, where('registeredDrops', 'array-contains', dropId));
    const registeredUsersSnapshot = await getDocs(registeredUsersQuery);
    
    const registeredUsers: UserProfile[] = [];
    registeredUsersSnapshot.forEach((doc) => {
      registeredUsers.push(doc.data() as UserProfile);
    });

    // Calculate match scores
    const matchScores: MatchScore[] = [];
    for (let i = 0; i < registeredUsers.length; i++) {
      const user1 = registeredUsers[i];
      
      for (let j = i + 1; j < registeredUsers.length; j++) {
        const user2 = registeredUsers[j];
        
        const commonInterests = user1.interests.filter(
          interest => user2.interests.includes(interest)
        );
        
        const commonCuisines = user1.cuisinePreferences.filter(
          cuisine => user2.cuisinePreferences.includes(cuisine)
        );
        
        const score = calculateCompatibilityScore(
          commonInterests.length, 
          commonCuisines.length
        );
        
        matchScores.push({
          userId: user1.uid,
          score,
          commonInterests,
          commonCuisines
        });
      }
    }

    // Sort and select best matches
    const matches: Match[] = [];
    const usedUsers = new Set<string>();

    matchScores.sort((a, b) => b.score - a.score);

    matchScores.forEach((matchScore, index) => {
      if (!usedUsers.has(matchScore.userId)) {
        const bestMatchIndex = matchScores.findIndex(
          (m, idx) => 
            idx > index && 
            m.userId !== matchScore.userId && 
            !usedUsers.has(m.userId)
        );

        if (bestMatchIndex !== -1) {
          const bestMatch = matchScores[bestMatchIndex];
          
          const match = createDefaultMatch({
            users: [matchScore.userId, bestMatch.userId],
            dropId,
            commonInterests: bestMatch.commonInterests,
            commonCuisines: bestMatch.commonCuisines,
            compatibility: bestMatch.score
          });

          matches.push(match);
          usedUsers.add(matchScore.userId);
          usedUsers.add(bestMatch.userId);
        }
      }
    });

    // Update drop with match status
    await updateDoc(doc(db, 'drops', dropId), {
      status: 'matched',
    });

    return matches;
  } catch (error) {
    console.error('Error generating drop matches:', error);
    return [];
  }
};

export const createMatch = async (
  users: string[], 
  dropId: string, 
  commonInterests: string[], 
  commonCuisines: string[]
): Promise<Match> => {
  try {
    const matchData = createDefaultMatch({
      users,
      dropId,
      commonInterests,
      commonCuisines,
      compatibility: calculateCompatibility(commonInterests, commonCuisines),
      meetingDetails: {
        location: 'TBD',
        time: Timestamp.now()
      }
    });

    const matchRef = await addDoc(collection(db, 'matches'), matchData);
    return { ...matchData, id: matchRef.id };
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
};

const calculateCompatibility = (
  commonInterests: string[], 
  commonCuisines: string[]
): number => {
  // Simple compatibility calculation
  const interestWeight = 0.6;
  const cuisineWeight = 0.4;

  const interestScore = commonInterests.length * 10;
  const cuisineScore = commonCuisines.length * 10;

  return Math.min(
    (interestScore * interestWeight + cuisineScore * cuisineWeight), 
    100
  );
};

const calculateCompatibilityScore = (
  commonInterestsCount: number,
  commonCuisinesCount: number,
  INTEREST_WEIGHT = 0.6,
  CUISINE_WEIGHT = 0.4,
  PRICE_WEIGHT = 0
): number => {
  const interestScore = commonInterestsCount * 10;
  const cuisineScore = commonCuisinesCount * 10;
  const priceScore = 0; // Placeholder for future price compatibility

  return (
    interestScore * INTEREST_WEIGHT + 
    cuisineScore * CUISINE_WEIGHT + 
    priceScore * PRICE_WEIGHT
  ) * 100; // Convert to percentage
};

export const findPotentialMatches = async (
  user: UserProfile, 
  drop: Drop
): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('uid', '!=', user.uid),
      where('location', '==', user.location)
    );

    const querySnapshot = await getDocs(q);
    const potentialMatches: UserProfile[] = [];

    querySnapshot.forEach((doc) => {
      const potentialMatch = doc.data() as UserProfile;
      
      // Basic matching logic
      const commonInterests = user.interests.filter(
        interest => potentialMatch.interests.includes(interest)
      );

      const commonCuisines = user.cuisinePreferences.filter(
        cuisine => potentialMatch.cuisinePreferences.includes(cuisine)
      );

      if (commonInterests.length > 0 || commonCuisines.length > 0) {
        potentialMatches.push(potentialMatch);
      }
    });

    return potentialMatches;
  } catch (error) {
    console.error('Error finding potential matches:', error);
    return [];
  }
};

export const updateMatchDetails = async (
  matchId: string, 
  meetingDetails: { 
    location?: string | null; 
    time?: Timestamp | null; 
  }
): Promise<void> => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    
    await updateDoc(matchRef, {
      meetingDetails: {
        location: meetingDetails.location || 'TBD',
        time: meetingDetails.time || Timestamp.now()
      }
    });
  } catch (error) {
    console.error('Error updating match details:', error);
    throw error;
  }
};
