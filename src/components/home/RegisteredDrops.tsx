import React, { useState } from 'react';
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
  Icon
} from '@chakra-ui/react';
import { Timestamp, doc, runTransaction } from 'firebase/firestore';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaTrash } from 'react-icons/fa';
import { Drop } from '../../types';
import { db, auth } from '../../firebase';

interface RegisteredDropsProps {
  drops: Drop[];
  onDropUnregister?: (dropId: string) => void;
}

const RegisteredDrops: React.FC<RegisteredDropsProps> = ({ drops, onDropUnregister }) => {
  const [unregisteringDrops, setUnregisteringDrops] = useState<Set<string>>(new Set());
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();

  const unregisterFromDrop = async (drop: Drop) => {
    const user = auth.currentUser;
    if (!user) return;

    setUnregisteringDrops(prev => new Set(prev).add(drop.id));

    try {
      await runTransaction(db, async (transaction) => {
        const dropRef = doc(db, 'drops', drop.id);
        const dropDoc = await transaction.get(dropRef);

        if (!dropDoc.exists()) {
          throw new Error('Drop not found');
        }

        const currentDrop = dropDoc.data() as Drop;
        const currentParticipants = currentDrop.participants || [];
        
        if (!currentParticipants.includes(user.uid)) {
          throw new Error('Not registered for this drop');
        }

        transaction.update(dropRef, {
          participants: currentParticipants.filter(id => id !== user.uid)
        });
      });

      toast({
        title: "Successfully unregistered",
        description: "You've been removed from the drop",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onDropUnregister?.(drop.id);
    } catch (error) {
      toast({
        title: "Error unregistering",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUnregisteringDrops(prev => {
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

  if (drops.length === 0) {
    return null;
  }

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
          <FaCalendarAlt style={{ marginRight: '10px' }} /> Registered Drops
        </Heading>

        {drops.map((drop) => (
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
                  {drop.participants?.length || 0} / {drop.maxParticipants || '∞'} joined
                </Text>
                <Button
                  colorScheme="red"
                  size="sm"
                  leftIcon={<Icon as={FaTrash} />}
                  onClick={() => unregisterFromDrop(drop)}
                  isLoading={unregisteringDrops.has(drop.id)}
                  loadingText="Unregistering..."
                >
                  Unregister
                </Button>
              </HStack>
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default RegisteredDrops;
