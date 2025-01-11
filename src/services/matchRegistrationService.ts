import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  Timestamp,
  where,
  orderBy,
  addDoc,
  query as firestoreQuery, // Rename to avoid conflict
} from 'firebase/firestore';
import { db } from '../firebase';
import { DropMatches, Match, UserProfile, MatchResponse, MatchOutcome, SuccessfulMatch } from '../types';
import { Notification, MatchDetails } from '../types/notifications';

const query = firestoreQuery;

export class MatchRegistrationService {
  // Create a notification for match response
  private static async createMatchResponseNotification(
    dropId: string,
    matchId: string,
    respondingUserId: string,
    otherParticipantId: string,
    response: 'accepted' | 'declined',
    dropTitle: string
  ): Promise<void> {
    try {
      const notificationRef = collection(db, 'users', otherParticipantId, 'notifications');
      
      const matchDetails: MatchDetails = {
        matchedUserId: respondingUserId,
        matchedUserName: '', // You might want to fetch the full name
        dropId,
        dropTitle,
        cuisineMatch: {
          preference: '' // You can populate this if needed
        },
        status: response,
        matchTime: new Date()
      };

      const notification: Notification = {
        id: '', // Firestore will generate this
        type: 'match',
        title: `Match ${response}`,
        message: `Your match for ${dropTitle} has been ${response}`,
        read: false,
        createdAt: new Date(),
        matchDetails,
        actionTaken: true
      };

      await addDoc(notificationRef, notification);
    } catch (error) {
      console.error('Error creating match response notification:', error);
    }
  }

  // Create a successful match record
  private static async createSuccessfulMatch(
    dropId: string,
    matchId: string,
    match: Match
  ): Promise<void> {
    try {
      const successfulMatchRef = doc(collection(db, 'successfulMatches'));
      
      const successfulMatch: SuccessfulMatch = {
        id: successfulMatchRef.id,
        dropId,
        participants: Object.entries(match.participants).reduce((acc, [userId, profile]) => {
          acc[userId] = {
            profile,
            matchedAt: Timestamp.now()
          };
          return acc;
        }, {} as SuccessfulMatch['participants']),
        matchDetails: {
          compatibility: match.compatibility,
          commonInterests: match.commonInterests,
          commonCuisines: match.commonCuisines
        },
        status: 'active',
        createdAt: Timestamp.now()
      };

      await setDoc(successfulMatchRef, successfulMatch);
    } catch (error) {
      console.error('Error creating successful match:', error);
    }
  }

  // Create a match outcome record
  static async createMatchOutcome(
    dropId: string,
    matchId: string,
    match: Match,
    overallStatus: 'successful' | 'unsuccessful'
  ): Promise<void> {
    try {
      console.log('Creating match outcome:', {
        dropId,
        matchId,
        match,
        overallStatus
      });

      const matchOutcomeRef = doc(collection(db, 'matchOutcomes'));
      
      // Get all participant data - ensure we include ALL participants
      const participantsData: Record<string, any> = {};
      const participantIds = Object.keys(match.participants);
      
      // Track responses
      const responses: string[] = [];

      for (const userId of participantIds) {
        const participantData = match.participants[userId];
        const response = match.responses?.[userId];

        // Destructure to avoid duplicate properties
        const { displayName, name, ...restParticipantData } = participantData || {};

        const responseStatus = response?.status === 'accepted' ? 'yes' : 'no';
        responses.push(responseStatus);

        participantsData[userId] = {
          profile: {
            displayName: name || displayName || userId,
            ...restParticipantData
          },
          response: responseStatus,
          respondedAt: response?.respondedAt || null
        };
      }

      // Determine match status based on new criteria
      let finalStatus: 'successful' | 'unsuccessful';
      if (responses.filter(r => r === 'yes').length === 2) {
        // Both said yes = successful
        finalStatus = 'successful';
      } else {
        // If anyone says no or both say no = unsuccessful
        finalStatus = 'unsuccessful';
      }

      const matchOutcome: MatchOutcome = {
        id: matchOutcomeRef.id,
        dropId,
        participants: participantsData,
        matchDetails: {
          compatibility: match.compatibility,
          commonInterests: match.commonInterests,
          commonCuisines: match.commonCuisines
        },
        status: finalStatus, // Use the dynamically determined status
        createdAt: Timestamp.now()
      };

      console.log('Final match outcome:', matchOutcome);

      await setDoc(matchOutcomeRef, matchOutcome);
    } catch (error) {
      console.error('Error creating match outcome:', error);
    }
  }

