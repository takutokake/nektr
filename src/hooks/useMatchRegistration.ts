import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { MatchRegistrationService } from '../services/matchRegistrationService';
import { useAuth } from '../contexts/AuthContext';
import { Match } from '../types';

export const useMatchRegistration = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  const respondToMatch = useCallback(async (
    dropId: string,
    matchId: string,
    response: 'accepted' | 'declined'
  ) => {
    console.group('Respond to Match');
    console.log('Input parameters:', {
      dropId,
      matchId,
      response,
      userId: user?.uid
    });

    // Validate inputs
    if (!dropId) {
      console.error('Missing dropId');
      console.groupEnd();
      return false;
    }
    if (!matchId) {
      console.error('Missing matchId');
      console.groupEnd();
      return false;
    }
    if (!user?.uid) {
      console.error('No authenticated user');
      console.groupEnd();
      return false;
    }

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to respond to matches',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      console.groupEnd();
      return false;
    }

    try {
      setIsRegistering(true);
      
      const success = await MatchRegistrationService.registerMatchResponse(
        dropId,
        matchId,
        user.uid,
        response
      );

      console.log('Match response registration result:', success);

      if (success) {
        toast({
          title: 'Response Recorded',
          description: `You have ${response} the match`,
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        toast({
          title: 'Response Failed',
          description: 'Unable to record your response. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }

      console.groupEnd();
      return success;
    } catch (error) {
      console.error('Match response error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      console.groupEnd();
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [user, toast]);

  const getMatchStatus = useCallback(async (
    dropId: string,
    matchId: string
  ): Promise<Match | null> => {
    try {
      return await MatchRegistrationService.getMatchStatus(dropId, matchId);
    } catch (error) {
      console.error('Error getting match status:', error);
      return null;
    }
  }, []);

  return {
    respondToMatch,
    getMatchStatus,
    isRegistering
  };
};
