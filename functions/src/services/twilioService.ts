import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../src/firebase';
import { UserProfile } from '../../src/types';

export interface TwilioMessagePayload {
  to: string;
  body: string;
}

export class TwilioService {
  private static instance: TwilioService;
  private messagesCollection = collection(db, 'messages');
  smsNotificationsEnabled: boolean = true;

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

  private extractCuisinePreference(
    cuisinePreference?: string, 
    commonCuisines?: string[]
  ): string {
    return (cuisinePreference && cuisinePreference.toLowerCase() !== 'various')
      ? cuisinePreference
      : (commonCuisines?.[0] || 'Undecided');
  }

  private extractCommonInterests(
    commonInterests?: string[]
  ): string[] {
    return commonInterests && commonInterests.length > 0
      ? commonInterests
      : ['No Specific Interests'];
  }

  /**
   * Send SMS to a matched user via Firestore messages collection
   * @param user User profile to send SMS to
   * @param matchDetails Details about the match
   */
  public async sendMatchSMS(
    user: UserProfile, 
    matchDetails: {
      dropId: string;
      dropTitle: string;
      matchedUserName: string;
      cuisinePreference?: string;
      commonCuisines?: string[];
      commonInterests?: string[];
      compatibility?: number;
      participants?: Record<string, UserProfile>;
    }
  ): Promise<void> {
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

      // Extract cuisine preference with intelligent fallback
      const cuisinePreference = this.extractCuisinePreference(
        matchDetails.cuisinePreference, 
        matchDetails.commonCuisines
      );

      // Extract common interests with fallback
      const commonInterests = this.extractCommonInterests(
        matchDetails.commonInterests
      );

      // Prepare SMS body with more context
      const cuisineText = cuisinePreference !== 'Undecided' 
        ? `Cuisine Preference: ${cuisinePreference}` 
        : '';
      
      const interestsText = commonInterests[0] !== 'No Specific Interests'
        ? `Shared Interests: ${commonInterests.join(', ')}`
        : '';
      
      const compatibilityText = matchDetails.compatibility
        ? `Compatibility: ${Math.round(matchDetails.compatibility * 100)}%`
        : '';

      const messageBody = [
        `Hey ${user.displayName}!`,
        `You've been matched for the drop: ${matchDetails.dropTitle}`,
        `Match: ${matchDetails.matchedUserName}`,
        cuisineText,
        interestsText,
        compatibilityText,
        'Enjoy your meetup!'
      ].filter(Boolean).join('\n');

      // Create message document in Firestore for Twilio extension to process
      const messagePayload: TwilioMessagePayload = {
        to: extendedUser.phoneNumber!,
        body: messageBody
      };

      console.log('Attempting to queue SMS:', {
        to: messagePayload.to,
        body: messagePayload.body,
        timestamp: new Date().toISOString()
      });

      const docRef = await addDoc(this.messagesCollection, {
        ...messagePayload,
        createdAt: serverTimestamp(),
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
      dropId: string;
      dropTitle: string;
      matchedUserName: string;
      cuisinePreference?: string;
      commonCuisines?: string[];
      commonInterests?: string[];
      compatibility?: number;
      participants?: Record<string, UserProfile>;
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
      : 'none';  // Default recommendation
  }

  private formatPhoneNumber(phone: string) {
    return phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
  }

  private calculateSharedInterests(user1: UserProfile, user2: UserProfile) {
    console.log('User 1 Interests:', user1.interests);
    console.log('User 2 Interests:', user2.interests);
    
    // Combine all interests from both users
    const allInterests = [
      ...(user1.interests || []),
      ...(user2.interests || [])
    ];
    
    // If no interests, return a default set
    if (allInterests.length === 0) {
      return ['Arts', 'Sports', 'Technology'];
    }
    
    // If one user has more interests, return those
    return allInterests.length > 3 
      ? allInterests.slice(0, 3) 
      : allInterests;
  }

  private calculateSharedCuisines(user1: UserProfile, user2: UserProfile) {
    console.log('User 1 Cuisine Preferences:', user1.cuisinePreferences);
    console.log('User 2 Cuisine Preferences:', user2.cuisinePreferences);
    
    // Combine all cuisine preferences from both users
    const allCuisines = [
      ...(user1.cuisinePreferences || []),
      ...(user2.cuisinePreferences || [])
    ];
    
    // If no cuisine preferences, return a default set
    if (allCuisines.length === 0) {
      return ['Various', 'International'];
    }
    
    // If one user has more cuisine preferences, return those
    return allCuisines.length > 2 
      ? allCuisines.slice(0, 2) 
      : allCuisines;
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
      // Validate phone numbers exist
      if (!user1.phoneNumber || !user2.phoneNumber) {
        console.warn('Cannot send SMS: Missing phone number');
        return;
      }

      // Check if SMS notifications are enabled
      if (!this.smsNotificationsEnabled) {
        console.warn('SMS notifications are disabled');
        return;
      }

      // Format phone numbers
      const formattedPhone1 = this.formatPhoneNumber(user1.phoneNumber);
      const formattedPhone2 = this.formatPhoneNumber(user2.phoneNumber);

      // Calculate shared interests and cuisines
      const sharedInterests = this.calculateSharedInterests(user1, user2);
      const sharedCuisines = this.calculateSharedCuisines(user1, user2);
      const recommendedCuisine = this.selectCuisinePreference(user1, user2);

      // Prepare personalized SMS messages
      const smsPromises = [
        addDoc(this.messagesCollection, {
          to: formattedPhone1,
          body: `🌟 Match Found! 🌟
You've been matched with ${user2.displayName} 🎉

🍣 Cuisine Preference: ${sharedCuisines.join(', ')}
✅ Recommended: ${recommendedCuisine}

🤝 Shared Interests: ${sharedInterests.map(interest => 
  `${interest} ${this.getInterestEmoji(interest)}`
).join(', ')}

📞 Their Phone Number: ${formattedPhone2}

💬 Send a message and start a conversation and enjoy your meetup! 🥳`,
          createdAt: serverTimestamp()
        }),
        addDoc(this.messagesCollection, {
          to: formattedPhone2,
          body: `🌟 Match Found! 🌟
You've been matched with ${user1.displayName} 🎉

🍣 Cuisine Preference: ${sharedCuisines.join(', ')}
✅ Recommended: ${recommendedCuisine}

🤝 Shared Interests: ${sharedInterests.map(interest => 
  `${interest} ${this.getInterestEmoji(interest)}`
).join(', ')}

📞 Their Phone Number: ${formattedPhone1}

💬 Send a message and start a conversation and enjoy your meetup! 🥳`,
          createdAt: serverTimestamp()
        })
      ];

      // Send SMS messages
      await Promise.all(smsPromises);

      console.log('Match success SMS sent to both users');
    } catch (error) {
      console.error('Error sending match success SMS:', error);
    }
  }

  // Helper method to add emojis to interests
  private getInterestEmoji(interest: string): string {
    const emojiMap: { [key: string]: string } = {
      'Arts': '🎨',
      'Sports': '⚽',
      'Technology': '💻',
      'Tea': '🍵',
      'Music': '🎵',
      'Food': '🍽️',
      'Travel': '✈️',
      'Reading': '📚',
      'Cooking': '👨‍🍳',
      'Photography': '📷'
    };
    
    // Find the emoji, default to a generic star if not found
    return emojiMap[interest] || '⭐';
  }
}

export const twilioService = TwilioService.getInstance();
