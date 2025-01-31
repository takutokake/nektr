import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Button,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
  Box
} from '@chakra-ui/react';
import { Notification } from '../../types/notifications';

interface MatchNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification;
  onAcceptMatch: (notificationId: string, matchDetails: any) => void;
  onDeclineMatch: (notificationId: string, matchDetails: any) => void;
}

export const MatchNotificationModal: React.FC<MatchNotificationModalProps> = ({
  isOpen,
  onClose,
  notification,
  onAcceptMatch,
  onDeclineMatch
}) => {
  const handleAcceptMatch = () => {
    onAcceptMatch(notification.id, notification.matchDetails);
    onClose();
  };

  const handleDeclineMatch = () => {
    onDeclineMatch(notification.id, notification.matchDetails);
    onClose();
  };

  if (!notification.matchDetails) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl" 
      isCentered
      closeOnOverlayClick={false}
    >
      <ModalOverlay 
        bg="blackAlpha.300" 
        backdropFilter="blur(10px)"
      />
      <ModalContent 
        borderRadius="xl" 
        boxShadow="2xl"
        bg="white"
        color="gray.800"
      >
        <ModalHeader 
          textAlign="center" 
          fontSize="2xl" 
          fontWeight="bold" 
          color="green.600"
        >
          🎉 New Match Discovered! 🎉
        </ModalHeader>
        
        <ModalBody>
          <VStack spacing={6} align="center">
            <HStack spacing={6}>
              <Avatar 
                size="2xl" 
                name={notification.matchDetails.matchedUserName} 
                bg="green.500" 
                color="white"
              />
            </HStack>
            
            <VStack spacing={4} textAlign="center">
              <Text fontSize="xl" fontWeight="bold">
                {notification.matchDetails.matchedUserName}
              </Text>
              
              <HStack>
                <Badge colorScheme="green">
                  Drop: {notification.matchDetails.dropTitle}
                </Badge>
              </HStack>
              
              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Cuisine Preference
                </Text>
                <Badge colorScheme="purple">
                  {notification.matchDetails.cuisineMatch?.preference || 'Not Specified'}
                </Badge>
              </Box>
              
              {notification.matchDetails.commonInterests && (
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Shared Interests
                  </Text>
                  <HStack spacing={2} justify="center" wrap="wrap">
                    {notification.matchDetails.commonInterests.map((interest, index) => (
                      <Badge key={index} colorScheme="blue" variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          </VStack>
        </ModalBody>
        
        <ModalFooter justifyContent="center" mt={4} mb={4}>
          <HStack spacing={6}>
            <Button 
              colorScheme="green" 
              size="lg" 
              onClick={handleAcceptMatch}
              leftIcon={<>👍</>}
            >
              Accept Match
            </Button>
            <Button 
              colorScheme="red" 
              variant="outline" 
              size="lg" 
              onClick={handleDeclineMatch}
              leftIcon={<>👎</>}
            >
              Decline
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