  // Log match details for debugging purposes
  static async logMatchDetails(dropId: string, matchId: string, userId: string) {
    try {
      const matchesRef = doc(db, 'dropMatches', dropId);
      const matchesDoc = await getDoc(matchesRef);

      if (!matchesDoc.exists()) {
        console.error(`No matches found for drop ${dropId}`);
        return;
      }

      const dropMatches = matchesDoc.data() as DropMatches;
      const match = dropMatches.matches[matchId];

      console.log('Match Details:', {
        dropId,
        matchId,
        match,
        userId
      });

      // Log matches collection document
      const participantIds = [userId, Object.keys(match.participants).find(id => id !== userId)!].sort();
      const matchDocId = `${participantIds[0]}_${participantIds[1]}_${matchId}`;
      const matchRef = doc(db, 'matches', matchDocId);
      const matchDoc = await getDoc(matchRef);

      if (matchDoc.exists()) {
        console.log('Existing Matches Collection Document:', matchDoc.data());
      } else {
        console.log('No existing document in matches collection');
      }
    } catch (error) {
      console.error('Error logging match details:', error);
    }
  }

  // Add this method to extensively log match details
  static async debugMatchOutcome(dropId: string, matchId: string, userId: string) {
    try {
      console.log('===== MATCH OUTCOME DEBUG START =====');
      
      // Check dropMatches collection
      const matchesRef = doc(db, 'dropMatches', dropId);
      const matchesDoc = await getDoc(matchesRef);

      if (!matchesDoc.exists()) {
        console.error(`No matches found for drop ${dropId}`);
        return;
      }

      const dropMatches = matchesDoc.data() as DropMatches;
      const match = dropMatches.matches[matchId];

      console.log('Drop Matches Document:', {
        dropId,
        matchId,
        match
      });

      // Check matches collection
      const participantIds = [userId, Object.keys(match.participants).find(id => id !== userId)!].sort();
      const matchDocId = `${participantIds[0]}_${participantIds[1]}_${matchId}`;
      const matchRef = doc(db, 'matches', matchDocId);
      const matchDoc = await getDoc(matchRef);

      if (matchDoc.exists()) {
        console.log('Matches Collection Document:', matchDoc.data());
      } else {
        console.log('No existing document in matches collection');
      }

      // Check matchOutcomes collection
      const matchOutcomesQuery = query(
        collection(db, 'matchOutcomes'), 
        where('dropId', '==', dropId),
        where('matchId', '==', matchId)
      );
      const matchOutcomesSnapshot = await getDocs(matchOutcomesQuery);

      if (!matchOutcomesSnapshot.empty) {
        console.log('Match Outcomes:');
        matchOutcomesSnapshot.forEach(doc => {
          console.log('Match Outcome Document:', doc.data());
        });
      } else {
        console.log('No match outcomes found');
      }

      console.log('===== MATCH OUTCOME DEBUG END =====');
    } catch (error) {
      console.error('Error debugging match outcome:', error);
    }
  }

