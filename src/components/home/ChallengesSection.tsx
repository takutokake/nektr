import {
  Box,
  Grid,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  Button,
  Image,
  SimpleGrid,
} from '@chakra-ui/react';
import { Challenge, Badge as BadgeType } from '../../types';

interface ChallengesSectionProps {
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  points: number;
  badges: BadgeType[];
}

export default function ChallengesSection({
  activeChallenges,
  completedChallenges,
  points,
  badges,
}: ChallengesSectionProps) {
  return (
    <Box py={8}>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
        {/* Points and Badges */}
        <Box
          p={6}
          borderRadius="lg"
          bg="white"
          boxShadow="md"
          border="1px"
          borderColor="gray.200"
        >
          <VStack spacing={4} align="stretch">
            <Text fontSize="xl" fontWeight="bold">
              Your Achievements
            </Text>
            <HStack justify="space-between" bg="purple.50" p={4} borderRadius="md">
              <Text fontSize="lg">Total Points</Text>
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                {points}
              </Text>
            </HStack>
            <Text fontSize="lg" fontWeight="semibold">
              Recent Badges
            </Text>
            <SimpleGrid columns={4} spacing={4}>
              {badges.slice(0, 4).map((badge) => (
                <VStack key={badge.id}>
                  <Image
                    src={badge.imageUrl}
                    alt={badge.name}
                    boxSize="50px"
                    objectFit="cover"
                    borderRadius="full"
                  />
                  <Text fontSize="xs" textAlign="center">
                    {badge.name}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Active Challenges */}
        <Box
          p={6}
          borderRadius="lg"
          bg="white"
          boxShadow="md"
          border="1px"
          borderColor="gray.200"
        >
          <VStack spacing={4} align="stretch">
            <Text fontSize="xl" fontWeight="bold">
              Active Challenges
            </Text>
            {activeChallenges.map((challenge) => (
              <Box
                key={challenge.id}
                p={4}
                borderRadius="md"
                border="1px"
                borderColor="gray.200"
              >
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">{challenge.title}</Text>
                    <Badge colorScheme="green">
                      +{challenge.points} pts
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {challenge.description}
                  </Text>
                  <Progress
                    value={(challenge.progress / challenge.target) * 100}
                    size="sm"
                    colorScheme="blue"
                  />
                  <Text fontSize="sm" textAlign="right">
                    {challenge.progress}/{challenge.target} completed
                  </Text>
                </VStack>
              </Box>
            ))}
            <Button colorScheme="blue" variant="outline" size="sm">
              View All Challenges
            </Button>
          </VStack>
        </Box>
      </Grid>
    </Box>
  );
}
