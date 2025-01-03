import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Heading,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FaTrophy, 
  FaFire, 
  FaChartLine 
} from 'react-icons/fa';
import { MdLeaderboard } from 'react-icons/md';
import { UserProfile } from '../../types';

interface LeaderboardMiniProps {
  user: UserProfile;
}

const mockLeaderboardData = [
  {
    uid: 'user1',
    displayName: 'Alex Johnson',
    streak: 12,
    progress: 85,
    photoURL: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    uid: 'user2',
    displayName: 'Emma Smith',
    streak: 10,
    progress: 75,
    photoURL: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    uid: 'user3',
    displayName: 'Michael Chen',
    streak: 8,
    progress: 65,
    photoURL: 'https://randomuser.me/api/portraits/men/3.jpg'
  }
];

export default function LeaderboardMini({ user }: LeaderboardMiniProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box 
      p={6} 
      borderWidth={1} 
      borderRadius="lg" 
      bg={bgColor} 
      borderColor={borderColor}
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading 
            size="lg" 
            display="flex" 
            alignItems="center"
          >
            <MdLeaderboard style={{ marginRight: '10px' }} />
            Leaderboard
          </Heading>
          <Badge 
            colorScheme="green" 
            variant="subtle"
            display="flex" 
            alignItems="center"
          >
            <FaTrophy style={{ marginRight: '5px' }} />
            Top Connectors
          </Badge>
        </HStack>

        {mockLeaderboardData.map((leader, index) => (
          <HStack 
            key={leader.uid} 
            bg={useColorModeValue('gray.50', 'gray.700')} 
            p={3} 
            borderRadius="md"
            justify="space-between"
            align="center"
          >
            <HStack spacing={4}>
              <Text fontWeight="bold" color="gray.500">
                #{index + 1}
              </Text>
              <Avatar 
                size="sm" 
                src={leader.photoURL} 
                name={leader.displayName} 
              />
              <Text fontWeight="semibold">{leader.displayName}</Text>
            </HStack>

            <HStack spacing={4}>
              <HStack>
                <FaFire color="orange" />
                <Text fontSize="sm">{leader.streak} days</Text>
              </HStack>
              <HStack>
                <FaChartLine color="green" />
                <Text fontSize="sm">{leader.progress}%</Text>
              </HStack>
            </HStack>
          </HStack>
        ))}

        {/* User's Position */}
        <HStack 
          bg={useColorModeValue('blue.50', 'blue.900')} 
          p={3} 
          borderRadius="md" 
          justify="space-between"
          align="center"
        >
          <HStack>
            <Avatar 
              size="sm" 
              src={user.photoURL} 
              name={user.displayName} 
            />
            <Text fontWeight="semibold">Your Position</Text>
          </HStack>
          <HStack spacing={4}>
            <HStack>
              <FaFire color="orange" />
              <Text fontSize="sm">{user.streak} days</Text>
            </HStack>
            <HStack>
              <FaChartLine color="green" />
              <Text fontSize="sm">{user.progress}%</Text>
            </HStack>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
}
