import React from 'react';
import { Box, VStack, Text, Heading, HStack, Badge as ChakraBadge } from '@chakra-ui/react';
import { FaTrophy, FaAward } from 'react-icons/fa';
import { UserProfile, Challenge, Badge } from '../../types';

interface ChallengesSectionProps {
  user: UserProfile;
}

const ChallengesSection: React.FC<ChallengesSectionProps> = ({ user }) => {
  // Mock challenges and badges for development
  const mockChallenges: Challenge[] = [
    { 
      id: 'challenge1', 
      title: 'First Match', 
      description: 'Complete your first social match', 
      points: 100 
    },
    { 
      id: 'challenge2', 
      title: 'Streak Master', 
      description: 'Maintain a 5-day streak', 
      points: 250 
    }
  ];

  const mockBadges: Badge[] = [
    { 
      id: 'badge1', 
      name: 'Social Butterfly', 
      description: 'Made 5 connections', 
      icon: 'butterfly' 
    },
    { 
      id: 'badge2', 
      name: 'Foodie Explorer', 
      description: 'Tried 3 different cuisines', 
      icon: 'fork' 
    }
  ];

  return (
    <Box p={4} borderWidth={1} borderRadius="lg">
      <VStack align="stretch" spacing={4}>
        <Heading size="md" display="flex" alignItems="center">
          <FaTrophy style={{ marginRight: '10px' }} /> Challenges
        </Heading>

        {mockChallenges.map((challenge) => (
          <HStack 
            key={challenge.id} 
            bg="gray.50" 
            p={3} 
            borderRadius="md" 
            justifyContent="space-between"
          >
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">{challenge.title}</Text>
              <Text fontSize="sm" color="gray.600">{challenge.description}</Text>
            </VStack>
            <ChakraBadge colorScheme="green">{challenge.points} pts</ChakraBadge>
          </HStack>
        ))}

        <Heading size="md" mt={4} display="flex" alignItems="center">
          <FaAward style={{ marginRight: '10px' }} /> Badges
        </Heading>

        <HStack spacing={3}>
          {mockBadges.map((badge) => (
            <VStack 
              key={badge.id} 
              bg="gray.50" 
              p={3} 
              borderRadius="md" 
              align="center" 
              width="full"
            >
              <Text fontWeight="bold">{badge.name}</Text>
              <Text fontSize="sm" color="gray.600">{badge.description}</Text>
            </VStack>
          ))}
        </HStack>
      </VStack>
    </Box>
  );
};

export default ChallengesSection;
