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
import { twilioService } from './twilioService';
import { getUserProfile } from './userService';

const query = firestoreQuery;

export class MatchRegistrationService {
  // Create a notification for match response
  static async createMatchResponseNotification(
    dropId: string,
    matchId: string,
    respondingUserId: string,
    otherParticipantId: string,
    response: 'accepted' | 'declined',
    dropTitle: string
  ): Promise<void> {
    try {
      const notificationRef = collection(db, 'users', otherParticipantId, 'notifications');
      
      // Log ALL matches in the drop to understand the context
      const matchesCollectionRef = collection(db, 'dropMatches', dropId, 'matches');
      const matchesSnapshot = await getDocs(matchesCollectionRef);
      const allMatchesData: any[] = [];
      matchesSnapshot.forEach(doc => {
        allMatchesData.push({
          id: doc.id,
          data: doc.data()
        });
      });
      
      console.error('ALL MATCHES IN DROP:', {
        dropId,
        matchCount: allMatchesData.length,
        matchesData: allMatchesData
      });
      
      // Fetch match details to get cuisine preference and common interests
      const matchRef = doc(db, 'dropMatches', dropId, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);
      const matchData = matchSnap.data() as Match;

      console.error('FULL Match Data for Notification:', {
        matchId,
        dropId,
        matchData: {
          commonInterests: matchData.commonInterests,
          commonCuisines: matchData.commonCuisines,
          participants: Object.keys(matchData.participants)
        }
      });

      // Intelligent cuisine preference handling
      const cuisinePreference = 
        (matchData.cuisinePreference && matchData.cuisinePreference.toLowerCase() !== 'various')
          ? matchData.cuisinePreference
          : (matchData.commonCuisines?.[0] || 'Undecided');

      // Get the name of the matched user
      const matchedUser = Object.entries(matchData.participants)
        .find(([userId]) => userId !== otherParticipantId)?.[1];

      // Determine common interests with explicit default
      const commonInterests = matchData.commonInterests && matchData.commonInterests.length > 0
        ? matchData.commonInterests
        : ['No Specific Interests'];

      console.error('Extracted Common Interests:', {
        commonInterests,
        matchDataCommonInterests: matchData.commonInterests,
        matchDataKeys: Object.keys(matchData)
      });

      const matchDetails: MatchDetails = {
        matchedUserId: respondingUserId,
        matchedUserName: matchedUser?.displayName || matchedUser?.name || 'Unknown',
        dropId,
        dropTitle,
        cuisineMatch: {
          preference: cuisinePreference === 'Various' 
            ? (matchData.commonCuisines?.[0] || 'Undecided')
            : cuisinePreference,
          recommendation: matchData.commonCuisines?.[1] || undefined
        },
        commonInterests, // Explicitly set commonInterests
        status: response,
        matchTime: new Date()
      };

      console.error('Match Details for Notification:', {
        matchDetails: {
          commonInterests: matchDetails.commonInterests,
          matchedUserName: matchDetails.matchedUserName
        }
      });

      const notification: Notification = {
        id: '', // Firestore will generate this
        type: 'match',
        title: `Match ${response}`,
        message: `Your match for ${dropTitle} has been ${response}`,
        read: false,
        createdAt: new Date(),
        matchDetails: {
          ...matchDetails,
          commonInterests: commonInterests // Explicitly add commonInterests to matchDetails
        },
        actionTaken: true
      };

      console.error('Final Notification Object:', {
        notificationMatchDetails: notification.matchDetails,
        commonInterests: notification.matchDetails?.commonInterests || ['No Specific Interests']
      });

      await addDoc(notificationRef, notification);
    } catch (error) {
      console.error('Error creating match response notification:', error);
    }
  }

