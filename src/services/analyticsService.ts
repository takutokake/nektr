import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase';

class AnalyticsService {
  private analytics;
  private auth;

  constructor() {
    this.analytics = getAnalytics(app);
    this.auth = getAuth(app);
  }

  /**
   * Track user sign-up event
   */
  trackUserSignUp(userId: string, metadata: {
    email?: string;
    method: 'email' | 'google';
    location?: string;
  }) {
    setUserId(this.analytics, userId);
    logEvent(this.analytics, 'sign_up', {
      method: metadata.method,
      location: metadata.location || window.location.hostname,
      timestamp: new Date().toISOString()
    });

    if (metadata.email) {
      setUserProperties(this.analytics, {
        email: metadata.email,
        signup_method: metadata.method
      });
    }
  }

  /**
   * Track user login event
   */
  trackUserLogin(userId: string, method: 'email' | 'google') {
    setUserId(this.analytics, userId);
    logEvent(this.analytics, 'login', {
      method,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track drop participation
   */
  trackDropParticipation(dropId: string, userId: string, dropData?: {
    name?: string;
    location?: string;
  }) {
    logEvent(this.analytics, 'drop_participation', {
      drop_id: dropId,
      user_id: userId,
      drop_name: dropData?.name || 'Unnamed Drop',
      drop_location: dropData?.location || 'Unknown Location',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, userId?: string) {
    logEvent(this.analytics, 'page_view', {
      page_name: pageName,
      user_id: userId || 'anonymous',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(action: string, metadata: Record<string, any>) {
    logEvent(this.analytics, 'user_interaction', {
      action,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track error event
   */
  trackError(error: Error, context: string) {
    logEvent(this.analytics, 'error', {
      error_name: error.name,
      error_message: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generic method to track any custom event
   */
  trackEvent(eventName: string, metadata: Record<string, any> = {}) {
    logEvent(this.analytics, eventName, {
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();
