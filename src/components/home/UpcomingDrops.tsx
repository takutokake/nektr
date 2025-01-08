import React, { useState, useEffect, useMemo } from 'react';
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
  Divider
} from '@chakra-ui/react';
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaClock, 
  FaMoneyBillWave, 
  FaCalendarCheck 
} from 'react-icons/fa';
import { Timestamp, doc, getDoc, setDoc, updateDoc, writeBatch, collection } from 'firebase/firestore';
import { Drop, DropParticipants } from '../../types';
import { db, auth } from '../../firebase';

interface UpcomingDropsProps {
  drops: Drop[];
  onDropJoin?: (dropId: string) => void;
}

const UpcomingDrops: React.FC<UpcomingDropsProps> = ({ drops, onDropJoin }) => {
  const [joiningDrops, setJoiningDrops] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();

  const joinDrop = async (drop: Drop) => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to join a drop",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setJoiningDrops(prev => new Set(prev).add(drop.id));

    try {
      const dropRef = doc(db, 'drops', drop.id);
      const participantsRef = doc(db, 'dropParticipants', drop.id);
      
      // Get user profile for additional info
      const userRef = doc(db, 'users', user.uid);
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
      if (participantsData.participants[user.uid]) {
        toast({
          title: "Already joined",
          description: "You're already part of this drop",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        setJoiningDrops(prev => {
          const next = new Set(prev);
          next.delete(drop.id);
          return next;
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
        setJoiningDrops(prev => {
          const next = new Set(prev);
          next.delete(drop.id);
          return next;
        });
        return;
      }

      // Prepare batch write
      const batch = writeBatch(db);

      // Update participants document
      const newParticipant = {
        name: userData?.name || user.email || 'Anonymous',
        registeredAt: Timestamp.now(),
        status: 'pending' as const,
        profile: {
          interests: userData?.interests || [],
          cuisines: userData?.cuisines || []
        }
      };

      participantsData.participants[user.uid] = newParticipant;
      participantsData.totalParticipants = Object.keys(participantsData.participants).length;

      // Set/update the participants document
      batch.set(participantsRef, participantsData);

      // Update drop participants array (for backward compatibility)
      const dropSnap = await getDoc(dropRef);
      if (dropSnap.exists()) {
        const dropData = dropSnap.data();
        const currentParticipants = dropData.participants || [];
        batch.update(dropRef, {
          participants: [...currentParticipants, user.uid],
          currentParticipants: participantsData.totalParticipants
        });
      }

      // Commit the batch
      await batch.commit();

      toast({
        title: "Successfully joined!",
        description: "You've been added to the drop",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      if (onDropJoin) {
        onDropJoin(drop.id);
      }
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
    }
  };

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

  // Filter drops to only show future drops and sort by start time
  const futureDrops = useMemo(() => 
    drops
      .filter(drop => drop.startTime.toDate() > new Date())
      .sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime()),
    [drops]
  );

  // Update timers every second
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
  }, [futureDrops]); // Only re-run if futureDrops changes

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
    <VStack spacing={4} align="stretch" width="full">
      {futureDrops.map((drop, index) => (
        <Box
          key={drop.id}
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          p={6}
          bg={bgColor}
          shadow="md"
        >
          <VStack spacing={4} align="stretch">
            <Box>
              <Heading size="md" mb={2}>
                {index === 0 ? 'Next Drop' : `Upcoming Drop ${index + 1}`}
              </Heading>
              <Text fontSize="lg" color="gray.600">
                {drop.description}
              </Text>
            </Box>

            <Divider />
            
            <VStack align="start" spacing={3} width="full">
              <HStack>
                <FaMapMarkerAlt color="gray" />
                <Text fontWeight="semibold">Location:</Text>
                <Text>{drop.location || 'USC'}</Text>
              </HStack>
              <HStack>
                <FaMoneyBillWave color="green" />
                <Text fontWeight="semibold">Price Range:</Text>
                <Text>{drop.priceRange || '$$'}</Text>
              </HStack>
              <HStack>
                <FaClock color="blue" />
                <Text fontWeight="semibold">Drop Time:</Text>
                <Text>{formatDate(drop.startTime)} at {formatTime(drop.startTime)}</Text>
              </HStack>
            </VStack>

            <Box mt={4} textAlign="center" width="full">
              <Text fontSize="xl" mb={2} display="flex" justifyContent="center" alignItems="center">
                <FaClock style={{ marginRight: '10px' }} />
                Time until drop:
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                {timeLeft[drop.id] || calculateTimeLeft(drop.startTime)}
              </Text>
            </Box>

            <Button
              mt={4}
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
            >
              {drop.participants?.includes(auth.currentUser?.uid || '')
                ? 'Already Registered'
                : (drop.participants && drop.maxParticipants && 
                   drop.participants.length >= drop.maxParticipants)
                  ? 'Drop Full'
                  : 'Join Drop'}
            </Button>
          </VStack>
        </Box>
      ))}
    </VStack>
  );
};

export default UpcomingDrops;
