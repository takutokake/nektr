import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Heading,
  useToast,
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
import { collection, doc, getDocs, query, where, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Drop, UserProfile } from '../../types';
import { format } from 'date-fns';

interface DropsSectionProps {
  user: UserProfile;
}

export default function DropsSection({ user }: DropsSectionProps) {
  const [nextDrop, setNextDrop] = useState<Drop | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch next drop from Firestore
  const fetchNextDrop = async () => {
    try {
      const dropsRef = collection(db, 'drops');
      const q = query(dropsRef, where('status', '==', 'upcoming'));
      const querySnapshot = await getDocs(q);
      
      const drops: Drop[] = [];
      querySnapshot.forEach((doc) => {
        drops.push({ id: doc.id, ...doc.data() } as Drop);
      });

      // Get the next upcoming drop
      const sortedDrops = drops.sort((a, b) => 
        a.startTime.toMillis() - b.startTime.toMillis()
      );
      setNextDrop(sortedDrops[0] || null);
    } catch (error) {
      console.error('Error fetching next drop:', error);
    }
  };

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      if (!nextDrop) {
        setTimeLeft('No upcoming drops');
        return;
      }

      const now = new Date().getTime();
      const dropTime = nextDrop.startTime.toMillis();
      const distance = dropTime - now;

      if (distance < 0) {
        setTimeLeft('Drop is live!');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    fetchNextDrop();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [nextDrop]);

  // Register for drop
  const registerForDrop = async (drop: Drop) => {
    if (!user) return;

    try {
      if (drop.registeredUsers.includes(user.uid)) {
        toast({
          title: 'Already registered',
          description: 'You are already registered for this drop',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Update drop document
      const dropRef = doc(db, 'drops', drop.id);
      await updateDoc(dropRef, {
        currentParticipants: drop.currentParticipants + 1,
        registeredUsers: arrayUnion(user.uid)
      });

      toast({
        title: 'Successfully registered!',
        description: "You'll be notified when it's time to meet your match!",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      fetchNextDrop(); // Refresh drop data
    } catch (error) {
      console.error('Error registering for drop:', error);
      toast({
        title: 'Error registering for drop',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

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
        
        {nextDrop ? (
          <>
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
                  onClick={() => registerForDrop(nextDrop)}
                  isDisabled={
                    nextDrop.registeredUsers.includes(user.uid) ||
                    nextDrop.currentParticipants >= nextDrop.maxParticipants
                  }
                >
                  {nextDrop.registeredUsers.includes(user.uid)
                    ? 'Already Registered'
                    : nextDrop.currentParticipants >= nextDrop.maxParticipants
                    ? 'Drop Full'
                    : 'Join Drop'}
                </Button>
              </VStack>
            </Box>
          </>
        ) : (
          <Text textAlign="center" color="gray.600">
            No upcoming drops scheduled. Check back soon!
          </Text>
        )}
      </VStack>
    </Box>
  );
}
