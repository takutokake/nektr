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
    // Try to get from localStorage first
    const cached = localStorage.getItem(`drop_${user?.uid}`);
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const calculateTimeLeft = useCallback((dropTime: number): TimeLeft => {
    const now = new Date().getTime();
    const distance = dropTime - now;

    return {
      total: distance,
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000)
    };
  }, []);

  const fetchNextDrop = useCallback(async () => {
    if (isLoading || !user?.uid) return;
    setIsLoading(true);
    try {
      const drops = await dropsCache.getUpcomingDrops(user.uid);
      if (drops.length > 0) {
        const nextDrop = drops[0];
        setNextDrop(nextDrop);
        setIsRegistered(user.registeredDrops?.includes(nextDrop.id) || false);
        // Cache in localStorage
        localStorage.setItem(`drop_${user.uid}`, JSON.stringify(nextDrop));
      } else {
        setNextDrop(null);
        localStorage.removeItem(`drop_${user.uid}`);
      }
    } catch (error) {
      console.error('Error fetching next drop:', error);
      if (user?.uid) {
        toast({
          title: 'Error fetching drops',
          description: 'Please try again later',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, isLoading, toast]);

  // Schedule next refresh based on time remaining
  const scheduleNextRefresh = useCallback((timeLeft: TimeLeft) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Refresh 1 minute before drop starts or when it ends
    if (timeLeft.total > 0) {
      const refreshIn = timeLeft.total <= 60000 ? timeLeft.total : timeLeft.total - 60000;
      refreshTimeoutRef.current = setTimeout(() => {
        fetchNextDrop();
      }, refreshIn);
    }
  }, [fetchNextDrop]);

  useEffect(() => {
    if (!user?.uid) {
      setNextDrop(null);
      setIsRegistered(false);
      setTimeLeft('');
      localStorage.removeItem(`drop_${user?.uid}`);
      return;
    }
    fetchNextDrop();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchNextDrop, user?.uid]);

  useEffect(() => {
    const updateTimer = () => {
      if (!nextDrop) {
        setTimeLeft('No upcoming drops');
        return;
      }

      const dropTime = nextDrop.startTime.toMillis();
      const timeLeft = calculateTimeLeft(dropTime);

      if (timeLeft.total < 0) {
        setTimeLeft('Drop is live!');
        fetchNextDrop(); // Refresh to get next drop
        return;
      }

      setTimeLeft(`${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`);
      scheduleNextRefresh(timeLeft);
    };

    // Update immediately and then every second
    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(timer);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [nextDrop, calculateTimeLeft, scheduleNextRefresh, fetchNextDrop]);

  const handleRegister = async () => {
    if (!nextDrop || !user?.uid || isRegistered) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        registeredDrops: arrayUnion(nextDrop.id)
      });

      setIsRegistered(true);
      toast({
        title: 'Successfully registered!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error registering for drop:', error);
      toast({
        title: 'Registration failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Center p={4}>
        <Spinner />
      </Center>
    );
  }

  if (!nextDrop) {
    return (
      <Box p={4}>
        <Text>No upcoming drops available.</Text>
      </Box>
    );
  }

  return (
    <Box p={6} borderWidth={1} borderRadius="lg" bg={bgColor} borderColor={borderColor}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="lg" display="flex" alignItems="center">
            <MdEventAvailable style={{ marginRight: '10px' }} /> 
            Next Drop
          </Heading>
          
          <Badge 
            colorScheme="blue" 
            variant="subtle"
            display="flex" 
            alignItems="center"
          >
            <FaCalendarCheck style={{ marginRight: '5px' }} />
            Upcoming
          </Badge>
        </HStack>
        
        <Box>
          <VStack align="start" spacing={4}>
            <HStack width="full" justify="space-between">
              <Text fontSize="2xl" fontWeight="bold">
                {nextDrop.title}
              </Text>
              <Badge
                colorScheme={
                  nextDrop.currentParticipants >= nextDrop.maxParticipants
                    ? 'red'
                    : 'green'
                }
                fontSize="md"
                p={2}
                borderRadius="md"
                display="flex"
                alignItems="center"
              >
                <FaUsers style={{ marginRight: '5px' }} />
                {nextDrop.currentParticipants}/{nextDrop.maxParticipants} spots
              </Badge>
            </HStack>

            <Text color="gray.600">
              {nextDrop.description}
            </Text>

            <Divider my={2} />
            
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
                <Text>{format(nextDrop.startTime.toDate(), 'PPp')}</Text>
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
              onClick={handleRegister}
              isDisabled={
                isRegistered ||
                nextDrop.currentParticipants >= nextDrop.maxParticipants
              }
            >
              {isRegistered
                ? 'Already Registered'
                : nextDrop.currentParticipants >= nextDrop.maxParticipants
                ? 'Drop Full'
                : 'Join Drop'}
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