  // Add a method to debug match details
  static async debugMatchDetails(dropId: string, matchId: string) {
    try {
      console.group('Match Details Debug');
      
      // Check dropMatches collection
      const matchesRef = doc(db, 'dropMatches', dropId);
      const matchesDoc = await getDoc(matchesRef);

      if (!matchesDoc.exists()) {
        console.error(`No dropMatches document found for drop ${dropId}`);
        console.log('Existing dropMatches collections:');
        const dropsMatchesQuery = query(collection(db, 'dropMatches'));
        const dropsMatchesSnapshot = await getDocs(dropsMatchesQuery);
        dropsMatchesSnapshot.forEach(doc => {
          console.log(`Drop ID: ${doc.id}`);
        });
        return false;
      }

      const dropMatches = matchesDoc.data() as DropMatches;
      console.log('Drop Matches Document:', dropMatches);

      // Get the existing match IDs
      const existingMatchIds = Object.keys(dropMatches.matches);
      console.log('Existing Match IDs:', existingMatchIds);

      // Try to find a match that involves both participants
      const matchParts = matchId.split('_');
      
      // More flexible matching logic
      const potentialMatchId = existingMatchIds.find(existingId => {
        // Check if all user IDs from the input match ID are in the existing match ID
        return matchParts.some(part => 
          part.length > 10 && existingId.includes(part)
        );
      });

      console.log('Potential Match ID:', potentialMatchId);

      const matchExists = !!potentialMatchId;
      console.log('Match Exists:', matchExists);

      if (!matchExists) {
        console.error(`Match ${matchId} not found in drop ${dropId}`);
        console.log('Existing Matches in Drop:', existingMatchIds);
      }

      console.groupEnd();
      return potentialMatchId || matchExists;
    } catch (error) {
      console.error('Error debugging match details:', error);
      console.groupEnd();
      return false;
    }
  }

