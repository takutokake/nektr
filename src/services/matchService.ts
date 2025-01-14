import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  Timestamp,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Drop, Match, DropParticipants, UserProfile } from '../types';
import { sendNotification } from './notificationService';

export class MatchService {
  private static instance: MatchService;

  public static getInstance(): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService();
    }
    return MatchService.instance;
  }

  /**
   * Automatically generate matches for a specific drop
   * @param drop The drop for which matches need to be generated
   */
  public async generateDropMatches(drop: Drop): Promise<void> {
    try {
      // Check if matches already exist for this drop
      const matchesRef = collection(db, 'matches');
      const matchQuery = query(
        matchesRef, 
        where('dropId', '==', drop.id)
      );
      const matchSnapshot = await getDocs(matchQuery);

      // If no match exists, generate matches
      if (matchSnapshot.empty) {
        const batch = writeBatch(db);
        const participantsRef = doc(db, 'dropParticipants', drop.id);
        const participantsSnap = await getDoc(participantsRef);
        
        if (participantsSnap.exists()) {
          const participantsData = participantsSnap.data() as DropParticipants;
          const participantIds = Object.keys(participantsData.participants);

          // Randomly match participants
          const shuffledParticipants = participantIds.sort(() => 0.5 - Math.random());
          const matchPairs: { [userId: string]: string } = {};
          const matchedUserProfiles: { [userId: string]: UserProfile } = {};

          // Fetch user profiles for matched participants
          const userProfilePromises = participantIds.map(async (userId) => {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            return { userId, profile: userSnap.data() as UserProfile };
          });

          const userProfiles = await Promise.all(userProfilePromises);
          const profileMap = Object.fromEntries(
            userProfiles.map(up => [up.userId, up.profile])
          );

          // Create match pairs
          for (let i = 0; i < shuffledParticipants.length; i += 2) {
            if (shuffledParticipants[i + 1]) {
              const user1 = shuffledParticipants[i];
              const user2 = shuffledParticipants[i + 1];
              
              matchPairs[user1] = user2;
              matchPairs[user2] = user1;
              
              matchedUserProfiles[user1] = profileMap[user1];
              matchedUserProfiles[user2] = profileMap[user2];
            }
          }

          // Create match document
          const matchRef = doc(collection(db, 'matches'));
          const matchData: Match = {
            id: matchRef.id,
            dropId: drop.id,
            matchPairs,
            participants: matchedUserProfiles,
            responses: {},
            compatibility: 0, // Calculate compatibility if needed
            commonInterests: [], // Calculate common interests if needed
            commonCuisines: [], // Calculate common cuisines if needed
            status: 'pending',
            meetingDetails: {
              location: drop.location,
              time: drop.startTime
            },
            cuisinePreference: '', // Can be enhanced later
            createdAt: Timestamp.now()
          };

          batch.set(matchRef, matchData);

          // Send notifications to matched participants
          await Promise.all(
            Object.entries(matchPairs).map(async ([userId, matchedUserId]) => {
              await sendNotification(userId, {
                title: 'Drop Match Generated',
                body: `You have been matched for the drop: ${drop.title}`,
                data: {
                  dropId: drop.id,
                  matchedUserId,
                  matchId: matchRef.id
                }
              });
            })
          );

          // Commit batch writes
          await batch.commit();

          // Update drop status
          const dropRef = doc(db, 'drops', drop.id);
          await writeBatch(db).update(dropRef, { 
            status: 'matched',
            updatedAt: serverTimestamp()
          }).commit();
        }
      }
    } catch (error) {
      console.error('Error generating matches:', error);
    }
  }

  /**
   * Automatically check and generate matches for all eligible drops
   */
  public async checkAndGenerateDropMatches(): Promise<void> {
    try {
      const currentTime = Timestamp.now();
      const dropsRef = collection(db, 'drops');
      
      // Find drops that are ready for matching
      const matchQuery = query(
        dropsRef, 
        where('startTime', '<=', currentTime),
        where('status', '==', 'upcoming')
      );

      const dropsSnapshot = await getDocs(matchQuery);
      
      // Generate matches for each eligible drop
      const matchPromises = dropsSnapshot.docs.map(async (dropDoc) => {
        const drop = { id: dropDoc.id, ...dropDoc.data() } as Drop;
        await this.generateDropMatches(drop);
      });

      await Promise.all(matchPromises);
    } catch (error) {
      console.error('Error checking and generating drop matches:', error);
    }
  }
}

export const matchService = MatchService.getInstance();
