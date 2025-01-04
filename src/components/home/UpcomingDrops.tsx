import React from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Heading, 
  HStack, 
  Badge, 
  useColorModeValue 
} from '@chakra-ui/react';
import { Timestamp } from 'firebase/firestore';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { Drop } from '../../types';

interface UpcomingDropsProps {
  drops: Drop[];
}

const UpcomingDrops: React.FC<UpcomingDropsProps> = ({ drops }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // If no drops, use mock data
  const displayDrops = drops.length > 0 ? drops : [
    {
      id: 'mock-drop-1',
      title: 'Tech Foodies Meetup',
      description: 'Connect with fellow tech enthusiasts over delicious cuisine',
      startTime: Timestamp.now(),
      endTime: Timestamp.now(),
      location: 'Downtown Cafe',
      maxParticipants: 10,
      participants: [],
      theme: 'Tech & Food',
      isSpecialEvent: true,
      icon: null
    }
  ];

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box 
      p={4} 
      borderWidth={1} 
      borderRadius="lg" 
      bg={bgColor} 
      borderColor={borderColor}
    >
      <VStack align="stretch" spacing={4}>
        <Heading size="md" display="flex" alignItems="center">
          <FaCalendarAlt style={{ marginRight: '10px' }} /> Upcoming Drops
        </Heading>

        {displayDrops.map((drop) => (
          <Box 
            key={drop.id} 
            bg="gray.50" 
            p={4} 
            borderRadius="md"
          >
            <VStack align="stretch" spacing={3}>
              <HStack justifyContent="space-between">
                <Text fontWeight="bold" fontSize="lg">
                  {drop.title}
                </Text>
                {drop.isSpecialEvent && (
                  <Badge colorScheme="purple">Special Event</Badge>
                )}
              </HStack>

              <Text color="gray.600">{drop.description}</Text>

              <HStack spacing={3} color="gray.600">
                <HStack>
                  <FaMapMarkerAlt />
                  <Text fontSize="sm">{drop.location || 'TBD'}</Text>
                </HStack>
                <HStack>
                  <FaClock />
                  <Text fontSize="sm">
                    {formatDate(drop.startTime)} at {formatTime(drop.startTime)}
                  </Text>
                </HStack>
              </HStack>

              <HStack justifyContent="space-between">
                <Text fontSize="sm">
                  Participants: {drop.participants?.length || 0} / 
                  {drop.maxParticipants || '∞'}
                </Text>
                <Badge 
                  colorScheme={
                    drop.theme === 'Tech & Food' ? 'green' : 
                    drop.theme === 'Sports' ? 'blue' : 
                    'gray'
                  }
                >
                  {drop.theme || 'General'}
                </Badge>
              </HStack>
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default UpcomingDrops;
