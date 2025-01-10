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
    if (!participantsSnap.exists()) {
      console.error('No participants found for drop:', dropId);
      throw new Error('No participants found');
    }

    const drop = dropSnap.data() as Drop;
    const participantsData = participantsSnap.data() as DropParticipants;
    console.log('Found drop and participants');

    // Get all participant IDs
    const participantIds = Object.keys(participantsData.participants);
    console.log('Processing participants:', participantIds);

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

    // Prepare matches document
    const dropMatches: DropMatches = {
      dropId: dropId,
      dropName: drop.title,
      matches: {},
      totalMatches: 0
    };

    // Prepare batch for all operations
    const batch = writeBatch(db);

    // Generate matches using cached profiles
    for (let i = 0; i < participantIds.length; i++) {
      for (let j = i + 1; j < participantIds.length; j++) {
        const user1Id = participantIds[i];
        const user2Id = participantIds[j];

        const user1Profile = userProfiles.get(user1Id);
        const user2Profile = userProfiles.get(user2Id);

        if (!user1Profile || !user2Profile) continue;

        // Calculate match score using cached profiles
        const compatibility = calculateMatchScoreFromProfiles(user1Profile, user2Profile);
        
        // Create match if score is above threshold
        if (compatibility > 0) {
          const matchId = `${user1Id}_${user2Id}`;
          const commonInterests = user1Profile.interests?.filter(
            interest => user2Profile.interests?.includes(interest)
          ) || [];
          const commonCuisines = user1Profile.cuisines?.filter(
            cuisine => user2Profile.cuisines?.includes(cuisine)
          ) || [];

          const matchData = {
            participants: {
              [user1Id]: {
                name: participantsData.participants[user1Id].name,
                profileId: user1Id
              },
              [user2Id]: {
                name: participantsData.participants[user2Id].name,
                profileId: user2Id
              }
            },
            compatibility,
            commonInterests,
            commonCuisines,
            status: 'pending' as const,
            createdAt: Timestamp.now()
          };

          dropMatches.matches[matchId] = matchData;
          dropMatches.totalMatches++;

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

          // Create notifications for both users
          createNotificationForUser(user1Id, user2Id, user2Profile.name || 'Anonymous');
          createNotificationForUser(user2Id, user1Id, user1Profile.name || 'Anonymous');
        }
      }
    }

    // Write matches and update drop status in the batch
    const matchesRef = doc(db, 'dropMatches', dropId);
    batch.set(matchesRef, dropMatches);
    batch.update(doc(db, 'drops', dropId), { status: 'matched' });
    
    // Commit all changes (matches, notifications, and drop status update)
    await batch.commit();
    console.log('Successfully wrote matches, notifications, and updated drop status');

  } catch (error) {
    console.error('Error in generateDropMatches:', error);
    throw error;
  }
};

// Get matches for a specific drop
export const getDropMatches = async (dropId: string): Promise<DropMatches | null> => {
  const matchesRef = doc(db, 'dropMatches', dropId);
  const matchesSnap = await getDoc(matchesRef);
  
  return matchesSnap.exists() 
    ? matchesSnap.data() as DropMatches 
    : null;
};

// Get matches for a specific user
export const getUserMatches = async (userId: string): Promise<DropMatches[]> => {
  // Query all drop matches where the user is a participant
  const matchesQuery = query(
    collection(db, 'dropMatches'),
    where(`matches.*.participants.${userId}`, '!=', null)
  );

  const matchesSnap = await getDocs(matchesQuery);
  
  return matchesSnap.docs.map(doc => doc.data() as DropMatches);
};
