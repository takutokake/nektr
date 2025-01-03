import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import { FaCoffee, FaUtensils, FaLaptop, FaHiking } from 'react-icons/fa';
import { Drop } from '../../types';

export default function UpcomingDrops() {
  const upcomingDrops: (Omit<Drop, 'participants' | 'maxParticipants'> & { icon: any })[] = [
    {
      id: '1',
      theme: 'Coffee Lovers',
      description: 'Connect over your favorite brew!',
      startTime: new Date(Date.now() + 86400000), // Tomorrow
      endTime: new Date(Date.now() + 90000000),
      isSpecialEvent: false,
      icon: FaCoffee,
    },
    {
      id: '2',
      theme: 'Foodies Unite',
      description: 'Share your culinary adventures!',
      startTime: new Date(Date.now() + 172800000), // Day after tomorrow
      endTime: new Date(Date.now() + 176400000),
      isSpecialEvent: true,
      icon: FaUtensils,
    },
    {
      id: '3',
      theme: 'Tech Meetup',
      description: 'Connect with fellow tech enthusiasts!',
      startTime: new Date(Date.now() + 259200000), // 3 days from now
      endTime: new Date(Date.now() + 262800000),
      isSpecialEvent: false,
      icon: FaLaptop,
    },
    {
      id: '4',
      theme: 'Outdoor Adventure',
      description: 'Meet outdoor activity enthusiasts!',
      startTime: new Date(Date.now() + 345600000), // 4 days from now
      endTime: new Date(Date.now() + 349200000),
      isSpecialEvent: true,
      icon: FaHiking,
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Box py={8}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">
          Upcoming Drops
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {upcomingDrops.map((drop) => (
            <Box
              key={drop.id}
              p={6}
              borderRadius="lg"
              bg="white"
              boxShadow="md"
              border="1px"
              borderColor="gray.200"
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-2px)' }}
            >
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Icon as={drop.icon} w={6} h={6} color="blue.500" />
                  <Text fontSize="xl" fontWeight="bold">
                    {drop.theme}
                  </Text>
                  {drop.isSpecialEvent && (
                    <Badge colorScheme="purple">Special Event</Badge>
                  )}
                </HStack>
                <Text color="gray.600">{drop.description}</Text>
                <Box bg="blue.50" p={3} borderRadius="md">
                  <Text fontSize="sm" color="blue.700">
                    🗓 {formatDate(drop.startTime)}
                  </Text>
                </Box>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
