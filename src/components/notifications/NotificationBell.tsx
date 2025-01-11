import React from 'react';
import {
  IconButton,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  VStack,
  Text,
  Badge,
  useColorModeValue,
  HStack,
  Button,
  Divider,
} from '@chakra-ui/react';
import { FaBell } from 'react-icons/fa';
import { Notification } from '../../types/notifications';
import { format } from 'date-fns';

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onAcceptMatch: (notificationId: string, matchDetails: any) => void;
  onDeclineMatch: (notificationId: string, matchDetails: any) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onAcceptMatch,
  onDeclineMatch,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const notificationBgColor = useColorModeValue('yellow.50', 'yellow.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderMatchNotification = (notification: Notification) => {
    console.error('FULL Notification Object:', {
      notification: JSON.stringify(notification, null, 2)
    });

    const { matchDetails } = notification;
    if (!matchDetails) return null;

    // Intelligently handle cuisine preference
    const cuisinePreference = matchDetails.cuisineMatch?.preference === 'Various' 
      ? matchDetails.cuisineMatch?.recommendation || 'Undecided'
      : matchDetails.cuisineMatch?.preference;

    // Intelligently handle shared interests
    const sharedInterests = matchDetails.commonInterests && Array.isArray(matchDetails.commonInterests) && matchDetails.commonInterests.length > 0
      ? matchDetails.commonInterests.map(interest => interest && typeof interest === 'string' ? interest.charAt(0).toUpperCase() + interest.slice(1) : 'Unknown')
      : ['No Specific Interests'];

    console.error('Shared Interests Processing:', {
      matchDetailsCommonInterests: matchDetails.commonInterests,
      sharedInterests: sharedInterests,
      notificationObject: JSON.stringify(notification, null, 2)
    });

    return (
      <Box>
        <Box fontSize="sm" fontWeight="bold" mb={1}>
          Match Found in {matchDetails.dropTitle}!
        </Box>
        <Box fontSize="sm" mb={2}>
          You've been matched with {matchDetails.matchedUserName}
        </Box>
        <Box fontSize="sm" mb={2}>
          Cuisine Preference: {cuisinePreference}
          {matchDetails.cuisineMatch?.recommendation && 
           matchDetails.cuisineMatch?.recommendation !== cuisinePreference && (
            <Box fontSize="sm" color="green.500">
              Recommended: {matchDetails.cuisineMatch?.recommendation}
            </Box>
          )}
        </Box>
        <Box fontSize="sm" mb={2}>
          Shared Interests: {sharedInterests.join(', ')}
        </Box>
        {!notification.actionTaken && (
          <HStack spacing={2} mt={2}>
            <Button
              size="sm"
              colorScheme="green"
              onClick={() => onAcceptMatch(notification.id, matchDetails)}
            >
              Accept
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={() => onDeclineMatch(notification.id, matchDetails)}
            >
              Decline
            </Button>
          </HStack>
        )}
        {notification.actionTaken && matchDetails.status === 'accepted' && (
          <Box fontSize="sm" color="green.500">
            You accepted this match
          </Box>
        )}
        {notification.actionTaken && matchDetails.status === 'declined' && (
          <Box fontSize="sm" color="red.500">
            You declined this match
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Box position="relative">
          <IconButton
            aria-label="Notifications"
            icon={<FaBell />}
            variant="ghost"
            size="md"
            color={unreadCount > 0 ? '#FDAA25' : undefined}
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-1"
              right="-1"
              colorScheme="red"
              borderRadius="full"
              minW="5"
              textAlign="center"
            >
              {unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent bg={bgColor}>
        <PopoverHeader borderBottomWidth="1px" fontWeight="bold">
          <HStack justify="space-between">
            <Box>Notifications</Box>
            {unreadCount > 0 && (
              <Button size="xs" colorScheme="yellow" onClick={onMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </HStack>
        </PopoverHeader>
        <PopoverBody maxH="300px" overflowY="auto">
          <VStack spacing={2} align="stretch">
            {notifications.length === 0 ? (
              <Box color={textColor} textAlign="center" py={4}>
                No notifications
              </Box>
            ) : (
              notifications.map(notification => (
                <Box
                  key={notification.id}
                  p={3}
                  bg={notification.read ? 'transparent' : notificationBgColor}
                  borderRadius="md"
                  onClick={() => !notification.actionTaken && onMarkAsRead(notification.id)}
                  cursor={!notification.actionTaken ? 'pointer' : 'default'}
                  transition="background-color 0.2s"
                  _hover={{
                    bg: !notification.read ? notificationBgColor : hoverBgColor
                  }}
                >
                  {notification.type === 'match' ? (
                    renderMatchNotification(notification)
                  ) : (
                    <Box>
                      <Box fontWeight="bold" fontSize="sm">
                        {notification.title}
                      </Box>
                      <Box fontSize="sm" color={textColor}>
                        {notification.message}
                      </Box>
                      <Box fontSize="xs" color={textColor} mt={1}>
                        {format(notification.createdAt, 'MMM d, yyyy h:mm a')}
                      </Box>
                    </Box>
                  )}
                </Box>
              ))
            )}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
