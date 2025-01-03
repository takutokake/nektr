import { Box, Container, VStack, HStack, Text, Progress, Heading, useColorModeValue } from '@chakra-ui/react';
import { UserProfile } from '../../types';
import DropsSection from './DropsSection';
import AdminDrops from '../admin/AdminDrops';

interface HomePageProps {
  user: UserProfile;
}

export default function HomePage({ user }: HomePageProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        {/* User Stats Summary */}
        <Box p={6} borderWidth={1} borderRadius="lg" bg={bgColor} borderColor={borderColor}>
          <VStack align="stretch" spacing={4}>
            <Heading size="md">Welcome, {user.displayName}!</Heading>
            
            <HStack justify="space-between">
              <Text>Current Streak</Text>
              <Text fontWeight="bold">{user.streak} days</Text>
            </HStack>
            
            <Box>
              <Text mb={2}>Drop Participation Progress</Text>
              <Progress value={(user.completedChallenges.length / 10) * 100} colorScheme="blue" borderRadius="full" />
            </Box>
          </VStack>
        </Box>

        {/* Admin Drops Section (if admin) */}
        {user.isAdmin && <AdminDrops />}

        {/* Main Drops Section */}
        <DropsSection user={user} />

        {/* User Match Preview */}
        <Box p={6} borderWidth={1} borderRadius="lg" bg={bgColor} borderColor={borderColor}>
          <VStack align="stretch" spacing={4}>
            <Heading size="md">Your Next Match Preview</Heading>
            <Text color="gray.600">
              Based on your interests in {user.interests.slice(0, 2).join(' & ')}, 
              we're preparing a special match for the next drop!
            </Text>
            <Text fontSize="sm" color="gray.500">
              Hint: They share your love for {user.cuisinePreferences[0]} cuisine 
              and {user.interests[0]}.
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
