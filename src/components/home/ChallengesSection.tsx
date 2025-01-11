import React from 'react';
import { 
  Box, 
  Text, 
  VStack, 
  HStack, 
  Progress, 
  Tooltip 
} from '@chakra-ui/react';
import { 
  FaTrophy, 
  FaLock, 
  FaCheckCircle 
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { Challenge, Badge } from '../../types';

// Mock data for challenges and badges
const mockChallenges: Challenge[] = [
  { 
    id: '1', 
    title: 'First Connection', 
    description: 'Make your first match', 
    points: 50 
  },
  { 
    id: '2', 
    title: 'Social Butterfly', 
    description: 'Complete 5 drops', 
    points: 100 
  },
  { 
    id: '3', 
    title: 'Foodie Explorer', 
    description: 'Try 3 different cuisines', 
    points: 75 
  }
];

const mockBadges: Badge[] = [
  { 
    id: '1', 
    name: 'Newcomer', 
    description: 'Welcome to Nektr!', 
    icon: 'FaLock' 
  },
  { 
    id: '2', 
    name: 'Connection Master', 
    description: 'Made 10 connections', 
    icon: 'FaTrophy' 
  }
];

const ChallengesSection: React.FC = () => {
  const { user } = useAuth();

  const renderChallengeIcon = (challenge: Challenge) => {
    const isCompleted = user?.completedChallenges?.includes(challenge.id);
    
    return isCompleted ? (
      <FaCheckCircle 
        color="green" 
        style={{ marginRight: '10px' }} 
      />
    ) : (
      <FaLock 
        color="gray" 
        style={{ marginRight: '10px' }} 
      />
    );
  };

  const renderBadgeIcon = (badge: Badge) => {
    switch(badge.icon) {
      case 'FaTrophy':
        return <FaTrophy style={{ marginRight: '10px' }} />;
      case 'FaLock':
        return <FaLock style={{ marginRight: '10px' }} />;
      default:
        return null;
    }
  };

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" mb={4}>
          Challenges
        </Text>

        {mockChallenges.map((challenge) => (
          <HStack key={challenge.id} spacing={4} align="center">
            {renderChallengeIcon(challenge)}
            <VStack align="start" flex={1}>
              <Text fontWeight="bold">{challenge.title}</Text>
              <Text fontSize="sm" color="gray.500">
                {challenge.description}
              </Text>
              <Progress 
                value={user?.completedChallenges?.includes(challenge.id) ? 100 : 0} 
                size="sm" 
                colorScheme="green" 
                width="full" 
              />
            </VStack>
            <Tooltip label={`${challenge.points} points`}>
              <Text fontWeight="bold" color="green.500">
                +{challenge.points}
              </Text>
            </Tooltip>
          </HStack>
        ))}

        <Text fontSize="2xl" fontWeight="bold" mt={6} mb={4}>
          Badges
        </Text>

        {mockBadges.map((badge) => (
          <HStack key={badge.id} spacing={4} align="center">
            {renderBadgeIcon(badge)}
            <VStack align="start" flex={1}>
              <Text fontWeight="bold">{badge.name}</Text>
              <Text fontSize="sm" color="gray.500">
                {badge.description}
              </Text>
            </VStack>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

export default ChallengesSection;
