const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  writeBatch, 
  Timestamp 
} = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to create drops
async function createDrops() {
  const batch = writeBatch(db);

  // Drops for the next few months
  const drops = [
    {
      title: 'Tech Innovators Mixer',
      description: 'Connect with leading tech professionals and innovators',
      startTime: Timestamp.fromDate(new Date('2025-02-15T19:00:00-08:00')),
      endTime: Timestamp.fromDate(new Date('2025-02-15T21:00:00-08:00')),
      maxParticipants: 50,
      category: 'Technology',
      location: 'Virtual Event',
      status: 'upcoming'
    },
    {
      title: 'Startup Founders Networking',
      description: 'An exclusive networking event for startup founders',
      startTime: Timestamp.fromDate(new Date('2025-03-10T18:30:00-08:00')),
      endTime: Timestamp.fromDate(new Date('2025-03-10T20:30:00-08:00')),
      maxParticipants: 40,
      category: 'Entrepreneurship',
      location: 'Silicon Valley Innovation Center',
      status: 'upcoming'
    },
    {
      title: 'AI and Machine Learning Summit',
      description: 'Explore the latest trends in AI and Machine Learning',
      startTime: Timestamp.fromDate(new Date('2025-04-05T09:00:00-08:00')),
      endTime: Timestamp.fromDate(new Date('2025-04-06T17:00:00-08:00')),
      maxParticipants: 100,
      category: 'Technology',
      location: 'Moscone Center, San Francisco',
      status: 'upcoming'
    }
  ];

  // Add drops to Firestore
  drops.forEach(drop => {
    const dropRef = doc(collection(db, 'drops'));
    const dropWithMetadata = {
      ...drop,
      id: dropRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      participants: [],
      currentParticipants: 0
    };

    // Set drop document
    batch.set(dropRef, dropWithMetadata);

    // Create corresponding dropParticipants document
    const participantsRef = doc(db, 'dropParticipants', dropRef.id);
    const participantsData = {
      id: dropRef.id,
      dropId: dropRef.id,
      dropName: drop.title,
      registeredAt: drop.startTime,
      participants: {},
      totalParticipants: 0,
      maxParticipants: drop.maxParticipants
    };
    batch.set(participantsRef, participantsData);
  });

  // Commit the batch
  await batch.commit();
  console.log('Drops successfully recreated in Firestore!');
}

// Run the script
createDrops().catch(console.error);
