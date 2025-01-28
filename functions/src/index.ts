import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import twilio from 'twilio';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Twilio configuration from environment variables
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Validate Twilio configuration
if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
  console.error('Missing Twilio configuration. Please check your environment variables.');
}

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
