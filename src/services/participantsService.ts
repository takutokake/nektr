import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DropParticipants } from '../types';
import { Timestamp } from 'firebase/firestore';

export const getDropParticipants = async (dropId: string): Promise<DropParticipants> => {
  try {
    const participantsRef = doc(db, 'dropParticipants', dropId);
    const participantsSnap = await getDoc(participantsRef);
    
    return participantsSnap.exists() 
      ? participantsSnap.data() as DropParticipants 
      : { 
          id: dropId, 
          dropId: dropId,
          dropName: 'Unknown Drop',
          registeredAt: Timestamp.now(), 
          participants: {}, 
          totalParticipants: 0,
          maxParticipants: 10
        };
  } catch (error) {
    console.error(`Error fetching participants for drop ${dropId}:`, error);
    return { 
      id: dropId, 
      dropId: dropId,
      dropName: 'Unknown Drop',
      registeredAt: Timestamp.now(), 
      participants: {}, 
      totalParticipants: 0,
      maxParticipants: 10
    };
  }
};
