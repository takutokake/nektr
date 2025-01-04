import React, { useState } from 'react';
import { 
  Box, 
  VStack, 
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  Select,
  Checkbox,
  useToast
} from '@chakra-ui/react';
import { Timestamp } from 'firebase/firestore';
import { Drop, createDefaultDrop } from '../../types';

interface AdminDropsProps {
  onDropCreated?: (drop: Drop) => Promise<void>;
}

const AdminDrops: React.FC<AdminDropsProps> = ({ onDropCreated }) => {
  const toast = useToast();
  const [dropData, setDropData] = useState({
    title: '',
    description: '',
    startTime: Timestamp.now(),
    registrationDeadline: Timestamp.now(),
    maxParticipants: 10,
    currentParticipants: 0,
    location: '',
    priceRange: '$',
    status: 'upcoming' as const,
    registeredUsers: [],
    theme: 'General',
    isSpecialEvent: false,
    endTime: Timestamp.now()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDrop = createDefaultDrop({
      title: dropData.title,
      description: dropData.description,
      startTime: dropData.startTime,
      endTime: dropData.endTime,
      location: dropData.location,
      maxParticipants: dropData.maxParticipants,
      theme: dropData.theme,
      isSpecialEvent: dropData.isSpecialEvent,
      registrationDeadline: dropData.registrationDeadline,
      priceRange: dropData.priceRange,
      status: dropData.status,
    });

    try {
      if (onDropCreated) {
        await onDropCreated(newDrop);
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
        startTime: Timestamp.now(),
        registrationDeadline: Timestamp.now(),
        maxParticipants: 10,
        currentParticipants: 0,
        location: '',
        priceRange: '$',
        status: 'upcoming',
        registeredUsers: [],
        theme: 'General',
        isSpecialEvent: false,
        endTime: Timestamp.now()
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create drop.",
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
      [name]: name === 'maxParticipants' ? Number(value) : value
    }));
  };

  return (
    <Box p={6} borderWidth={1} borderRadius="lg">
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
  );
};

export default AdminDrops;
