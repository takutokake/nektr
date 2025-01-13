import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Drop } from '../types';

export const createTestData = async () => {
  try {
    // Create a test drop
    const dropRef = await addDoc(collection(db, 'drops'), {
      theme: 'Test Drop',
      description: 'Automated test drop for matching',
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      maxParticipants: 10,
      isSpecialEvent: false,
      participants: {}
    });

    return { dropId: dropRef.id };
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
};
