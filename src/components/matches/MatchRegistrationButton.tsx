import React from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { useMatchRegistration } from '../../hooks/useMatchRegistration';
import { Match } from '../../types';
import { Notification } from '../../types/notifications';

interface MatchRegistrationButtonProps {
  dropId: string;
  matchId: string;
  match: Match;
  notifications?: Notification[];
  onRegistrationSuccess?: () => void;
  onNotificationUpdate?: (notificationId: string, action: 'accept' | 'decline') => void;
}

export const MatchRegistrationButton: React.FC<MatchRegistrationButtonProps> = ({
  dropId,
  matchId,
  match,
  notifications = [],
  onRegistrationSuccess,
  onNotificationUpdate
}) => {
  const { respondToMatch, isRegistering } = useMatchRegistration();
  const toast = useToast();

  // Find the relevant notification for this match
  const matchNotification = notifications.find(
    n => n.type === 'match' && 
    n.matchDetails?.dropId === dropId && 
    !n.actionTaken
  );

  const handleAccept = async () => {
    const success = await respondToMatch(dropId, matchId, 'accepted');
    
    if (success) {
      // Update notification if exists
      if (matchNotification && onNotificationUpdate) {
        onNotificationUpdate(matchNotification.id, 'accept');
      }

      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }

      toast({
        title: 'Match Accepted',
        description: 'You have accepted the match invitation',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleDecline = async () => {
    const success = await respondToMatch(dropId, matchId, 'declined');
    
    if (success) {
      // Update notification if exists
      if (matchNotification && onNotificationUpdate) {
        onNotificationUpdate(matchNotification.id, 'decline');
      }

      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }

      toast({
        title: 'Match Declined',
        description: 'You have declined the match invitation',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Determine button states based on match status
  const getButtonProps = () => {
    switch (match.status) {
      case 'confirmed':
        return {
          colorScheme: 'green',
          children: 'Match Confirmed',
          isDisabled: true
        };
      case 'declined':
        return {
          colorScheme: 'red',
          children: 'Match Declined',
          isDisabled: true
        };
      case 'cancelled':
        return {
          colorScheme: 'gray',
          children: 'Match Cancelled',
          isDisabled: true
        };
      default:
        return null; // Will render accept/decline buttons instead
    }
  };

  const buttonProps = getButtonProps();

  if (buttonProps) {
    return (
      <Button
        {...buttonProps}
        size="sm"
        width="full"
      />
    );
  }

  // Render accept/decline buttons for pending matches
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button
        colorScheme="green"
        onClick={handleAccept}
        isLoading={isRegistering}
        size="sm"
        flex="1"
      >
        Accept
      </Button>
      <Button
        colorScheme="red"
        onClick={handleDecline}
        isLoading={isRegistering}
        size="sm"
        flex="1"
      >
        Decline
      </Button>
    </div>
  );
};
