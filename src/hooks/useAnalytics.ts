import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext'; 

export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth(); 

  useEffect(() => {
    analyticsService.trackPageView(
      location.pathname, 
      user?.uid || 'anonymous'
    );
  }, [location.pathname, user]);

  return analyticsService;
};