  // Create a successful match record
  static async createSuccessfulMatch(
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
      console.group('Creating Match Outcome');
      console.log('1. Starting match outcome creation:', {
        dropId,
        matchId,
        overallStatus,
        timestamp: new Date().toISOString()
      });

      const matchOutcomeRef = doc(collection(db, 'matchOutcomes'));
      
      // Get all participant data - ensure we include ALL participants
      const participantsData: Record<string, any> = {};
      const participantIds = Object.keys(match.participants);
      
      console.log('2. Processing participants:', {
        participantIds,
        timestamp: new Date().toISOString()
      });

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

      console.log('3. Participant responses:', {
        responses,
        timestamp: new Date().toISOString()
      });

      const matchOutcome = {
        id: matchOutcomeRef.id,
        dropId,
        participants: participantsData,
        matchDetails: {
          compatibility: match.compatibility,
          commonInterests: match.commonInterests,
          commonCuisines: match.commonCuisines
        },
        status: overallStatus,
        createdAt: Timestamp.now()
      };

      console.log('4. Creating match outcome document:', {
        matchOutcome,
        timestamp: new Date().toISOString()
      });

      await setDoc(matchOutcomeRef, matchOutcome);
      console.log('5. Match outcome created successfully');
      console.groupEnd();
    } catch (error) {
      console.error('Error creating match outcome:', error);
      console.groupEnd();
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
      const matchesRef = doc(db, 'dropMatches', dropId);
      const matchesDoc = await getDoc(matchesRef);

      if (!matchesDoc.exists()) {
        console.error(`No matches found for drop ${dropId}`);
        return;
      }

      const dropMatches = matchesDoc.data() as DropMatches;
      const match = dropMatches.matches[matchId];

      const participantIds = [userId, Object.keys(match.participants).find(id => id !== userId)!].sort();
      const matchDocId = `${participantIds[0]}_${participantIds[1]}_${matchId}`;
      const matchRef = doc(db, 'matches', matchDocId);
      const matchDoc = await getDoc(matchRef);

      if (matchDoc.exists()) {
        console.log('Matches Collection Document:', matchDoc.data());
      } else {
        console.log('No existing document in matches collection');
      }

      const matchOutcomesQuery = query(
        collection(db, 'matchOutcomes'), 
        where('dropId', '==', dropId),
        where('matchId', '==', matchId)
      );
      const matchOutcomesSnapshot = await getDocs(matchOutcomesQuery);

      if (!matchOutcomesSnapshot.empty) {
        matchOutcomesSnapshot.forEach(doc => {
          console.log('Match Outcome Document:', doc.data());
        });
      } else {
        console.log('No match outcomes found');
      }
    } catch (error) {
      console.error('Error debugging match outcome:', error);
    }
  }

  // Add a method to debug match details
  static async debugMatchDetails(dropId: string, matchId: string) {
    try {
      const matchesRef = doc(db, 'dropMatches', dropId);
      const matchesDoc = await getDoc(matchesRef);

      if (!matchesDoc.exists()) {
        console.error(`No dropMatches document found for drop ${dropId}`);
        const dropsMatchesQuery = query(collection(db, 'dropMatches'));
        const dropsMatchesSnapshot = await getDocs(dropsMatchesQuery);
        dropsMatchesSnapshot.forEach(doc => {
          console.log(`Drop ID: ${doc.id}`);
        });
        return false;
      }

      const dropMatches = matchesDoc.data() as DropMatches;

      const existingMatchIds = Object.keys(dropMatches.matches);

      const matchParts = matchId.split('_');
      
      const potentialMatchId = existingMatchIds.find(existingId => {
        return matchParts.some(part => 
          part.length > 10 && existingId.includes(part)
        );
      });

      const matchExists = !!potentialMatchId;

      if (!matchExists) {
        console.error(`Match ${matchId} not found in drop ${dropId}`);
        console.log('Existing Matches in Drop:', existingMatchIds);
      }

      return potentialMatchId || matchExists;
    } catch (error) {
      console.error('Error debugging match details:', error);
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
      console.group('MatchRegistrationService.registerMatchResponse');
      console.log('1. Starting match registration:', {
        dropId,
        matchId,
        userId,
        response,
        timestamp: new Date().toISOString()
      });

      const matchesRef = doc(db, 'dropMatches', dropId);
      const matchesDoc = await getDoc(matchesRef);

      if (!matchesDoc.exists()) {
        console.error('2. Error: No matches found for drop', {
          dropId,
          timestamp: new Date().toISOString()
        });
        console.groupEnd();
        return false;
      }

      const dropMatches = matchesDoc.data() as DropMatches;
      
      const matchParts = matchId.split('_');
      const actualMatchId = Object.keys(dropMatches.matches).find(existingId => 
        matchParts.some(part => part.length > 10 && existingId.includes(part))
      ) || matchParts.find(part => part.length > 10);

      if (!actualMatchId) {
        console.error('3. Error: Could not determine match ID', {
          matchId,
          matchParts,
          timestamp: new Date().toISOString()
        });
        console.groupEnd();
        return false;
      }

      console.log('4. Found actual match ID:', {
        actualMatchId,
        originalMatchId: matchId,
        timestamp: new Date().toISOString()
      });

      const match = dropMatches.matches[actualMatchId];

      if (!match) {
        console.error('5. Error: Match not found in drop', {
          actualMatchId,
          dropId,
          timestamp: new Date().toISOString()
        });
        console.groupEnd();
        return false;
      }

      // Update response in dropMatches collection first
      const dropMatchResponse = {
        response: response,
        respondedAt: Timestamp.now()
      };

      // Update in dropMatches collection
      await updateDoc(matchesRef, {
        [`matches.${actualMatchId}.responses.${userId}`]: dropMatchResponse
      });

      console.log('6. Updated response in dropMatches:', {
        userId,
        response,
        timestamp: new Date().toISOString()
      });

      const allParticipants = Object.keys(match.participants);
      const otherParticipantId = allParticipants.find(id => id !== userId);

      if (otherParticipantId) {
        console.log('7. Found other participant:', {
          otherParticipantId,
          timestamp: new Date().toISOString()
        });

        const participantIds = [userId, otherParticipantId].sort(); 
        const matchDocId = `${participantIds[0]}_${participantIds[1]}_${actualMatchId}`;
        const matchRef = doc(db, 'matches', matchDocId);

        // Get current match data
        const matchDocument = await getDoc(matchRef);
        const existingMatchData = matchDocument.exists() ? matchDocument.data() : {};

        // Update the current user's response
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

        console.log('8. Updating match document:', {
          matchDocId,
          updatedMatchData,
          timestamp: new Date().toISOString()
        });

        await setDoc(matchRef, updatedMatchData);

        // Get fresh data after update
        const matchesDocAfterUpdate = await getDoc(matchesRef);
        const updatedDropMatches = matchesDocAfterUpdate.data() as DropMatches;
        const currentMatch = updatedDropMatches.matches[actualMatchId];

        // Get all responses from dropMatches
        const responses = currentMatch?.responses || {};
        const participantResponses = Object.entries(responses).map(([id, data]: [string, any]) => ({
          userId: id,
          response: data.response,
          respondedAt: data.respondedAt?.toDate() || new Date()
        }));

        console.log('9. Current participant responses:', {
          responseCount: participantResponses.length,
          requiredCount: allParticipants.length,
          responses: participantResponses.map(r => ({
            userId: r.userId,
            response: r.response
          })),
          timestamp: new Date().toISOString()
        });

        // If first user declines, mark as unsuccessful immediately
        if (participantResponses.length === 1 && response === 'declined') {
          console.log('10. First user declined - marking as unsuccessful');
          await updateDoc(matchRef, {
            status: 'declined',
            acceptedAt: null
          });
          await this.createMatchOutcome(dropId, actualMatchId, match, 'unsuccessful');
          console.groupEnd();
          return true;
        }

        // Only proceed if both participants have actually responded
        const bothResponded = participantResponses.length === allParticipants.length;
        
        if (bothResponded) {
          console.log('11. Both participants have responded');

          // Sort responses chronologically
          const sortedResponses = participantResponses
            .sort((a, b) => a.respondedAt.getTime() - b.respondedAt.getTime());

          console.log('12. Responses in chronological order:', {
            sortedResponses: sortedResponses.map(r => ({
              userId: r.userId,
              response: r.response,
              respondedAt: r.respondedAt.toISOString()
            })),
            timestamp: new Date().toISOString()
          });

          // Rule: If any user declines, match is unsuccessful
          if (sortedResponses.some(r => r.response === 'declined')) {
            console.log('13. Match unsuccessful - One user declined');
            console.log('Match decline details:', {
              dropId,
              matchId: actualMatchId,
              match,
              sortedResponses,
              declinedBy: sortedResponses
                .filter(r => r.response === 'declined')
                .map(r => r.userId),
              timestamp: new Date().toISOString()
            });

            await updateDoc(matchRef, {
              status: 'declined',
              acceptedAt: null
            });

            console.log('14. Updated match status to declined');

            await this.createMatchOutcome(dropId, actualMatchId, match, 'unsuccessful');
            
            console.log('15. Created unsuccessful match outcome');
            console.groupEnd();
            return true;
          }

          // Rule: If both users approve, match is successful
          const bothAccepted = sortedResponses.every(r => r.response === 'accepted');
          
          console.log('13. Final match status:', {
            bothAccepted,
            status: bothAccepted ? 'accepted' : 'declined',
            timestamp: new Date().toISOString()
          });

          await updateDoc(matchRef, {
            status: bothAccepted ? 'accepted' : 'declined',
            acceptedAt: bothAccepted ? Timestamp.now() : null
          });

          await this.createMatchOutcome(
            dropId, 
            actualMatchId, 
            match, 
            bothAccepted ? 'successful' : 'unsuccessful'
          );

          if (bothAccepted) {
            // Send Twilio SMS
            const user1 = await getUserProfile(userId);
            const user2 = await getUserProfile(otherParticipantId);

            // Ensure both users exist and have phone numbers
            if (user1 && user2 && 
                (user1 as UserProfile & { phoneNumber?: string }).phoneNumber && 
                (user2 as UserProfile & { phoneNumber?: string }).phoneNumber) {
              await twilioService.sendMatchSuccessSMS(
                user1 as UserProfile & { phoneNumber?: string }, 
                user2 as UserProfile & { phoneNumber?: string }
              );
            } else {
              console.warn('Cannot send SMS: Missing user profiles or phone numbers', {
                user1: !!user1,
                user2: !!user2,
                user1PhoneNumber: user1 ? !!(user1 as UserProfile & { phoneNumber?: string }).phoneNumber : false,
                user2PhoneNumber: user2 ? !!(user2 as UserProfile & { phoneNumber?: string }).phoneNumber : false
              });
            }
          }
        } else {
          console.log('11. Waiting for other participant to respond', {
            currentResponses: participantResponses.length,
            requiredResponses: allParticipants.length,
            timestamp: new Date().toISOString()
          });
        }
      }

      console.log('14. Match registration completed');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('Error in match registration:', error);
      console.groupEnd();
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
      
      let q;
      if (status) {
        q = query(
          matchOutcomesRef, 
          where('status', '==', status)
        );
      } else {
        q = query(matchOutcomesRef);
      }

      const querySnapshot = await getDocs(q);
      
      const matchOutcomes: MatchOutcome[] = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MatchOutcome))
        .sort((a, b) => {
          const timeA = (a.createdAt as Timestamp).seconds;
          const timeB = (b.createdAt as Timestamp).seconds;
          return timeB - timeA;
        });

      const filteredOutcomes = status 
        ? matchOutcomes.filter(match => match.status === status)
        : matchOutcomes;

      return filteredOutcomes;
    } catch (error) {
      console.error('Error fetching match outcomes:', error);
      return [];
    }
  }
}
