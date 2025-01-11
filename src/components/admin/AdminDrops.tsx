import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  Select,
  Checkbox,
  useToast,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Spinner,
  Stack,
  Heading,
  Card,
  CardBody
} from '@chakra-ui/react';
import { Timestamp } from 'firebase/firestore';
import { Drop } from '../../types';
import { dropsService } from '../../services/dropsService';

interface AdminDropsProps {
  onDropCreated?: (drop: Drop) => void;
}

const AdminDrops: React.FC<AdminDropsProps> = ({ onDropCreated }) => {
  const toast = useToast();
  const [upcomingDrops, setUpcomingDrops] = useState<Drop[]>([]);
  const [isLoadingDrops, setIsLoadingDrops] = useState(true);
  const [dropData, setDropData] = useState({
    title: '',
    description: '',
    dropDate: '',
    dropTime: '',
    registrationDate: '',
    registrationTime: '',
    maxParticipants: 10,
    location: '',
    priceRange: '$',
    status: 'upcoming' as const,
    theme: 'General',
    isSpecialEvent: false
  });

  useEffect(() => {
    fetchUpcomingDrops();
  }, []);

  const fetchUpcomingDrops = async () => {
    try {
      setIsLoadingDrops(true);
      const drops = await dropsService.getUpcomingDropsForAdmin(5); // Only fetch 5 most recent drops
      setUpcomingDrops(drops);
    } catch (error) {
      console.error('Error fetching drops:', error);
      toast({
        title: 'Error',
        description: 'Failed to load upcoming drops',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDrops(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startTimestamp = Timestamp.fromDate(new Date(`${dropData.dropDate}T${dropData.dropTime}`));
      const registrationTimestamp = Timestamp.fromDate(new Date(`${dropData.registrationDate}T${dropData.registrationTime}`));

      if (registrationTimestamp.toMillis() >= startTimestamp.toMillis()) {
        throw new Error('Registration deadline must be before the drop time');
      }

      const newDrop = {
        title: dropData.title,
        description: dropData.description,
        startTime: startTimestamp,
        registrationDeadline: registrationTimestamp,
        maxParticipants: dropData.maxParticipants,
        location: dropData.location,
        priceRange: dropData.priceRange,
        status: dropData.status,
        theme: dropData.theme,
        isSpecialEvent: dropData.isSpecialEvent,
        participants: [],
        registeredUsers: [],
        currentParticipants: 0
      };

      const createdDrop = await dropsService.createDrop(newDrop);
      
      if (onDropCreated) {
        onDropCreated(createdDrop);
      }
      
      toast({
        title: "Drop Created",
        description: "Your new drop has been successfully created.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setDropData({
        title: '',
        description: '',
        dropDate: '',
        dropTime: '',
        registrationDate: '',
        registrationTime: '',
        maxParticipants: 10,
        location: '',
        priceRange: '$',
        status: 'upcoming',
        theme: 'General',
        isSpecialEvent: false
      });

      // Refresh the drops list
      fetchUpcomingDrops();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create drop.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDropData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (value: string) => {
    setDropData(prev => ({
      ...prev,
      maxParticipants: parseInt(value) || 10
    }));
  };

  return (
    <Stack spacing={8} p={6}>
      {/* Upcoming Drops Section */}
      <Box>
        <Heading size="md" mb={4}>Recent Upcoming Drops</Heading>
        {isLoadingDrops ? (
          <Box textAlign="center" py={4}>
            <Spinner />
          </Box>
        ) : (
          <Stack spacing={4}>
            {upcomingDrops.map(drop => (
              <Card key={drop.id} variant="outline">
                <CardBody>
                  <Stack spacing={2}>
                    <Heading size="sm">{drop.title}</Heading>
                    <Text color="gray.600">
                      Date: {drop.startTime.toDate().toLocaleDateString()}
                    </Text>
                    <Text>Location: {drop.location}</Text>
                    <Text>
                      Participants: {drop.currentParticipants}/{drop.maxParticipants}
                    </Text>
                    <Button
                      colorScheme="blue"
                      size="sm"
                      onClick={() => {
                        // Handle generate matches
                      }}
                    >
                      Generate Matches
                    </Button>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Create Drop Form */}
      <Box borderWidth={1} borderRadius="lg" p={6}>
        <Heading size="md" mb={4}>Create New Drop</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Drop Title</FormLabel>
              <Input 
                name="title"
                value={dropData.title}
                onChange={handleInputChange}
                placeholder="Enter drop title"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Input 
                name="description"
                value={dropData.description}
                onChange={handleInputChange}
                placeholder="Describe the drop"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Drop Date & Time</FormLabel>
              <Text fontSize="sm" color="gray.600" mb={2}>
                When matches will be made and users will meet
              </Text>
              <HStack>
                <Input
                  name="dropDate"
                  type="date"
                  value={dropData.dropDate}
                  onChange={handleInputChange}
                />
                <Input
                  name="dropTime"
                  type="time"
                  value={dropData.dropTime}
                  onChange={handleInputChange}
                />
              </HStack>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Registration Deadline</FormLabel>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Last time users can sign up for this drop
              </Text>
              <HStack>
                <Input
                  name="registrationDate"
                  type="date"
                  value={dropData.registrationDate}
                  onChange={handleInputChange}
                />
                <Input
                  name="registrationTime"
                  type="time"
                  value={dropData.registrationTime}
                  onChange={handleInputChange}
                />
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>Location</FormLabel>
              <Input 
                name="location"
                value={dropData.location}
                onChange={handleInputChange}
                placeholder="Enter location"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Max Participants</FormLabel>
              <NumberInput
                min={2}
                max={100}
                value={dropData.maxParticipants}
                onChange={handleNumberChange}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Theme</FormLabel>
              <Select 
                name="theme"
                value={dropData.theme}
                onChange={handleInputChange}
              >
                <option value="General">General</option>
                <option value="Tech">Tech</option>
                <option value="Food">Food</option>
                <option value="Sports">Sports</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Price Range</FormLabel>
              <Select 
                name="priceRange"
                value={dropData.priceRange}
                onChange={handleInputChange}
              >
                <option value="$">$</option>
                <option value="$$">$$</option>
                <option value="$$$">$$$</option>
              </Select>
            </FormControl>

            <FormControl>
              <Checkbox 
                isChecked={dropData.isSpecialEvent}
                onChange={(e) => setDropData(prev => ({
                  ...prev, 
                  isSpecialEvent: e.target.checked
                }))}
              >
                Special Event
              </Checkbox>
            </FormControl>

            <Button 
              colorScheme="blue" 
              type="submit" 
              width="full"
            >
              Create Drop
            </Button>
          </VStack>
        </form>
      </Box>
    </Stack>
  );
};

export default AdminDrops;
