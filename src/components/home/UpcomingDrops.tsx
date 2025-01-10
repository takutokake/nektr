import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Heading, 
  HStack, 
  Badge, 
  useColorModeValue,
  Button,
  useToast,
  SimpleGrid,
  Icon,
  Progress
} from '@chakra-ui/react';
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaClock, 
  FaMoneyBillWave, 
  FaCalendarCheck 
} from 'react-icons/fa';
import { Timestamp, doc, getDoc, writeBatch } from 'firebase/firestore';
import { Drop, DropParticipants } from '../../types';
import { db, auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

// Extracted pure functions outside the component
const formatDate = (timestamp: Timestamp) => 
  timestamp.toDate().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

const formatTime = (timestamp: Timestamp) => 
  timestamp.toDate().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

const calculateTimeLeft = (dropTime: Timestamp): string => {
  const difference = dropTime.toDate().getTime() - new Date().getTime();
  
  if (difference > 0) {
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
    
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return '00h 00m 00s';
};

// Create a custom hook to manage drop joining logic
const useDropJoin = (drops: Drop[], onDropJoin?: (dropId: string) => void) => {
  const [joiningDrops, setJoiningDrops] = useState<Set<string>>(new Set());
  const [selectedDrop, setSelectedDrop] = useState<string | null>(null);
  const toast = useToast();
  const { user } = useAuth();

  const joinDrop = useCallback(async (drop: Drop) => {
    const currentUser = user || auth.currentUser;
    
    if (!currentUser) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to join a drop",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Prevent multiple join attempts
    if (joiningDrops.has(drop.id)) return;

    setSelectedDrop(drop.id);
    setJoiningDrops(prev => new Set(prev).add(drop.id));

    try {
      const dropRef = doc(db, 'drops', drop.id);
      const participantsRef = doc(db, 'dropParticipants', drop.id);
      
      // Get user profile for additional info
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      // Get the current drop participants document
      const participantsSnap = await getDoc(participantsRef);
      const participantsData = participantsSnap.exists() 
        ? participantsSnap.data() as DropParticipants 
        : {
            dropId: drop.id,
            dropName: drop.title,
            participants: {},
            totalParticipants: 0,
            maxParticipants: drop.maxParticipants || 10
          };

      // Check if user is already joined
      if (participantsData.participants[currentUser.uid]) {
        toast({
          title: "Already joined",
          description: "You're already part of this drop",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Check if drop is full
      if (participantsData.totalParticipants >= (drop.maxParticipants || 10)) {
        toast({
          title: "Drop is full",
          description: "This drop has reached its maximum capacity",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Prepare batch write
      const batch = writeBatch(db);

      // Update participants document
      const newParticipant = {
        name: userData?.name || currentUser.email || 'Anonymous',
        registeredAt: Timestamp.now(),
        status: 'pending' as const,
        profile: {
          interests: userData?.interests || [],
          cuisines: userData?.cuisines || []
        }
      };

      participantsData.participants[currentUser.uid] = newParticipant;
      participantsData.totalParticipants = Object.keys(participantsData.participants).length;

      // Set/update the participants document
      batch.set(participantsRef, participantsData);

      // Update drop participants array
      batch.update(dropRef, {
        participants: drop.participants ? [...drop.participants, currentUser.uid] : [currentUser.uid],
        currentParticipants: participantsData.totalParticipants
      });

      // Commit the batch
      await batch.commit();

      toast({
        title: "Successfully joined!",
        description: "You've been added to the drop",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Optional callback
      onDropJoin?.(drop.id);
    } catch (error) {
      console.error('Error joining drop:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Error joining drop",
        description: `Failed to join: ${errorMessage}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setJoiningDrops(prev => {
        const next = new Set(prev);
        next.delete(drop.id);
        return next;
      });
      setSelectedDrop(null);
    }
  }, [user, toast, onDropJoin, joiningDrops]);

  return { joiningDrops, selectedDrop, joinDrop };
};

// Create a custom hook for time tracking
const useDropTimers = (drops: Drop[]) => {
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

  const futureDrops = useMemo(() => 
    drops
      .filter(drop => drop.startTime.toDate() > new Date())
      .sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime()),
    [drops]
  );

  useEffect(() => {
    const updateTimers = () => {
      const newTimes: { [key: string]: string } = {};
      futureDrops.forEach(drop => {
        newTimes[drop.id] = calculateTimeLeft(drop.startTime);
      });
      setTimeLeft(newTimes);
    };

    // Initial calculation
    updateTimers();

    // Set up interval
    const timer = setInterval(updateTimers, 1000);

    // Cleanup
    return () => clearInterval(timer);
  }, [futureDrops]);

  return { timeLeft, futureDrops };
};

interface UpcomingDropsProps {
  drops: Drop[];
  onDropJoin?: (dropId: string) => void;
}

const UpcomingDrops: React.FC<UpcomingDropsProps> = ({ drops, onDropJoin }) => {
  // Color mode hooks - always called
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.700', 'white');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');

  // Custom hooks - always called in the same order
  const { timeLeft, futureDrops } = useDropTimers(drops);
  const { joiningDrops, selectedDrop, joinDrop } = useDropJoin(drops, onDropJoin);

  // Render logic
  if (futureDrops.length === 0) {
    return (
      <Box 
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        p={6}
        bg={bgColor}
        shadow="md"
      >
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Next Drop</Heading>
          <Text color="gray.600">No upcoming drops available</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch" width="full">
      {futureDrops.map((drop, index) => (
        <Box
          key={drop.id}
          borderWidth="1px"
          borderRadius="xl"
          overflow="hidden"
          bg={bgColor}
          shadow="lg"
          transition="all 0.2s"
          _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
        >
          {/* Header Section */}
          <Box 
            bg={index === 0 ? useColorModeValue('brand.50', 'brand.900') : useColorModeValue('white', 'gray.800')} 
            p={4} 
            borderBottom="1px" 
            borderColor={borderColor}
          >
            <Badge 
              colorScheme={index === 0 ? "blue" : "brand"} 
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
              mb={2}
            >
              {index === 0 ? 'Next Drop' : `Upcoming Drop ${index + 1}`}
            </Badge>
            <Heading size="lg" mb={2}>
              {drop.title}
            </Heading>
            <Text fontSize="md" color={textColor}>
              {drop.description}
            </Text>
          </Box>

          {/* Content Section */}
          <Box p={6}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {/* Left Column - Details */}
              <VStack align="start" spacing={4}>
                <Box width="full">
                  <Text fontWeight="bold" fontSize="lg" mb={3}>
                    Drop Details
                  </Text>
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Icon as={FaMapMarkerAlt} color="red.500" />
                      <Text fontWeight="medium">Location:</Text>
                      <Text>{drop.location || 'USC'}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaMoneyBillWave} color="green.500" />
                      <Text fontWeight="medium">Price Range:</Text>
                      <Text>{drop.priceRange || '$$'}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaCalendarAlt} color="blue.500" />
                      <Text fontWeight="medium">Date:</Text>
                      <Text>{formatDate(drop.startTime)}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaClock} color="purple.500" />
                      <Text fontWeight="medium">Time:</Text>
                      <Text>{formatTime(drop.startTime)}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaCalendarCheck} color="teal.500" />
                      <Text fontWeight="medium">Registration Deadline:</Text>
                      <Text>{formatDate(drop.registrationDeadline)} at {formatTime(drop.registrationDeadline)}</Text>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>

              {/* Right Column - Timer and Action */}
              <VStack align="center" justify="center" spacing={4}>
                <Box 
                  p={4} 
                  borderRadius="lg" 
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  width="full"
                  textAlign="center"
                >
                  <Text fontSize="md" mb={2}>Time until drop:</Text>
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color={useColorModeValue('blue.600', 'blue.300')}
                  >
                    {timeLeft[drop.id] || calculateTimeLeft(drop.startTime)}
                  </Text>
                </Box>

                <Box width="full">
                  <Button
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    leftIcon={<FaCalendarCheck />}
                    isLoading={joiningDrops.has(drop.id)}
                    isDisabled={Boolean(
                      drop.participants?.includes(auth.currentUser?.uid || '') ||
                      (drop.participants && drop.maxParticipants && 
                       drop.participants.length >= drop.maxParticipants)
                    )}
                    onClick={() => joinDrop(drop)}
                    _hover={{ transform: 'translateY(-1px)' }}
                  >
                    {drop.participants?.includes(auth.currentUser?.uid || '')
                      ? 'Already Registered'
                      : (drop.participants && drop.maxParticipants && 
                         drop.participants.length >= drop.maxParticipants)
                        ? 'Drop Full'
                        : 'Join Drop'}
                  </Button>
                  
                  {/* Capacity indicator */}
                  <Box mt={2} textAlign="center">
                    <Text fontSize="sm" color={textColor}>
                      {drop.currentParticipants || 0} / {drop.maxParticipants || 10} spots filled
                    </Text>
                    <Progress 
                      value={((drop.currentParticipants || 0) / (drop.maxParticipants || 10)) * 100}
                      size="sm"
                      mt={1}
                      colorScheme="blue"
                      borderRadius="full"
                    />
                  </Box>
                </Box>
              </VStack>
            </SimpleGrid>
          </Box>
        </Box>
      ))}
    </VStack>
  );
};

export default UpcomingDrops;
