import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext'; 

export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth(); 

  const trackPage = useCallback(() => {
    try {
      if (location && location.pathname) {
        analyticsService.trackPageView(
          location.pathname, 
          user?.uid || 'anonymous'
        );
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }, [location?.pathname, user]);

  useEffect(() => {
    if (location) {
      trackPage();
    }
  }, [location, trackPage]);

  return analyticsService;
};
