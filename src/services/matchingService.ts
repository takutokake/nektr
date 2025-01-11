import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  Timestamp,
  setDoc,
  updateDoc,
  documentId
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Drop, 
  UserProfile, 
  Match, 
  DropParticipants, 
  DropMatches 
} from '../types';

// Calculate compatibility score between two users
export const calculateMatchScore = async (
  user1Id: string, 
  user2Id: string
): Promise<number> => {
  // Fetch user profiles
  const user1Ref = doc(db, 'users', user1Id);
  const user2Ref = doc(db, 'users', user2Id);
  
  const [user1Snap, user2Snap] = await Promise.all([
    getDoc(user1Ref),
    getDoc(user2Ref)
  ]);

  const user1 = user1Snap.data() as UserProfile;
  const user2 = user2Snap.data() as UserProfile;

  // Calculate compatibility based on interests and cuisines
  let score = 0;
  const commonInterests = user1.interests?.filter(
    interest => user2.interests?.includes(interest)
  ) || [];
  const commonCuisines = user1.cuisines?.filter(
    cuisine => user2.cuisines?.includes(cuisine)
  ) || [];

  // Score calculation logic
  score += commonInterests.length * 10;
  score += commonCuisines.length * 15;

  return score;
};

// Calculate compatibility score between users using their profiles
const calculateMatchScoreFromProfiles = (
  user1Profile: UserProfile,
  user2Profile: UserProfile
): number => {
  let score = 0;
  const commonInterests = user1Profile.interests?.filter(
    interest => user2Profile.interests?.includes(interest)
  ) || [];
  const commonCuisines = user1Profile.cuisines?.filter(
    cuisine => user2Profile.cuisines?.includes(cuisine)
  ) || [];

  score += commonInterests.length * 10;
  score += commonCuisines.length * 15;

  return score;
};

// Helper function to convert partial participant to full UserProfile
const convertToUserProfile = (participant: { 
  name: string; 
  profileId: string; 
  email?: string;
}): UserProfile => ({
  id: participant.profileId,
  uid: participant.profileId,
  name: participant.name,
  displayName: participant.name,
  email: participant.email || '',
  interests: [],
  cuisines: [],
  profilePicture: '',
  photoURL: ''
});

