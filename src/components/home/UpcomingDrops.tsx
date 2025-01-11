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
      const batch = writeBatch(db);
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
            id: drop.id,
            dropId: drop.id,
            dropName: drop.title,
            registeredAt: Timestamp.now(),
            participants: {},
            totalParticipants: 0,
            maxParticipants: drop.maxParticipants
          };

      // Check if the drop is full
      if (participantsData.totalParticipants >= participantsData.maxParticipants) {
        throw new Error('Drop is full');
      }

      // Add the user to participants
      const updatedParticipants = {
        ...participantsData,
        participants: {
          ...participantsData.participants,
          [currentUser.uid]: {
            name: userData?.name || currentUser.email || 'Anonymous',
            profileId: currentUser.uid,
            registeredAt: Timestamp.now(),
            status: 'pending'
          }
        },
        totalParticipants: participantsData.totalParticipants + 1
      };

      // Update the participants document
      batch.set(participantsRef, updatedParticipants);
      await batch.commit();

      if (onDropJoin) {
        onDropJoin(drop.id);
      }

      toast({
        title: "Success",
        description: "You've successfully joined the drop!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error joining drop:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join drop",
        status: "error",
        duration: 3000,
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
  }, [user, joiningDrops, toast, onDropJoin]);

  return { joiningDrops, selectedDrop, joinDrop };
};

// Create a custom hook for time tracking
const useDropTimers = (drops: Drop[]) => {
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const updateTimers = () => {
      const newTimeLeft: { [key: string]: string } = {};
      drops.forEach(drop => {
        newTimeLeft[drop.id] = calculateTimeLeft(drop.startTime);
      });
      setTimeLeft(newTimeLeft);
    };

    updateTimers();
    timerRef.current = setInterval(updateTimers, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [drops]);

  const futureDrops = useMemo(() => 
    drops.filter(drop => drop.startTime.toDate() > new Date()), 
    [drops]
  );

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
  const [participants, setParticipants] = useState<{ [dropId: string]: DropParticipants }>({});

  // Fetch participants for each drop
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const participantsPromises = drops.map(async (drop) => {
          const participantsRef = doc(db, 'dropParticipants', drop.id);
          const participantsSnap = await getDoc(participantsRef);
          
          if (participantsSnap.exists()) {
            return { 
              [drop.id]: participantsSnap.data() as DropParticipants 
            };
          }
          return {};
        });

        const participantsResults = await Promise.all(participantsPromises);
        const newParticipants = participantsResults.reduce((acc, curr) => ({
          ...acc,
          ...curr
        }), {});

        setParticipants(newParticipants);
      } catch (error) {
        console.error('Error fetching drop participants:', error);
      }
    };

    fetchParticipants();
  }, [drops]);

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
          <Text color={textColor}>No upcoming drops available</Text>
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
            bg={index === 0 ? useColorModeValue('blue.50', 'blue.900') : bgColor} 
            p={6} 
            borderBottom="1px" 
            borderColor={borderColor}
          >
            <Badge 
              colorScheme="blue" 
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="full"
              mb={1}
            >
              {index === 0 ? 'NEXT DROP' : `Upcoming Drop ${index + 1}`}
            </Badge>
            <Heading size="lg" mb={1} color={headingColor}>
              {drop.title}
            </Heading>
            <Text fontSize="md" color={textColor}>
              {drop.description}
            </Text>
          </Box>

          {/* Content Section */}
          <Box p={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {/* Left Column - Details */}
              <Box>
                <Heading size="md" mb={3} color={headingColor}>Drop Details</Heading>
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <Icon as={FaMapMarkerAlt} color="red.500" boxSize={4} />
                    <Text fontWeight="medium" fontSize="md">Location:</Text>
                    <Text fontSize="md">{drop.location}</Text>
                  </HStack>
                  
                  <HStack>
                    <Icon as={FaMoneyBillWave} color="green.500" boxSize={4} />
                    <Text fontWeight="medium" fontSize="md">Price Range:</Text>
                    <Text fontSize="md">${drop.priceRange || 'Free'}</Text>
                  </HStack>
                  
                  <HStack>
                    <Icon as={FaCalendarAlt} color="blue.500" boxSize={4} />
                    <Text fontWeight="medium" fontSize="md">Date:</Text>
                    <Text fontSize="md">{formatDate(drop.startTime)}</Text>
                  </HStack>
                  
                  <HStack>
                    <Icon as={FaClock} color="purple.500" boxSize={4} />
                    <Text fontWeight="medium" fontSize="md">Time:</Text>
                    <Text fontSize="md">{formatTime(drop.startTime)}</Text>
                  </HStack>

                  <HStack>
                    <Icon as={FaCalendarCheck} color="teal.500" boxSize={4} />
                    <Text fontWeight="medium" fontSize="md">Registration Deadline:</Text>
                    <Text fontSize="md">{formatDate(drop.registrationDeadline)} at {formatTime(drop.registrationDeadline)}</Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Right Column - Timer and Action */}
              <VStack align="stretch" spacing={4}>
                <Box 
                  p={4} 
                  borderRadius="lg" 
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  textAlign="center"
                >
                  <Text fontSize="md" mb={1}>Time until drop:</Text>
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color={useColorModeValue('blue.600', 'blue.300')}
                  >
                    {timeLeft[drop.id]}
                  </Text>
                </Box>

                <VStack spacing={2} width="full">
                  <Button
                    size="md"
                    width="full"
                    height="48px"
                    colorScheme="blue"
                    fontSize="md"
                    leftIcon={<Icon as={FaCalendarCheck} boxSize={4} />}
                    isLoading={joiningDrops.has(drop.id)}
                    loadingText="Joining..."
                    onClick={() => joinDrop(drop)}
                  >
                    Join Drop
                  </Button>

                  {participants[drop.id] && (
                    <Box width="full">
                      <Progress 
                        value={(participants[drop.id].totalParticipants / participants[drop.id].maxParticipants) * 100}
                        size="sm"
                        colorScheme="blue"
                        borderRadius="full"
                        mb={1}
                      />
                      <Text fontSize="sm" textAlign="center" color={textColor}>
                        {participants[drop.id].totalParticipants} / {participants[drop.id].maxParticipants} spots filled
                      </Text>
                    </Box>
                  )}
                </VStack>
              </VStack>
            </SimpleGrid>
          </Box>
        </Box>
      ))}
    </VStack>
  );
};

export default UpcomingDrops;
