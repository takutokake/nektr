import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query as firestoreQuery,
  where,
  Timestamp,
  DocumentReference
} from 'firebase/firestore';
import { db } from '../firebase';
import { DropMatches, Match, UserProfile } from '../types';
import { sendCalendarInvite } from '../utils/calendarInvite';

export class MatchRegistrationService {
  static async registerMatchResponse(
    dropId: string,
    matchId: string,
    userId: string,
    response: 'accepted' | 'declined'
  ): Promise<boolean> {
    console.group('Match Response Flow');
    console.log('1. Starting match registration:', {
      dropId,
      matchId,
      userId,
      response,
      timestamp: new Date().toISOString()
    });

    try {
      // Get the match document
      const matchRef = doc(db, 'dropMatches', dropId, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);

      if (!matchDoc.exists()) {
        console.error('Match document not found');
        console.groupEnd();
        return false;
      }

      const match = matchDoc.data() as Match;
      const allParticipants = Object.keys(match.participants);
      
      // Update the user's response
      const updatedResponses = {
        ...match.responses,
        [userId]: {
          response,
          respondedAt: Timestamp.now()
        }
      };

      await updateDoc(matchRef, {
        responses: updatedResponses
      });

      console.log('2. Updated user response');

      // Check if all participants have responded
      const participantResponses = Object.entries(updatedResponses).map(([userId, data]) => ({
        userId,
        ...data
      }));

      if (participantResponses.length === allParticipants.length) {
        console.log('3. All participants have responded');

        // Sort responses chronologically
        const sortedResponses = participantResponses
          .sort((a, b) => a.respondedAt.toMillis() - b.respondedAt.toMillis());

        // If both accepted, send calendar invite
        const bothAccepted = sortedResponses.every(r => r.response === 'accepted');
        
        if (bothAccepted) {
          console.log('4. Both participants accepted - preparing calendar invite');
          
          // Get both users' email addresses
          const userPromises = allParticipants.map(userId => 
            getDoc(doc(db, 'users', userId))
          );
          const userDocs = await Promise.all(userPromises);
          const emails = userDocs
            .map(doc => doc.data()?.email)
            .filter(email => email);

          console.log('5. Retrieved user emails:', {
            emailCount: emails.length,
            emails,
            timestamp: new Date().toISOString()
          });

          if (emails.length === 2) {
            // Get drop details for the calendar invite
            const dropDoc = await getDoc(doc(db, 'drops', dropId));
            const dropData = dropDoc.data();
            
            console.log('6. Preparing to send calendar invite:', {
              dropTitle: dropData?.title,
              userEmails: emails,
              timestamp: new Date().toISOString()
            });

            // Send calendar invite
            sendCalendarInvite({
              title: `Nectr Meetup: ${dropData?.title || 'New Match'}`,
              description: `Your Nectr match meetup with ${userDocs[1].data()?.displayName || 'your match'}`,
              startTime: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // Default to tomorrow
              location: 'To be decided',
              attendees: emails
            });

            console.log('7. Calendar invite sent');

            // Update match status
            await updateDoc(matchRef, {
              status: 'confirmed',
              confirmedAt: Timestamp.now()
            });
          } else {
            console.warn('Could not send calendar invite - missing email addresses:', {
              foundEmails: emails.length,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      console.log('8. Match registration completed');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('Error in match registration:', error);
      console.groupEnd();
      return false;
    }
  }
}
