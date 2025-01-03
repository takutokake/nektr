import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Heading,
  NumberInput,
  NumberInputField,
  Textarea,
  Select,
  HStack,
} from '@chakra-ui/react';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Drop } from '../../types';

export default function AdminDrops() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [location, setLocation] = useState('USC');
  const [priceRange, setPriceRange] = useState('$$');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [registrationDeadlineDate, setRegistrationDeadlineDate] = useState('');
  const [registrationDeadlineTime, setRegistrationDeadlineTime] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const deadlineDateTime = new Date(`${registrationDeadlineDate}T${registrationDeadlineTime}`);

      if (deadlineDateTime >= startDateTime) {
        toast({
          title: 'Invalid dates',
          description: 'Registration deadline must be before the drop start time',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const dropData: Omit<Drop, 'id'> = {
        title,
        description,
        startTime: Timestamp.fromDate(startDateTime),
        registrationDeadline: Timestamp.fromDate(deadlineDateTime),
        maxParticipants,
        currentParticipants: 0,
        location,
        priceRange,
        status: 'upcoming',
        registeredUsers: [],
      };

      const dropRef = doc(collection(db, 'drops'));
      await setDoc(dropRef, dropData);

      toast({
        title: 'Drop created!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setMaxParticipants(20);
      setLocation('USC');
      setPriceRange('$$');
      setStartDate('');
      setStartTime('');
      setRegistrationDeadlineDate('');
      setRegistrationDeadlineTime('');
    } catch (error) {
      console.error('Error creating drop:', error);
      toast({
        title: 'Error creating drop',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
      <VStack spacing={6} align="stretch" as="form" onSubmit={createDrop}>
        <Heading size="lg">Create New Drop</Heading>

        <FormControl isRequired>
          <FormLabel>Title</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Drop title"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Drop description"
          />
        </FormControl>

        <HStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Location</FormLabel>
            <Select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="USC">USC Area</option>
              <option value="UCLA">UCLA Area</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Price Range</FormLabel>
            <Select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
              <option value="$">$ (Under $15)</option>
              <option value="$$">$$ ($15-$30)</option>
              <option value="$$$">$$$ ($31-$60)</option>
              <option value="$$$$">$$$$ ($61+)</option>
            </Select>
          </FormControl>
        </HStack>

        <FormControl isRequired>
          <FormLabel>Maximum Participants</FormLabel>
          <NumberInput
            min={2}
            max={100}
            value={maxParticipants}
            onChange={(_, value) => setMaxParticipants(value)}
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>

        <HStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Start Date</FormLabel>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Start Time</FormLabel>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Registration Deadline Date</FormLabel>
            <Input
              type="date"
              value={registrationDeadlineDate}
              onChange={(e) => setRegistrationDeadlineDate(e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Registration Deadline Time</FormLabel>
            <Input
              type="time"
              value={registrationDeadlineTime}
              onChange={(e) => setRegistrationDeadlineTime(e.target.value)}
            />
          </FormControl>
        </HStack>

        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          isLoading={loading}
          loadingText="Creating Drop..."
        >
          Create Drop
        </Button>
      </VStack>
    </Box>
  );
}
