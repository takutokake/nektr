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
  Box,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/userService';
import { UserProfile } from '../types';

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

const INTERESTS = [
  'Technology', 'Arts', 'Sports', 'Music', 'Travel', 
  'Food', 'Photography', 'Gaming', 'Fitness', 'Movies',
  'Startups', 'Business', 'Politics', 'Health', 'Science',
  'Fashion', 'Dance', 'Cooking', 'Culinary', 'Gardening'
];

const CUISINES = [
  'Italian', 'Japanese', 'Mexican', 'Chinese', 'Indian', 
  'Thai', 'Mediterranean', 'American', 'Korean', 'French',
  'Spanish', 'Vietnamese', 'Greek', 'Turkish', 'Argentinian',
  'Irish', 'Greek', 'Polish', 'Czech', 'Russian'
];

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

const MEETING_PREFERENCES = [
  { value: 'coffee', label: 'Coffee Shop' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'outdoor', label: 'Outdoor Space' }
];

const ProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialData?: UserProfile;
}> = ({ isOpen, onClose, initialData }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    displayName: initialData?.displayName || user?.displayName || '',
    email: initialData?.email || user?.email || '',
    interests: initialData?.interests || [],
    cuisinePreferences: initialData?.cuisinePreferences || [],
    location: initialData?.location || '',
    priceRange: initialData?.priceRange || '',
    meetingPreference: initialData?.meetingPreference || '',
    photoURL: initialData?.photoURL || user?.photoURL || ''
  });

  useEffect(() => {
    if (initialData) {
      setProfileData({
        displayName: initialData.displayName || user?.displayName || '',
        email: initialData.email || user?.email || '',
        interests: initialData.interests || [],
        cuisinePreferences: initialData.cuisinePreferences || [],
        location: initialData.location || '',
        priceRange: initialData.priceRange || '',
        meetingPreference: initialData.meetingPreference || '',
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
              <FormLabel fontWeight="bold" fontSize="lg">Display Name</FormLabel>
              <Input 
                name="displayName"
                value={profileData.displayName}
                onChange={handleInputChange}
                placeholder="Enter your display name"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="bold" fontSize="lg">Location</FormLabel>
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
              <FormLabel fontWeight="bold" fontSize="lg">Price Range Preference</FormLabel>
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
              <FormLabel fontWeight="bold" fontSize="lg">Meeting Preference</FormLabel>
              <Select 
                name="meetingPreference"
                value={profileData.meetingPreference}
                onChange={handleInputChange}
                placeholder="Select your preferred meeting style"
              >
                {MEETING_PREFERENCES.map(pref => (
                  <option key={pref.value} value={pref.value}>
                    {pref.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="bold" fontSize="lg">Interests</FormLabel>
              <Wrap spacing={2}>
                {INTERESTS.map(interest => (
                  <WrapItem key={interest}>
                    <Tag
                      size="lg"
                      bg={profileData.interests?.includes(interest) ? '#FDAA25' : '#FFF5E6'}
                      color={profileData.interests?.includes(interest) ? 'white' : '#FDAA25'}
                      borderColor={profileData.interests?.includes(interest) ? '#FDAA25' : 'transparent'}
                      borderWidth="1px"
                      onClick={() => handleInterestToggle(interest)}
                      cursor="pointer"
                      fontFamily="Poppins"
                      fontWeight={600}
                    >
                      <TagLabel>{interest}</TagLabel>
                      {profileData.interests?.includes(interest) && (
                        <TagCloseButton onClick={(e) => {
                          e.stopPropagation();
                          handleInterestToggle(interest);
                        }} />
                      )}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="bold" fontSize="lg">Cuisine Preferences</FormLabel>
              <Wrap spacing={2}>
                {CUISINES.map(cuisine => (
                  <WrapItem key={cuisine}>
                    <Tag
                      size="lg"
                      bg={profileData.cuisinePreferences?.includes(cuisine) ? '#FDAA25' : '#FFF5E6'}
                      color={profileData.cuisinePreferences?.includes(cuisine) ? 'white' : '#FDAA25'}
                      borderColor={profileData.cuisinePreferences?.includes(cuisine) ? '#FDAA25' : 'transparent'}
                      borderWidth="1px"
                      onClick={() => handleCuisineToggle(cuisine)}
                      cursor="pointer"
                      fontFamily="Poppins"
                      fontWeight={600}
                    >
                      <TagLabel>{cuisine}</TagLabel>
                      {profileData.cuisinePreferences?.includes(cuisine) && (
                        <TagCloseButton onClick={(e) => {
                          e.stopPropagation();
                          handleCuisineToggle(cuisine);
                        }} />
                      )}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
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