  // Register a response for a match
  static async registerMatchResponse(
    dropId: string,
    matchId: string,
    userId: string,
    response: 'accepted' | 'declined'
  ): Promise<boolean> {
    try {
      console.log('Registering match response:', {
        dropId,
        matchId,
        userId,
        response
      });

      // Validate inputs
      if (!dropId || !matchId || !userId) {
        console.error('Invalid input: Missing required parameters', {
          dropId,
          matchId,
          userId
        });
        return false;
      }

      const matchesRef = doc(db, 'dropMatches', dropId);
      const matchesDoc = await getDoc(matchesRef);

      if (!matchesDoc.exists()) {
        console.error(`No matches found for drop ${dropId}`);
        return false;
      }

      const dropMatches = matchesDoc.data() as DropMatches;
      
      // Find the actual match ID in the dropMatches
      const matchParts = matchId.split('_');
      const actualMatchId = Object.keys(dropMatches.matches).find(existingId => 
        matchParts.some(part => part.length > 10 && existingId.includes(part))
      ) || matchParts.find(part => part.length > 10);

      if (!actualMatchId) {
        console.error(`Could not determine match ID from ${matchId}`);
        return false;
      }

      const match = dropMatches.matches[actualMatchId];

      if (!match) {
        console.error(`Match ${actualMatchId} not found in drop ${dropId}`);
        return false;
      }

      // Prepare the match response
      const matchResponse = {
        status: response,
        respondedAt: Timestamp.now()
      };

      // Update match responses in dropMatches
      const responsePath = `matches.${actualMatchId}.responses.${userId}`;
      await updateDoc(matchesRef, {
        [responsePath]: matchResponse
      });

      // Get all participants
      const allParticipants = Object.keys(match.participants);
      console.log('All participants:', allParticipants);

      const otherParticipantId = allParticipants.find(id => id !== userId);
      console.log('Other participant ID:', otherParticipantId);

      if (otherParticipantId) {
        // Create or update document in matches collection
        const participantIds = [userId, otherParticipantId].sort(); // Sort to ensure consistent ID
        const matchDocId = `${participantIds[0]}_${participantIds[1]}_${actualMatchId}`;
        const matchRef = doc(db, 'matches', matchDocId);

        // Fetch the latest match document to get the most up-to-date responses
        const matchDocument = await getDoc(matchRef);
        const existingMatchData = matchDocument.exists() ? matchDocument.data() : {};

        // Prepare updated match data
        const updatedMatchData = {
          ...existingMatchData,
          dropId,
          matchId: actualMatchId,
          participants: {
            ...existingMatchData.participants,
            [userId]: {
              ...(existingMatchData.participants?.[userId] || match.participants[userId]),
              response: response,
              respondedAt: Timestamp.now()
            }
          },
          status: 'pending',
          createdAt: existingMatchData.createdAt || Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        // Set or update the match document
        await setDoc(matchRef, updatedMatchData);

        // Refetch the match document to get the latest responses
        const updatedMatchDoc = await getDoc(matchRef);
        const latestMatchData = updatedMatchDoc.data();

        // Check if both participants have responded
        const responses = latestMatchData?.participants ? 
          Object.values(latestMatchData.participants)
            .filter((participant: any) => participant.response) : [];

        const bothResponded = responses.length === allParticipants.length;
        console.log('Both responded:', bothResponded);
        console.log('Responses:', responses);
        console.log('Participants:', allParticipants);

        if (bothResponded) {
          const bothAccepted = responses.every(
            (participant: any) => participant.response === 'accepted'
          );

          console.log('Both accepted:', bothAccepted);

          // Update status in matches collection
          await updateDoc(matchRef, {
            status: bothAccepted ? 'accepted' : 'declined',
            acceptedAt: bothAccepted ? Timestamp.now() : null
          });

          // Create match outcome
          if (bothAccepted) {
            console.log('Creating successful match outcome');
            await this.createMatchOutcome(dropId, actualMatchId, match, 'successful');
          } else {
            console.log('Creating unsuccessful match outcome');
            await this.createMatchOutcome(dropId, actualMatchId, match, 'unsuccessful');
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error registering match response:', error);
      
      // Log additional error details
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      return false;
    }
  }

  // Get match status for a user
  static async getMatchStatus(
    dropId: string,
    matchId: string
  ): Promise<Match | null> {
    try {
      const matchesRef = doc(db, 'dropMatches', dropId);
      const matchesDoc = await getDoc(matchesRef);

      if (!matchesDoc.exists()) {
        return null;
      }

      const dropMatches = matchesDoc.data() as DropMatches;
      return dropMatches.matches[matchId] || null;
    } catch (error) {
      console.error('Error getting match status:', error);
      return null;
    }
  }

  // Get successful matches for a user
  static async getUserSuccessfulMatches(userId: string): Promise<SuccessfulMatch[]> {
    try {
      const successfulMatchesRef = collection(db, 'successfulMatches');
      const q = query(
        successfulMatchesRef, 
        where(`participants.${userId}`, '!=', null),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SuccessfulMatch));
    } catch (error) {
      console.error('Error fetching successful matches:', error);
      return [];
    }
  }

  // Get match outcomes with optional status filtering
  static async getMatchOutcomes(status?: 'successful' | 'unsuccessful'): Promise<MatchOutcome[]> {
    try {
      const matchOutcomesRef = collection(db, 'matchOutcomes');
      
      // Base query for match outcomes - only use where clause without orderBy to avoid index requirement
      let q;
      if (status) {
        q = query(
          matchOutcomesRef, 
          where('status', '==', status)
        );
      } else {
        q = query(matchOutcomesRef);
      }

      // Fetch the documents
      const querySnapshot = await getDocs(q);
      
      // Convert to MatchOutcome array and sort in memory
      const matchOutcomes: MatchOutcome[] = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MatchOutcome))
        .sort((a, b) => {
          // Sort by createdAt in descending order
          const timeA = (a.createdAt as Timestamp).seconds;
          const timeB = (b.createdAt as Timestamp).seconds;
          return timeB - timeA;
        });

      // Double-check the status filter on the client side
      const filteredOutcomes = status 
        ? matchOutcomes.filter(match => match.status === status)
        : matchOutcomes;

      // Log the number of outcomes fetched
      console.log(`Fetched ${filteredOutcomes.length} ${status || 'total'} match outcomes`);

      return filteredOutcomes;
    } catch (error) {
      console.error('Error fetching match outcomes:', error);
      return [];
    }
  }
}
