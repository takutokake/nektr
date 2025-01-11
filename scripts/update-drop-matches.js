const admin = require('firebase-admin');
const path = require('path');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(path.join(__dirname, '../firebaseServiceAccountKey.json'))
});

async function updateDropMatchesStructure() {
  const db = admin.firestore();
  
  try {
    // Get all dropMatches documents
    const dropMatchesSnapshot = await db.collection('dropMatches').get();
    let totalUpdatedDocs = 0;
    
    for (const dropMatchDoc of dropMatchesSnapshot.docs) {
      const dropId = dropMatchDoc.id;
      console.log(`Processing drop: ${dropId}`);
      
      const dropMatchData = dropMatchDoc.data();
      const matches = dropMatchData.matches || {};
      const updatedMatches = {};

      // Get the dropParticipants document for this drop
      const dropParticipantsDoc = await db.collection('dropParticipants').doc(dropId).get();
      const dropParticipantData = dropParticipantsDoc.data() || {};
      const participants = dropParticipantData.participants || {};

      // Process each match in the matches field
      for (const [matchId, matchData] of Object.entries(matches)) {
        try {
          const [participant1Id, participant2Id] = matchId.split('_');
          
          if (!participant1Id || !participant2Id) {
            console.error(`Invalid match ID format: ${matchId}`);
            continue;
          }

          // Get participant data
          const participant1Data = participants[participant1Id] || {};
          const participant2Data = participants[participant2Id] || {};

          // Create updated match data with nested response
          updatedMatches[matchId] = {
            ...matchData, // Keep all existing fields
            participants: {
              [participant1Id]: {
                name: participant1Data.name || 'Anonymous',
                profileId: participant1Id,
                response: {
                  name: participant1Data.name || 'Anonymous',
                  profileId: participant1Id,
                  status: matchData.participants?.[participant1Id]?.status || 'pending'
                }
              },
              [participant2Id]: {
                name: participant2Data.name || 'Anonymous',
                profileId: participant2Id,
                response: {
                  name: participant2Data.name || 'Anonymous',
                  profileId: participant2Id,
                  status: matchData.participants?.[participant2Id]?.status || 'pending'
                }
              }
            }
          };

          console.log(`Updated match ${matchId} in drop ${dropId}`);
          totalUpdatedDocs++;
        } catch (matchError) {
          console.error(`Error updating match ${matchId}:`, matchError);
        }
      }

      // Update the dropMatches document with the modified matches
      await dropMatchDoc.ref.update({
        matches: updatedMatches,
        lastResponseUpdate: admin.firestore.Timestamp.now()
      });
    }

    console.log(`Update complete! Total matches updated: ${totalUpdatedDocs}`);
    process.exit(0);
  } catch (error) {
    console.error('Error in updateDropMatchesStructure:', error);
    process.exit(1);
  }
}

// Run the update script
updateDropMatchesStructure();
