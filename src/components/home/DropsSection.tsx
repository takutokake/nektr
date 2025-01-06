import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Text,
  Heading,
  VStack,
  useToast,
  Spinner,
  Center,
  Grid,
  GridItem,
  Badge,
  HStack,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaMoneyBillWave, 
  FaCalendarCheck, 
  FaUsers 
} from 'react-icons/fa';
import { MdEventAvailable } from 'react-icons/md';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Drop, UserProfile } from '../../types';
import { format } from 'date-fns';
import { dropsCache } from '../../services/dropsService';

interface DropsSectionProps {
  user: UserProfile;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function DropsSection({ user }: DropsSectionProps) {
  const [nextDrop, setNextDrop] = useState<Drop | null>(() => {
    try {
      const cached = localStorage.getItem(`drop_${user?.uid}`);
      if (cached) {
        const parsedDrop = JSON.parse(cached);
        if (parsedDrop.startTime) {
          parsedDrop.startTime = Timestamp.fromMillis(Date.parse(parsedDrop.startTime));
        }
        return parsedDrop;
      }
    } catch (error) {
      console.error('Error parsing cached drop:', error);
      localStorage.removeItem(`drop_${user?.uid}`);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const toast = useToast();
  const timerRef = useRef<NodeJS.Timeout>();

  const formatDropTime = (timestamp: Timestamp | undefined): string => {
    if (!timestamp || !(timestamp instanceof Timestamp)) {
      return 'Time not available';
    }
    try {
      const date = timestamp.toDate();
      return format(date, 'PPp');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const calculateTimeLeft = useCallback((dropTime: Timestamp): TimeLeft => {
    const now = Date.now();
    const dropTimeMs = dropTime.toMillis();
    const total = Math.max(0, dropTimeMs - now);
    
    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, total };
  }, []);

  useEffect(() => {
    if (nextDrop?.startTime && nextDrop.startTime instanceof Timestamp) {
      const updateTimer = () => {
        const timeLeft = calculateTimeLeft(nextDrop.startTime as Timestamp);
        setTimeLeft(`${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`);
        
        if (timeLeft.total <= 0) {
          clearInterval(timerRef.current);
          fetchNextDrop();
        }
      };
      
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [nextDrop?.startTime, calculateTimeLeft]);

  const fetchNextDrop = useCallback(async () => {
    try {
      setIsLoading(true);
      const drops = await dropsCache.getUpcomingDrops(user.uid);
      const nextDrop = drops[0] || null;
      
      if (nextDrop) {
        // Ensure startTime is a Firestore Timestamp
        if (!(nextDrop.startTime instanceof Timestamp)) {
          nextDrop.startTime = Timestamp.fromMillis(Date.parse(nextDrop.startTime));
        }
        // Store in localStorage with date string
        localStorage.setItem(`drop_${user.uid}`, JSON.stringify({
          ...nextDrop,
          startTime: nextDrop.startTime.toDate().toISOString()
        }));
      } else {
        localStorage.removeItem(`drop_${user.uid}`);
      }
      
      setNextDrop(nextDrop);
      setIsRegistered(nextDrop?.participants?.includes(user.uid) || false);
    } catch (error) {
      console.error('Error fetching next drop:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch upcoming drops',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user.uid, toast]);

  useEffect(() => {
    fetchNextDrop();
  }, [fetchNextDrop]);

  if (isLoading) {
    return (
      <Center p={4}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!nextDrop) {
    return (
      <Center p={4}>
        <Text>No upcoming drops available</Text>
      </Center>
    );
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={6}
      bg={useColorModeValue('white', 'gray.800')}
      shadow="md"
    >
      <VStack spacing={4} align="stretch">
        <Box>
          <Heading size="md" mb={2}>
            Next Drop
          </Heading>
          <Text fontSize="lg" color="gray.600">
            {nextDrop.description}
          </Text>
        </Box>

        <Divider />
        
        <VStack align="start" spacing={3} width="full">
          <HStack>
            <FaMapMarkerAlt color="gray" />
            <Text fontWeight="semibold">Location:</Text>
            <Text>{nextDrop.location}</Text>
          </HStack>
          <HStack>
            <FaMoneyBillWave color="green" />
            <Text fontWeight="semibold">Price Range:</Text>
            <Text>{nextDrop.priceRange}</Text>
          </HStack>
          <HStack>
            <FaClock color="blue" />
            <Text fontWeight="semibold">Drop Time:</Text>
            <Text>{formatDropTime(nextDrop.startTime)}</Text>
          </HStack>
        </VStack>

        <Box mt={4} textAlign="center" width="full">
          <Text fontSize="xl" mb={2} display="flex" justifyContent="center" alignItems="center">
            <FaClock style={{ marginRight: '10px' }} />
            Time until drop:
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="blue.500">
            {timeLeft}
          </Text>
        </Box>

        <Button
          mt={4}
          colorScheme="blue"
          size="lg"
          width="full"
          leftIcon={<FaCalendarCheck />}
          isDisabled={isRegistered || nextDrop.currentParticipants >= nextDrop.maxParticipants}
        >
          {isRegistered
            ? 'Already Registered'
            : nextDrop.currentParticipants >= nextDrop.maxParticipants
            ? 'Drop Full'
            : 'Join Drop'}
        </Button>
      </VStack>
    </Box>
  );
}
