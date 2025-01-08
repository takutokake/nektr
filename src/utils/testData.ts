import { collection, addDoc, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

const testUsers = [
  {
    displayName: 'Alice Chen',
    interests: ['hiking', 'photography', 'cooking'],
    cuisinePreferences: ['japanese', 'italian', 'thai'],
    location: 'San Francisco'
  },
  {
    displayName: 'Bob Smith',
    interests: ['hiking', 'gaming', 'movies'],
    cuisinePreferences: ['italian', 'mexican', 'thai'],
    location: 'San Francisco'
  },
  {
    displayName: 'Carol Davis',
    interests: ['photography', 'art', 'music'],
    cuisinePreferences: ['japanese', 'korean', 'vietnamese'],
    location: 'San Francisco'
  },
  {
    displayName: 'David Wilson',
    interests: ['gaming', 'technology', 'movies'],
    cuisinePreferences: ['italian', 'american', 'mexican'],
    location: 'Oakland'
  },
  {
    displayName: 'Eva Martinez',
    interests: ['cooking', 'art', 'music'],
    cuisinePreferences: ['mexican', 'spanish', 'thai'],
    location: 'San Francisco'
  }
];

export const createTestData = async () => {
  try {
    const batch = writeBatch(db);
    const userRefs: string[] = [];

    // Create test users
    for (const userData of testUsers) {
      const userRef = await addDoc(collection(db, 'users'), {
        ...userData,
        email: `${userData.displayName.toLowerCase().replace(' ', '.')}@test.com`,
        isAdmin: false,
        createdAt: Timestamp.now()
      });
      userRefs.push(userRef.id);
    }

    // Create a test drop
    const dropRef = await addDoc(collection(db, 'drops'), {
      name: 'Test Lunch Drop',
      description: 'A test drop for matching system verification',
      location: 'San Francisco',
      startTime: Timestamp.fromMillis(Date.now() + 1000 * 60 * 5), // 5 minutes from now
      endTime: Timestamp.fromMillis(Date.now() + 1000 * 60 * 10),  // 10 minutes from now
      registrationDeadline: Timestamp.fromMillis(Date.now() + 1000 * 60 * 8), // 8 minutes from now
      status: 'active',
      participants: userRefs,
      theme: 'Lunch',
      maxParticipants: 10,
      createdAt: Timestamp.now(),
      createdBy: userRefs[0]
    });

    // Update users with the drop registration
    for (const userId of userRefs) {
      const userDocRef = doc(db, 'users', userId);
      batch.update(userDocRef, {
        registeredDrops: [dropRef.id]
      });
    }

    await batch.commit();

    console.log('Test data created successfully!');
    console.log('Created users:', userRefs);
    console.log('Created drop with matching criteria');
    
    return {
      userIds: userRefs,
      dropId: dropRef.id
    };
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
};
