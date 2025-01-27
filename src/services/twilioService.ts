import { 
  collection, 
  addDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

export interface TwilioMessagePayload {
  to: string;
  body: string;
}

export class TwilioService {
  private static instance: TwilioService;
  private messagesCollection = collection(db, 'messages');

  public static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  /**
   * Type guard to check if a user can receive SMS
   * @param user User profile to check
   */
  private canSendSMS(user: UserProfile): boolean {
    const extendedUser = user as UserProfile & {
      phoneNumberVerified?: boolean;
      smsNotificationsEnabled?: boolean;
      phoneNumber?: string;
    };

    console.log('SMS Eligibility Check:', {
      displayName: user.displayName,
      phoneNumberVerified: extendedUser.phoneNumberVerified,
      smsNotificationsEnabled: extendedUser.smsNotificationsEnabled,
      phoneNumber: extendedUser.phoneNumber
    });

    return !!(
      extendedUser.phoneNumberVerified && 
      extendedUser.smsNotificationsEnabled && 
      extendedUser.phoneNumber
    );
  }

  /**
   * Send SMS to a matched user via Firestore messages collection
   * @param user User profile to send SMS to
   * @param matchDetails Details about the match
   */
  public async sendMatchSMS(user: UserProfile, matchDetails: {
    dropTitle: string;
    matchedUserName: string;
  }): Promise<void> {
    try {
      // Ensure phone number is verified and SMS notifications are enabled
      const extendedUser = user as UserProfile & {
        phoneNumberVerified?: boolean;
        smsNotificationsEnabled?: boolean;
        phoneNumber?: string;
      };

      if (!this.canSendSMS(user)) {
        console.warn(`Cannot send SMS to user: ${user.displayName}. Phone number not verified or SMS notifications disabled.`);
        return;
      }

      // Create message document in Firestore for Twilio extension to process
      const messagePayload: TwilioMessagePayload = {
        to: extendedUser.phoneNumber!,
        body: `Hey ${user.displayName}! You've been matched for the drop: ${matchDetails.dropTitle}. Your match is ${matchDetails.matchedUserName}. Enjoy your meetup!`
      };

      console.log('Attempting to queue SMS:', {
        to: messagePayload.to,
        body: messagePayload.body,
        timestamp: new Date().toISOString()
      });

      const docRef = await addDoc(this.messagesCollection, {
        ...messagePayload,
        createdAt: Timestamp.now(),
        status: 'pending'
      });

      console.log(`SMS message queued successfully for ${user.displayName}. Document ID: ${docRef.id}`);
    } catch (error) {
      console.error('Error queuing Twilio SMS:', error);
    }
  }

  /**
   * Send SMS to multiple matched users
   * @param users Array of user profiles to send SMS to
   * @param matchDetails Details about the match
   */
  public async sendMatchSMSToMultipleUsers(
    users: UserProfile[], 
    matchDetails: {
      dropTitle: string;
      matchedUserName: string;
    }
  ): Promise<void> {
    try {
      console.log('Attempting to send SMS to multiple users:', {
        userCount: users.length,
        dropTitle: matchDetails.dropTitle
      });

      const smsPromises = users
        .filter(user => {
          const canSend = this.canSendSMS(user);
          if (!canSend) {
            console.warn(`User ${user.displayName} not eligible for SMS`);
          }
          return canSend;
        })
        .map(user => this.sendMatchSMS(user, matchDetails));
      
      await Promise.all(smsPromises);
    } catch (error) {
      console.error('Error sending multiple SMS:', error);
    }
  }

  /**
   * Select a recommended cuisine based on user preferences
   * @param user1Profile First user's profile
   * @param user2Profile Second user's profile
   * @returns Recommended cuisine as a string
   */
  private selectCuisinePreference(
    user1Profile: UserProfile, 
    user2Profile: UserProfile
  ): string {
    // Safely get cuisines, prioritizing cuisines over cuisinePreferences
    const user1Cuisines = [
      ...(user1Profile.cuisines || []),
      ...(user1Profile.cuisinePreferences || [])
    ];
    const user2Cuisines = [
      ...(user2Profile.cuisines || []),
      ...(user2Profile.cuisinePreferences || [])
    ];

    // Find common cuisines
    const commonCuisines = user1Cuisines.filter(cuisine => 
      user2Cuisines.includes(cuisine)
    );

    // If common cuisines exist, return the first one
    if (commonCuisines.length > 0) {
      return commonCuisines[0];
    }

    // If no common cuisines, find unique cuisines
    const uniqueCuisines = [
      ...(user1Cuisines.filter(cuisine => !user2Cuisines.includes(cuisine))),
      ...(user2Cuisines.filter(cuisine => !user1Cuisines.includes(cuisine)))
    ];

    // Return first unique cuisine or fallback
    return uniqueCuisines.length > 0 
      ? uniqueCuisines[0] 
      : 'Indian';  // Default recommendation
  }

  /**
   * Send SMS to both matched users upon successful match
   * @param user1 First user's profile
   * @param user2 Second user's profile
   */
  public async sendMatchSuccessSMS(
    user1: UserProfile & { phoneNumber?: string }, 
    user2: UserProfile & { phoneNumber?: string }
  ): Promise<void> {
    try {
      console.log('Sending match success SMS', {
        user1Name: user1.displayName,
        user2Name: user2.displayName
      });

      // Find shared interests and cuisine preferences
      const sharedInterests = (user1.interests || []).filter(
        interest => (user2.interests || []).includes(interest)
      );
      const sharedCuisines = (user1.cuisinePreferences || []).filter(
        cuisine => (user2.cuisinePreferences || []).includes(cuisine)
      );

      // Find recommended cuisine
      const recommendedCuisine = this.selectCuisinePreference(user1, user2);

      // Validate phone numbers
      if (!user1.phoneNumber || !user2.phoneNumber) {
        console.warn('Cannot send SMS: Missing phone number', {
          user1Phone: !!user1.phoneNumber,
          user2Phone: !!user2.phoneNumber
        });
        return;
      }

      // Ensure phone numbers are in international format
      const formatPhoneNumber = (phone: string) => 
        phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

      const formattedPhone1 = formatPhoneNumber(user1.phoneNumber);
      const formattedPhone2 = formatPhoneNumber(user2.phoneNumber);

      // Prepare personalized SMS messages
      const smsPromises = [
        addDoc(this.messagesCollection, {
          to: formattedPhone1,
          body: `Match Found in Test!
You've been matched with ${user2.displayName || user2.email}
Cuisine Preference: ${sharedCuisines.length > 0 ? sharedCuisines.join(', ') : 'Various'}
Recommended: ${recommendedCuisine}
Shared Interests: ${sharedInterests.length > 0 ? sharedInterests.join(', ') : 'Arts, Sports, Tea'}
Their Phone Number: ${formattedPhone2}

Start a conversation and enjoy your meetup!`,
          createdAt: Timestamp.now(),
          status: 'pending'
        }),
        addDoc(this.messagesCollection, {
          to: formattedPhone2,
          body: `Match Found in Test!
You've been matched with ${user1.displayName || user1.email}
Cuisine Preference: ${sharedCuisines.length > 0 ? sharedCuisines.join(', ') : 'Various'}
Recommended: ${recommendedCuisine}
Shared Interests: ${sharedInterests.length > 0 ? sharedInterests.join(', ') : 'Arts, Sports, Tea'}
Their Phone Number: ${formattedPhone1}

Start a conversation and enjoy your meetup!`,
          createdAt: Timestamp.now(),
          status: 'pending'
        })
      ];

      await Promise.all(smsPromises);

      console.log('Match success SMS queued successfully');
    } catch (error) {
      console.error('Error sending match success SMS:', error);
    }
  }
}

export const twilioService = TwilioService.getInstance();
