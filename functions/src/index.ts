import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as twilio from 'twilio';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Twilio configuration (replace with your actual credentials)
const twilioAccountSid = functions.config().twilio.account_sid;
const twilioAuthToken = functions.config().twilio.auth_token;
const twilioPhoneNumber = functions.config().twilio.phone_number;

// Initialize Twilio client
const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

/**
 * Send SMS via Twilio
 */
export const sendTwilioMessage = functions.https.onCall(async (data, context) => {
  // Validate the request
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { to, body } = data;

  // Validate input
  if (!to || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Phone number and message body are required');
  }

  try {
    // Send SMS
    const message = await twilioClient.messages.create({
      body: body,
      from: twilioPhoneNumber,
      to: to
    });

    console.log('SMS sent successfully:', message.sid);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send SMS', error);
  }
});
