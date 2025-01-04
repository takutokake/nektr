import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  useToast,
  Avatar,
  Text,
  Box
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/userService';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: UserProfile;
}

const INTERESTS = [
  'Technology', 'Food', 'Sports', 'Music', 'Travel', 
  'Art', 'Gaming', 'Fitness', 'Movies', 'Reading'
];

const CUISINES = [
  'Italian', 'Japanese', 'Mexican', 'Chinese', 'Indian', 
  'Thai', 'Mediterranean', 'American', 'Korean', 'French'
];

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

interface LocationOption {
  value: string;
  label: string;
  description: string;
}

const LOCATIONS: LocationOption[] = [
  { 
    value: 'USC', 
    label: 'USC Area', 
    description: 'University Park & surrounding neighborhoods' 
  },
  { 
    value: 'UCLA', 
    label: 'UCLA Area', 
    description: 'Westwood & surrounding neighborhoods' 
  },
];

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  initialData 
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    displayName: initialData?.displayName || user?.displayName || '',
    email: initialData?.email || user?.email || '',
    interests: initialData?.interests || [],
    cuisinePreferences: initialData?.cuisinePreferences || [],
    location: initialData?.location || '',
    priceRange: initialData?.priceRange || '',
    photoURL: initialData?.photoURL || user?.photoURL || ''
  });

  useEffect(() => {
    // Update profileData if initialData changes
    if (initialData) {
      setProfileData({
        displayName: initialData.displayName || user?.displayName || '',
        email: initialData.email || user?.email || '',
        interests: initialData.interests || [],
        cuisinePreferences: initialData.cuisinePreferences || [],
        location: initialData.location || '',
        priceRange: initialData.priceRange || '',
        photoURL: initialData.photoURL || user?.photoURL || ''
      });
    }
  }, [initialData, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setProfileData(prev => {
      const currentInterests = prev.interests || [];
      const newInterests = currentInterests.includes(interest)
        ? currentInterests.filter(i => i !== interest)
        : [...currentInterests, interest];
      
      return {
        ...prev,
        interests: newInterests
      };
    });
  };

  const handleCuisineToggle = (cuisine: string) => {
    setProfileData(prev => {
      const currentCuisines = prev.cuisinePreferences || [];
      const newCuisines = currentCuisines.includes(cuisine)
        ? currentCuisines.filter(c => c !== cuisine)
        : [...currentCuisines, cuisine];
      
      return {
        ...prev,
        cuisinePreferences: newCuisines
      };
    });
  };

  const handleSaveProfile = async () => {
    try {
      if (!user) {
        throw new Error('No user found');
      }

      await updateUserProfile(user.uid, profileData);

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'There was an error updating your profile.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <HStack spacing={6} align="center">
              <Avatar 
                size="2xl" 
                name={profileData.displayName} 
                src={profileData.photoURL} 
              />
              <VStack align="start" spacing={2}>
                <Text fontSize="xl" fontWeight="bold">
                  {profileData.displayName}
                </Text>
                <Text color="gray.500">{profileData.email}</Text>
              </VStack>
            </HStack>

            <FormControl>
              <FormLabel>Display Name</FormLabel>
              <Input 
                name="displayName"
                value={profileData.displayName}
                onChange={handleInputChange}
                placeholder="Enter your display name"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Location</FormLabel>
              <Select 
                name="location"
                value={profileData.location}
                onChange={handleInputChange}
                placeholder="Select your area"
              >
                {LOCATIONS.map(loc => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </Select>
              {profileData.location && (
                <Box mt={2} fontSize="sm" color="gray.500">
                  {LOCATIONS.find(l => l.value === profileData.location)?.description}
                </Box>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Price Range Preference</FormLabel>
              <Select 
                name="priceRange"
                value={profileData.priceRange}
                onChange={handleInputChange}
                placeholder="Select price range"
              >
                {PRICE_RANGES.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Interests</FormLabel>
              <HStack flexWrap="wrap">
                {INTERESTS.map(interest => (
                  <Checkbox
                    key={interest}
                    isChecked={profileData.interests?.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                  >
                    {interest}
                  </Checkbox>
                ))}
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>Cuisine Preferences</FormLabel>
              <HStack flexWrap="wrap">
                {CUISINES.map(cuisine => (
                  <Checkbox
                    key={cuisine}
                    isChecked={profileData.cuisinePreferences?.includes(cuisine)}
                    onChange={() => handleCuisineToggle(cuisine)}
                  >
                    {cuisine}
                  </Checkbox>
                ))}
              </HStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            onClick={handleSaveProfile}
          >
            Save Changes
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProfileModal;
