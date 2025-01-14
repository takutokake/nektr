import * as functions from 'firebase-functions';
import { matchService } from '../../src/services/matchService';

// Cloud function to check and generate matches every 5 minutes
export const checkDropMatches = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      console.log('Checking and generating drop matches...');
      await matchService.checkAndGenerateDropMatches();
      console.log('Drop matches check completed successfully');
      return null;
    } catch (error) {
      console.error('Error in checkDropMatches function:', error);
      return null;
    }
  });

// Optional: Cloud function to trigger match generation manually via HTTP
export const triggerDropMatches = functions.https.onCall(async (data, context) => {
  try {
    // Optional: Add authentication check
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to trigger matches');
    // }

    await matchService.checkAndGenerateDropMatches();
    return { success: true, message: 'Drop matches generated successfully' };
  } catch (error) {
    console.error('Error triggering drop matches:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate drop matches');
  }
});
