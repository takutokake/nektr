import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext'; 

export const useAnalytics = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const prevUserRef = useRef(user);

  const trackPage = useCallback(() => {
    if (loading) return; // Don't track while loading

    try {
      if (location?.pathname) {
        analyticsService.trackPageView(
          location.pathname, 
          user?.uid || 'anonymous'
        );
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }, [location?.pathname, user, loading]);

  // Track auth state changes
  useEffect(() => {
    if (loading) return; // Don't track while loading

    const prevUser = prevUserRef.current;
    
    // User just logged in
    if (!prevUser && user) {
      analyticsService.trackEvent('login', { method: 'google' });
    }
    // User just signed up (new user profile)
    if (!prevUser && user && !user.profileComplete) {
      analyticsService.trackEvent('signup', { method: 'google' });
    }

    prevUserRef.current = user;
  }, [user, loading]);

  // Track page views
  useEffect(() => {
    if (location) {
      trackPage();
    }
  }, [location, trackPage]);

  return analyticsService;
};
