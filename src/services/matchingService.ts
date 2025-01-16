import { 
  Timestamp, 
  doc, 
  getDoc, 
  collection, 
  writeBatch, 
  query, 
  where, 
  documentId, 
  getDocs,
  QueryDocumentSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
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

// Helper function to select cuisine preference
const selectCuisinePreference = (user1Profile: UserProfile, user2Profile: UserProfile): string => {
  // Safely get cuisines, prioritizing cuisines over cuisinePreferences
  const user1Cuisines = [
    ...(user1Profile.cuisines || []),
    ...(user1Profile.cuisinePreferences || [])
  ].filter(c => c && c.toLowerCase() !== 'various');

  const user2Cuisines = [
    ...(user2Profile.cuisines || []),
    ...(user2Profile.cuisinePreferences || [])
  ].filter(c => c && c.toLowerCase() !== 'various');

  // Rule 1: If they have a matching cuisine, return that
  const commonCuisines = user1Cuisines.filter(
    cuisine => user2Cuisines.includes(cuisine)
  );

  if (commonCuisines.length > 0) {
    return commonCuisines[0];
  }

  // Rule 2: Combine and get unique specific cuisines
  const allSpecificCuisines = [...new Set([...user1Cuisines, ...user2Cuisines])];

  if (allSpecificCuisines.length > 0) {
    const selectedCuisine = allSpecificCuisines[Math.floor(Math.random() * allSpecificCuisines.length)];
    return selectedCuisine;
  }

  // Fallback to original cuisines or cuisinePreferences if all else fails
  const fallbackCuisines = [
    ...(user1Profile.cuisines || []),
    ...(user1Profile.cuisinePreferences || []),
    ...(user2Profile.cuisines || []),
    ...(user2Profile.cuisinePreferences || [])
  ].filter(c => c && c.toLowerCase() !== 'various');

  const fallbackCuisine = 
    fallbackCuisines[0] || 'Undecided';
  
  return fallbackCuisine;
};

// Select shared interests between two user profiles
export const selectSharedInterests = (
  user1Profile: UserProfile, 
  user2Profile: UserProfile
): string[] => {
  // Ensure interests exist and are arrays
  const user1Interests = user1Profile.interests || [];
  const user2Interests = user2Profile.interests || [];

  // Find common interests
  const commonInterests = user1Interests.filter(
    interest => user2Interests.includes(interest)
  );

  // If no common interests, select unique interests
  const uniqueInterests = commonInterests.length === 0 
    ? [...new Set([...user1Interests, ...user2Interests])]
    : [];

  // Prioritize common interests, then unique, then fallback
  const selectedInterests = 
    commonInterests.length > 0 ? commonInterests.slice(0, 3) :
    uniqueInterests.length > 0 ? uniqueInterests.slice(0, 3) :
    user1Interests.length > 0 ? user1Interests.slice(0, 3) :
    user2Interests.length > 0 ? user2Interests.slice(0, 3) :
    ['No Specific Interests'];

  return selectedInterests;
};

// Select shared cuisine preferences
const selectSharedCuisines = (user1Profile: UserProfile, user2Profile: UserProfile): string[] => {
  const user1Cuisines = user1Profile.cuisinePreferences || [];
  const user2Cuisines = user2Profile.cuisinePreferences || [];

  // Find common cuisines
  const commonCuisines = user1Cuisines.filter(cuisine => 
    user2Cuisines.includes(cuisine)
  );

  // If common cuisines exist, return up to 3
  if (commonCuisines.length > 0) {
    return commonCuisines.slice(0, 3);
  }

  // If no common cuisines, find unique cuisines from both users
  const uniqueCuisines = [
    ...(user1Cuisines.filter(cuisine => !user2Cuisines.includes(cuisine))),
    ...(user2Cuisines.filter(cuisine => !user1Cuisines.includes(cuisine)))
  ];

  // Return up to 3 unique cuisines
  return uniqueCuisines.length > 0 ? 
    uniqueCuisines.slice(0, 3) :
    ['No Specific Cuisine Preferences'];
};

// Get common interests or curated selection from users
const getCommonOrRandomInterest = (user1Interests: string[], user2Interests: string[]) => {
  // First, check for common interests
  const commonInterests = user1Interests.filter(interest => user2Interests.includes(interest));
  if (commonInterests.length > 0) {
    return commonInterests[0];
  }

  // If no common interests, try to find distinct cuisines
  const user1UniqueInterests = user1Interests.filter(interest => !user2Interests.includes(interest));
  const user2UniqueInterests = user2Interests.filter(interest => !user1Interests.includes(interest));

  // Prioritize having two different cuisines if possible
  if (user1UniqueInterests.length > 0 && user2UniqueInterests.length > 0) {
    return `${user1UniqueInterests[0]} & ${user2UniqueInterests[0]}`;
  }

  // If we can't find two distinct cuisines, fall back to a single cuisine
  if (user1UniqueInterests.length > 0) {
    return user1UniqueInterests[0];
  }
  if (user2UniqueInterests.length > 0) {
    return user2UniqueInterests[0];
  }

  // Predefined list of cuisines to ensure we never return 'Undecided'
  const fallbackCuisines = [
    'Italian', 'Japanese', 'Mexican', 'Indian', 'Thai', 
    'Chinese', 'Korean', 'Mediterranean', 'French', 'American'
  ];
  
  // If all else fails, return a random cuisine from the fallback list
  return fallbackCuisines[Math.floor(Math.random() * fallbackCuisines.length)];
};

// Get common or unique cuisine preferences
const getCommonOrRandomCuisine = (user1Cuisines: string[], user2Cuisines: string[]) => {
  // First, check for common interests
  const commonCuisines = user1Cuisines.filter(cuisine => user2Cuisines.includes(cuisine));
  if (commonCuisines.length > 0) {
    return commonCuisines[0];
  }

  // If no common interests, try to find distinct cuisines
  const user1UniqueCuisines = user1Cuisines.filter(cuisine => !user2Cuisines.includes(cuisine));
  const user2UniqueCuisines = user2Cuisines.filter(cuisine => !user1Cuisines.includes(cuisine));

  // Prioritize having two different cuisines if possible
  if (user1UniqueCuisines.length > 0 && user2UniqueCuisines.length > 0) {
    return `${user1UniqueCuisines[0]} & ${user2UniqueCuisines[0]}`;
  }

  // If we can't find two distinct cuisines, fall back to a single cuisine
  if (user1UniqueCuisines.length > 0) {
    return user1UniqueCuisines[0];
  }
  if (user2UniqueCuisines.length > 0) {
    return user2UniqueCuisines[0];
  }

  // Predefined list of cuisines to ensure we never return 'Undecided'
  const fallbackCuisines = [
    'Italian', 'Japanese', 'Mexican', 'Indian', 'Thai', 
    'Chinese', 'Korean', 'Mediterranean', 'French', 'American'
  ];
  
  // If all else fails, return a random cuisine from the fallback list
  return fallbackCuisines[Math.floor(Math.random() * fallbackCuisines.length)];
};

// Generate matches for a specific drop
export const generateDropMatches = async (dropId: string): Promise<void> => {
  try {
    console.group('Generate Drop Matches');
    console.log('Starting match generation for drop:', { dropId });

    // First check if matches already exist in dropMatches collection
    const dropMatchesRef = doc(db, 'dropMatches', dropId);
    const dropMatchesSnap = await getDoc(dropMatchesRef);
    
    if (dropMatchesSnap.exists()) {
      console.log('Matches already exist in dropMatches collection. Skipping generation.', {
        dropId,
        existingMatches: true
      });
      console.groupEnd();
      return;
    }

    // Fetch drop details and check match generation count
    const dropRef = doc(db, 'drops', dropId);
    const dropSnap = await getDoc(dropRef);
    const dropData = dropSnap.data() as any;

    if (!dropData) {
      console.error('Drop does not exist', { dropId });
      console.groupEnd();
      return;
    }

    // Check match generation count
    const matchGenerationCount = dropData.matchGenerationCount || 0;
    if (matchGenerationCount > 0) {
      console.log('Matches have already been generated once for this drop. Skipping.', {
        dropId,
        matchGenerationCount
      });
      console.groupEnd();
      return;
    }

    // Mark the drop as being processed and increment generation count
    await updateDoc(dropRef, {
      matchGenerationCount: 1,
      matchGenerationAttempted: true,
      matchGenerationStartedAt: Timestamp.now()
    });

    // Fetch participants for this drop
    const participantsRef = doc(db, 'dropParticipants', dropId);
    const participantsSnap = await getDoc(participantsRef);

    if (!participantsSnap.exists()) {
      console.error('No participants found for drop', { dropId });
      console.groupEnd();
      return;
    }

    const participantsData = participantsSnap.data() as any;

    const participantIds = Object.keys(participantsData.participants);
    const userRefs = participantIds.map(id => doc(db, 'users', id));
    const userSnaps = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', userRefs.map(ref => ref.id))));
    
    const userProfiles = new Map<string, UserProfile>();
    userSnaps.forEach(snap => {
      const userData = snap.data() as UserProfile;
      userProfiles.set(snap.id, userData);
    });

    // Validate participant count
    const validParticipantIds = participantIds.filter(id => userProfiles.has(id));
    if (validParticipantIds.length < 2) {
      return;
    }

    // Generate matches
    const matches: any[] = [];
    const matchedUsers = new Set<string>();

    for (let i = 0; i < validParticipantIds.length; i++) {
      for (let j = i + 1; j < validParticipantIds.length; j++) {
        const user1Id = validParticipantIds[i];
        const user2Id = validParticipantIds[j];

        // Skip if either user is already matched
        if (matchedUsers.has(user1Id) || matchedUsers.has(user2Id)) continue;

        const user1Profile = userProfiles.get(user1Id);
        const user2Profile = userProfiles.get(user2Id);

        // Ensure both profiles exist
        if (!user1Profile || !user2Profile) continue;

        // Calculate compatibility
        const compatibility = calculateMatchScoreFromProfiles(user1Profile, user2Profile);

        if (compatibility > 0) {
          const matchId = `${user1Id}_${user2Id}`;

          // Select shared interests
          const sharedInterests = selectSharedInterests(user1Profile, user2Profile);

          // Select shared cuisines
          const sharedCuisines = selectSharedCuisines(user1Profile, user2Profile);

          // Safely get participant details
          const user1Participant = (participantsData.participants && 
            typeof participantsData.participants === 'object') 
            ? (participantsData.participants as any)[user1Id] || {
              name: user1Profile.displayName || 'Unknown User',
              profileId: user1Id,
              registeredAt: Timestamp.now(),
              status: 'pending' as const
            }
            : {
              name: user1Profile.displayName || 'Unknown User',
              profileId: user1Id,
              registeredAt: Timestamp.now(),
              status: 'pending' as const
            };
          const user2Participant = (participantsData.participants && 
            typeof participantsData.participants === 'object') 
            ? (participantsData.participants as any)[user2Id] || {
              name: user2Profile.displayName || 'Unknown User',
              profileId: user2Id,
              registeredAt: Timestamp.now(),
              status: 'pending' as const
            }
            : {
              name: user2Profile.displayName || 'Unknown User',
              profileId: user2Id,
              registeredAt: Timestamp.now(),
              status: 'pending' as const
            };

          if (!user1Participant || !user2Participant) continue;

          // Create match object
          const match: any = {
            id: matchId,
            participants: {
              [user1Id]: convertToUserProfile({
                ...user1Participant,
                name: user1Profile.name || user1Participant.name
              }),
              [user2Id]: convertToUserProfile({
                ...user2Participant,
                name: user2Profile.name || user2Participant.name
              })
            },
            responses: {},
            compatibility,
            commonInterests: sharedInterests, 
            commonCuisines: sharedCuisines,
            status: 'pending',
            createdAt: Timestamp.now(),
            dropId,
            meetingDetails: {
              location: dropData.location,
              time: dropData.startTime
            },
            cuisinePreference: 
              (sharedCuisines.length > 0 
                ? (sharedCuisines.length > 1 
                  ? sharedCuisines.join(' & ') 
                  : sharedCuisines[0])
                : 'No Specific Cuisine Preferences')
          };

          matches.push(match);
          // Mark both users as matched
          matchedUsers.add(user1Id);
          matchedUsers.add(user2Id);
        }
      }
    }

    // Prepare matches document
    const matchData: DropMatches = {
      dropId,
      dropName: dropData.title,  
      matches: {},
      totalMatches: 0
    };

    // Prepare batch for all operations
    const batch = writeBatch(db);

    // Add matches to batch
    matches.forEach(match => {
      matchData.matches[match.id] = match;
      matchData.totalMatches++;
    });

    // Save drop matches
    batch.set(dropMatchesRef, matchData);

    // Create notifications for both matched and unmatched users
    // First, handle matched users
    matches.forEach(match => {
      const createNotificationForUser = (userId: string, matchedUserId: string, matchedUserName: string) => {
        const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
        
        // Ensure we have valid cuisine data
        const primaryCuisine = match.commonCuisines[0] || 'Various';
        const recommendedCuisine = match.commonCuisines.length > 1 ? match.commonCuisines[1] : null;
        
        const cuisineMatch = {
          preference: primaryCuisine,
          ...(recommendedCuisine && { recommendation: recommendedCuisine })
        };

        const notification = {
          type: 'match',
          title: 'New Match Found!',
          message: `You have been matched with ${matchedUserName} for ${dropData.title}!`,
          read: false,
          createdAt: Timestamp.now(),
          actionTaken: false,
          matchDetails: {
            matchedUserId: matchedUserId,
            matchedUserName: matchedUserName,
            dropId: dropId,
            dropTitle: dropData.title,
            cuisineMatch,
            commonInterests: match.commonInterests || ['No Specific Interests'], 
            status: 'pending',
            matchTime: Timestamp.now()
          }
        };

        batch.set(notificationRef, notification);
      };

      const participantEntries = Object.entries(match.participants);
      if (participantEntries.length >= 2) {
        const [user1, user2] = participantEntries;
        const user1Entry = user1 as [string, { name: string }];
        const user2Entry = user2 as [string, { name: string }];
        const user1Name = user1Entry[1].name || 'Unknown';
        const user2Name = user2Entry[1].name || 'Unknown';

        createNotificationForUser(user1Entry[0], user2Entry[0], user2Name);
        createNotificationForUser(user2Entry[0], user1Entry[0], user1Name);
      }
    });

    // Handle unmatched users
    const unmatchedUsers = validParticipantIds.filter(id => !matchedUsers.has(id));
    unmatchedUsers.forEach(userId => {
      const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
      const notification = {
        type: 'no-match',
        title: 'Maybe Next Time',
        message: `We couldn't find a match for you in this drop. Don't worry, keep trying!`,
        read: false,
        createdAt: Timestamp.now(),
        actionTaken: false,
        dropDetails: {
          dropId: dropId,
          dropTitle: dropData.title
        }
      };
      batch.set(notificationRef, notification);
    });

    // Commit batch
    await batch.commit();
  } catch (error) {
    // Silently handle errors
  }
};

// Get matches for a specific drop
export async function getDropMatches(dropId: string): Promise<any | null> {
  try {
    if (!dropId || dropId.trim() === '') {
      return null;
    }

    // Fetch drop details
    const dropRef = doc(db, 'drops', dropId);
    const dropDoc = await getDoc(dropRef);
    
    if (!dropDoc.exists()) {
      return null;
    }

    const dropData = dropDoc.data() as any;
    const currentTime = new Date();
    
    // Only log warning if the drop is in the past
    if (dropData.endTime && new Date(dropData.endTime) < currentTime) {
      return null;
    }

    // Fetch matches for the drop
    const matchesRef = doc(db, 'dropMatches', dropId);
    const matchesDoc = await getDoc(matchesRef);

    if (!matchesDoc.exists()) {
      return null;
    }

    const matchesData = matchesDoc.data();
    return {
      ...matchesData,
      dropId: dropId
    };
  } catch (error) {
    // Silently handle errors
    return null;
  }
};

// Get matches for a specific user
export const getUserMatches = async (userId: string): Promise<any[]> => {
  try {
    if (!userId) {
      return [];
    }

    const matchesRef = collection(db, 'dropMatches');
    const matchesSnap = await getDocs(matchesRef);
    
    const userMatches: any[] = [];

    matchesSnap.docs.forEach((doc: any) => {
      const dropMatchData = doc.data();
      
      // Check if the matches object exists and has any matches
      if (dropMatchData && typeof dropMatchData === 'object' && dropMatchData.matches && Object.keys(dropMatchData.matches).length > 0) {
        // Check if any match involves the user
        const userRelatedMatches = Object.values(dropMatchData.matches).filter((match: any) => 
          match && typeof match === 'object' && 
          match.participants && 
          Object.keys(match.participants || {}).includes(userId)
        );

        if (userRelatedMatches.length > 0) {
          userMatches.push({
            ...dropMatchData,
            matches: userRelatedMatches
          });
        }
      }
    });

    return userMatches;
  } catch (error) {
    // Silently handle errors
    return [];
  }
};

// Create notification for a user
const createNotificationForUser = async (userId: string, matchedUserId: string, matchedUserName: string) => {
  try {
    const userProfileRef = doc(db, 'userProfiles', userId);
    const matchedUserProfileRef = doc(db, 'userProfiles', matchedUserId);
    
    const [userProfileSnap, matchedUserProfileSnap] = await Promise.all([
      getDoc(userProfileRef),
      getDoc(matchedUserProfileRef)
    ]);

    const userProfile = userProfileSnap.data();
    const matchedUserProfile = matchedUserProfileSnap.data();

    if (!userProfile || !matchedUserProfile) {
      return;
    }

    const userCuisines = userProfile.cuisinePreferences || [];
    const matchedUserCuisines = matchedUserProfile.cuisinePreferences || [];
    
    const commonCuisine = getCommonOrRandomCuisine(userCuisines, matchedUserCuisines);

    const notification = {
      type: 'match',
      userId: userId,
      matchedUserId: matchedUserId,
      matchedUserName: matchedUserName,
      commonCuisine: commonCuisine,
      createdAt: Timestamp.now(),
      read: false
    };

    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, notification);
  } catch (error) {
    // Silently handle errors
  }
};
