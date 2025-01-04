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

export const generateMatches = async (dropId: string) => {
  try {
    // Get the drop
    const dropDoc = await getDocs(query(collection(db, 'drops'), where('id', '==', dropId)));
    const drop = { id: dropDoc.docs[0].id, ...dropDoc.docs[0].data() } as Drop;

    // Get all registered users for this drop
    const registeredUsers = drop.registeredUsers;
    
    // Fetch full user profiles
    const usersQuery = query(collection(db, 'users'), where('uid', 'in', registeredUsers));
    const userDocs = await getDocs(usersQuery);
    const users = userDocs.docs.map(doc => ({ ...doc.data() }) as UserProfile);

    // Calculate compatibility scores for all possible pairs
    const matches: Match[] = [];
    const usedUsers = new Set<string>();

    // Sort users by location first
    const usersByLocation: { [key: string]: UserProfile[] } = {};
    users.forEach(user => {
      if (!usersByLocation[user.location]) {
        usersByLocation[user.location] = [];
      }
      usersByLocation[user.location].push(user);
    });

    // For each location group
    Object.values(usersByLocation).forEach(locationUsers => {
      while (locationUsers.length >= 2) {
        const user1 = locationUsers[0];
        let bestMatch: MatchScore | null = null;
        let bestMatchIndex = -1;

        // Find best match for user1
        for (let i = 1; i < locationUsers.length; i++) {
          const user2 = locationUsers[i];
          if (usedUsers.has(user2.uid)) continue;

          // Calculate common interests and cuisines
          const commonInterests = user1.interests.filter(interest => 
            user2.interests.includes(interest)
          );
          const commonCuisines = user1.cuisinePreferences.filter(cuisine => 
            user2.cuisinePreferences.includes(cuisine)
          );

          // Calculate compatibility score
          const score = calculateCompatibilityScore(
            commonInterests.length,
            commonCuisines.length,
            user1.priceRange === user2.priceRange ? 1 : 0
          );

          if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
              userId: user2.uid,
              score,
              commonInterests,
              commonCuisines
            };
            bestMatchIndex = i;
          }
        }

        if (bestMatch && bestMatchIndex !== -1) {
          // Create match
          const match = await createMatch(
            [user1.uid, bestMatch.userId],
            dropId,
            bestMatch.commonInterests,
            bestMatch.commonCuisines
          );

          matches.push(match);
          usedUsers.add(user1.uid);
          usedUsers.add(bestMatch.userId);

          // Remove matched users from the pool
          locationUsers.splice(bestMatchIndex, 1);
          locationUsers.splice(0, 1);
        } else {
          // No match found for this user
          break;
        }
      }
    });

    // Update drop with match status
    await updateDoc(doc(db, 'drops', dropId), {
      status: 'matched',
      matchedAt: Timestamp.now()
    });

    return matches;
  } catch (error) {
    console.error('Error generating matches:', error);
    throw error;
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
  priceRangeMatch: number
): number => {
  // Weights for different factors
  const INTEREST_WEIGHT = 0.4;
  const CUISINE_WEIGHT = 0.4;
  const PRICE_WEIGHT = 0.2;

  // Calculate individual scores
  const interestScore = commonInterestsCount / 3; // Normalized by expecting 3 common interests
  const cuisineScore = commonCuisinesCount / 2; // Normalized by expecting 2 common cuisines
  const priceScore = priceRangeMatch;

  // Calculate weighted total score
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
