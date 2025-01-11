import { useState, useEffect } from 'react';
import { SuccessfulMatch } from '../types';
import { MatchRegistrationService } from '../services/matchRegistrationService';
import { useAuth } from '../contexts/AuthContext';

export const useSuccessfulMatches = () => {
  const [successfulMatches, setSuccessfulMatches] = useState<SuccessfulMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSuccessfulMatches = async () => {
      if (!user) {
        setSuccessfulMatches([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const matches = await MatchRegistrationService.getUserSuccessfulMatches(user.id);
        setSuccessfulMatches(matches);
        setError(null);
      } catch (err) {
        console.error('Error fetching successful matches:', err);
        setError('Failed to fetch successful matches');
        setSuccessfulMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuccessfulMatches();
  }, [user?.id]);

  return {
    successfulMatches,
    isLoading,
    error
  };
};