// Generate matches for a specific drop
export const generateDropMatches = async (dropId: string): Promise<void> => {
  try {
    console.log('Starting match generation for drop:', dropId);
    
    // Fetch drop and participants in parallel
    const [dropSnap, participantsSnap] = await Promise.all([
      getDoc(doc(db, 'drops', dropId)),
      getDoc(doc(db, 'dropParticipants', dropId))
    ]);

    if (!dropSnap.exists()) {
      console.error('Drop not found:', dropId);
      throw new Error('Drop not found');
    }

    const drop = dropSnap.data() as Drop;
    
    // Check if participants document exists and has participants
    const participantsData = participantsSnap.exists() 
      ? participantsSnap.data() as DropParticipants 
      : { 
          id: dropId, 
          dropId: dropId, 
          dropName: drop.title,
          registeredAt: Timestamp.now(),
          participants: {}, 
          totalParticipants: 0,
          maxParticipants: drop.maxParticipants || 10
        };

    const participantIds = Object.keys(participantsData.participants);
    console.log('Processing participants:', participantIds);

    // Validate participant count
    if (participantIds.length < 2) {
      console.warn(`Not enough participants for drop ${dropId}. Skipping match generation.`);
      return;
    }

    // Batch get all user profiles at once
    const userRefs = participantIds.map(id => doc(db, 'users', id));
    const userSnaps = await getDocs(query(
      collection(db, 'users'),
      where(documentId(), 'in', participantIds)
    ));
    
    // Create a map of user profiles for quick access
    const userProfiles = new Map<string, UserProfile>();
    userSnaps.forEach(snap => {
      userProfiles.set(snap.id, snap.data() as UserProfile);
    });

    // Validate user profiles
    const validParticipantIds = participantIds.filter(id => userProfiles.has(id));
    if (validParticipantIds.length < 2) {
      console.warn(`Not enough valid user profiles for drop ${dropId}. Skipping match generation.`);
      return;
    }

    // Prepare matches document
    const matchData: DropMatches = {
      dropId,
      dropName: drop.title,  // Optional, but included if available
      matches: {},
      totalMatches: 0
    };

    // Prepare batch for all operations
    const batch = writeBatch(db);

    // Generate matches using cached profiles
    for (let i = 0; i < validParticipantIds.length; i++) {
      for (let j = i + 1; j < validParticipantIds.length; j++) {
        const user1Id = validParticipantIds[i];
        const user2Id = validParticipantIds[j];

        const user1Profile = userProfiles.get(user1Id);
        const user2Profile = userProfiles.get(user2Id);

        if (!user1Profile || !user2Profile) continue;

        // Calculate match score using cached profiles
        const compatibility = calculateMatchScoreFromProfiles(user1Profile, user2Profile);
        
        // Create match if score is above threshold
        if (compatibility > 0) {
          const matchId = `${user1Id}_${user2Id}`;
          const participants: { [userId: string]: UserProfile } = {};

          participants[user1Id] = convertToUserProfile(participantsData.participants[user1Id]);
          participants[user2Id] = convertToUserProfile(participantsData.participants[user2Id]);

          const commonInterests = user1Profile.interests?.filter(
            interest => user2Profile.interests?.includes(interest)
          ) || [];
          const commonCuisines = user1Profile.cuisines?.filter(
            cuisine => user2Profile.cuisines?.includes(cuisine)
          ) || [];

          const matchDataEntry: Match = {
            id: matchId,
            participants,
            responses: {},
            compatibility,
            commonInterests,
            commonCuisines,
            status: 'pending',
            createdAt: Timestamp.now(),
            dropId
          };

          matchData.matches[matchId] = matchDataEntry;
          matchData.totalMatches++;

          // Create notifications for both users
          const createNotificationForUser = (userId: string, matchedUserId: string, matchedUserName: string) => {
            const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
            
            // Ensure we have valid cuisine data
            const primaryCuisine = commonCuisines[0] || 'Various';
            const recommendedCuisine = commonCuisines.length > 1 ? commonCuisines[1] : null;
            
            const cuisineMatch = {
              preference: primaryCuisine,
              ...(recommendedCuisine && { recommendation: recommendedCuisine })
            };

            const notification = {
              type: 'match',
              title: 'New Match Found!',
              message: `You have been matched with ${matchedUserName} for ${drop.title}!`,
              read: false,
              createdAt: Timestamp.now(),
              actionTaken: false,
              matchDetails: {
                matchedUserId: matchedUserId,
                matchedUserName: matchedUserName,
                dropId: dropId,
                dropTitle: drop.title,
                cuisineMatch,
                status: 'pending',
                matchTime: Timestamp.now()
              }
            };

            batch.set(notificationRef, notification);
          };

          createNotificationForUser(user1Id, user2Id, participantsData.participants[user2Id].name);
          createNotificationForUser(user2Id, user1Id, participantsData.participants[user1Id].name);
        }
      }
    }

    // Save drop matches
    const dropMatchesRef = doc(db, 'dropMatches', dropId);
    batch.set(dropMatchesRef, matchData);

    // Commit batch
    await batch.commit();

    console.log(`Generated ${matchData.totalMatches} matches for drop ${dropId}`);
  } catch (error) {
    console.error('Error in generateDropMatches:', error);
    throw error;
  }
};

// Get matches for a specific drop
export async function getDropMatches(dropId: string): Promise<DropMatches | null> {
  try {
    if (!dropId || dropId.trim() === '') {
      console.warn('Invalid drop ID for match retrieval');
      return null;
    }

    const matchesRef = doc(db, 'dropMatches', dropId);
    const matchesDoc = await getDoc(matchesRef);

    if (!matchesDoc.exists()) {
      // Only log for past drops, not upcoming drops
      const dropRef = doc(db, 'drops', dropId);
      const dropDoc = await getDoc(dropRef);
      
      if (dropDoc.exists()) {
        const dropData = dropDoc.data() as Drop;
        const currentTime = new Date();
        
        // Only log warning if the drop is in the past
        if (dropData.registrationDeadline.toDate() < currentTime) {
          console.warn(`No matches found for past drop ${dropId}`);
        }
      }
      
      return null;
    }

    const matchesData = matchesDoc.data() as DropMatches;
    return {
      ...matchesData,
      dropId: dropId
    };
  } catch (error) {
    console.error(`Error retrieving matches for drop ${dropId}:`, error);
    return null;
  }
};

// Get matches for a specific user
export const getUserMatches = async (userId: string): Promise<DropMatches[]> => {
  try {
    if (!userId) {
      console.warn('No user ID provided for match retrieval');
      return [];
    }

    const matchesRef = collection(db, 'dropMatches');
    const matchesSnap = await getDocs(matchesRef);
    
    const userMatches: DropMatches[] = [];

    matchesSnap.docs.forEach(doc => {
      const dropMatchData = doc.data() as DropMatches;
      
      // Check if the matches object exists and has any matches
      if (dropMatchData.matches && Object.keys(dropMatchData.matches).length > 0) {
        // Check if any match contains the user
        const userDropMatches = Object.entries(dropMatchData.matches)
          .filter(([_, match]) => 
            match.participants && 
            Object.keys(match.participants).includes(userId)
          );

        if (userDropMatches.length > 0) {
          userMatches.push(dropMatchData);
        }
      }
    });

    return userMatches;
  } catch (error) {
    console.error('Error fetching user matches:', error);
    return [];
  }
};
