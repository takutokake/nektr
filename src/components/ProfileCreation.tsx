import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Heading,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  Container,
  RadioGroup,
  Radio,
  Stack,
  Divider,
} from '@chakra-ui/react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

interface ProfileCreationProps {
  user: any;
  onComplete: () => void;
}

const INTERESTS = [
  'Coffee',
  'Tea',
  'Food',
  'Technology',
  'Sports',
  'Music',
  'Art',
  'Reading',
  'Travel',
  'Photography',
  'Gaming',
  'Fitness',
];

const MEETING_PREFERENCES = [
  'Coffee Shop',
  'Restaurant',
  'Park',
  'Office',
  'Library',
];

const CUISINE_PREFERENCES = [
  'Italian',
  'Japanese',
  'Chinese',
  'Mexican',
  'Indian',
  'American',
  'Thai',
  'Mediterranean',
];

const PRICE_RANGES = [
  { value: '$', label: '$ (Under $15)', description: 'Budget-friendly options' },
  { value: '$$', label: '$$ ($15-$30)', description: 'Moderate pricing' },
  { value: '$$$', label: '$$$ ($31-$60)', description: 'Upscale dining' },
  { value: '$$$$', label: '$$$$ ($61+)', description: 'Fine dining' },
];

const LOCATIONS = [
  { value: 'USC', label: 'USC Area', description: 'University Park & surrounding neighborhoods' },
  { value: 'UCLA', label: 'UCLA Area', description: 'Westwood & surrounding neighborhoods' },
];

export default function ProfileCreation({ user, onComplete }: ProfileCreationProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [interests, setInterests] = useState<string[]>([]);
  const [meetingPreferences, setMeetingPreferences] = useState<string[]>([]);
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!displayName) {
      toast({
        title: 'Display name required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (interests.length < 2) {
      toast({
        title: 'Please select at least 2 interests',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (meetingPreferences.length < 2) {
      toast({
        title: 'Please select at least 2 meeting preferences',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!location) {
      toast({
        title: 'Please select your location',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!priceRange) {
      toast({
        title: 'Please select your price range preference',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const now = Timestamp.now();
      const profileData = {
        uid: user.uid,
        email: user.email,
        displayName,
        interests,
        meetingPreferences,
        cuisinePreferences,
        location,
        priceRange,
        points: 0,
        streak: 0,
        badges: [],
        completedChallenges: [],
        activeChallenges: [],
        matches: [],
        createdAt: now,
        lastActive: now,
      };

      console.log('Attempting to save profile for user:', user.uid);
      await setDoc(doc(db, 'users', user.uid), profileData);
      
      toast({
        title: 'Profile created!',
        description: "You're all set to start connecting!",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Error creating profile:', error);
      let errorMessage = 'Please try again later.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please make sure you are properly signed in.';
        // Try to refresh the auth token
        try {
          const token = await user.getIdToken(true);
          console.log('Refreshed auth token:', token ? 'success' : 'failed');
        } catch (tokenError) {
          console.error('Error refreshing token:', tokenError);
        }
      }
      
      toast({
        title: 'Error creating profile',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={12}>
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" pb={6}>
            <Heading size="xl">Create Your Profile</Heading>
            <Text mt={2} color="gray.600">Tell us about yourself to find better matches</Text>
          </Box>

          <FormControl isRequired>
            <FormLabel fontSize="lg">Display Name</FormLabel>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
              size="lg"
            />
          </FormControl>

          <Divider />

          <Box>
            <FormLabel fontSize="lg">Location</FormLabel>
            <RadioGroup onChange={setLocation} value={location}>
              <Stack spacing={4}>
                {LOCATIONS.map(({ value, label, description }) => (
                  <Box
                    key={value}
                    p={4}
                    borderWidth={1}
                    borderRadius="md"
                    borderColor={location === value ? 'blue.500' : 'gray.200'}
                  >
                    <Radio value={value}>
                      <Text fontWeight="bold">{label}</Text>
                      <Text fontSize="sm" color="gray.600">{description}</Text>
                    </Radio>
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          </Box>

          <Divider />

          <Box>
            <FormLabel fontSize="lg">Price Range Preference</FormLabel>
            <RadioGroup onChange={setPriceRange} value={priceRange}>
              <Stack spacing={4}>
                {PRICE_RANGES.map(({ value, label, description }) => (
                  <Box
                    key={value}
                    p={4}
                    borderWidth={1}
                    borderRadius="md"
                    borderColor={priceRange === value ? 'blue.500' : 'gray.200'}
                  >
                    <Radio value={value}>
                      <Text fontWeight="bold">{label}</Text>
                      <Text fontSize="sm" color="gray.600">{description}</Text>
                    </Radio>
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          </Box>

          <Divider />

          <Box>
            <FormLabel fontSize="lg">Interests (Select at least 2)</FormLabel>
            <Text mb={4} fontSize="sm" color="gray.600">
              Choose the activities you enjoy most
            </Text>
            <SimpleGrid columns={[2, 2, 3]} spacing={6}>
              <CheckboxGroup
                colorScheme="blue"
                value={interests}
                onChange={(values) => setInterests(values as string[])}
              >
                {INTERESTS.map((interest) => (
                  <Checkbox
                    key={interest}
                    value={interest}
                    size="lg"
                    borderColor="gray.300"
                  >
                    {interest}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box>
            <FormLabel fontSize="lg">Meeting Preferences (Select at least 2)</FormLabel>
            <Text mb={4} fontSize="sm" color="gray.600">
              Where would you prefer to meet?
            </Text>
            <SimpleGrid columns={[2, 2, 3]} spacing={6}>
              <CheckboxGroup
                colorScheme="blue"
                value={meetingPreferences}
                onChange={(values) => setMeetingPreferences(values as string[])}
              >
                {MEETING_PREFERENCES.map((pref) => (
                  <Checkbox
                    key={pref}
                    value={pref}
                    size="lg"
                    borderColor="gray.300"
                  >
                    {pref}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box>
            <FormLabel fontSize="lg">Cuisine Preferences</FormLabel>
            <Text mb={4} fontSize="sm" color="gray.600">
              What types of food do you enjoy?
            </Text>
            <SimpleGrid columns={[2, 2, 3]} spacing={6}>
              <CheckboxGroup
                colorScheme="blue"
                value={cuisinePreferences}
                onChange={(values) => setCuisinePreferences(values as string[])}
              >
                {CUISINE_PREFERENCES.map((cuisine) => (
                  <Checkbox
                    key={cuisine}
                    value={cuisine}
                    size="lg"
                    borderColor="gray.300"
                  >
                    {cuisine}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            </SimpleGrid>
          </Box>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            isLoading={loading}
            loadingText="Creating Profile..."
            mt={8}
            isDisabled={
              !displayName ||
              interests.length < 2 ||
              meetingPreferences.length < 2 ||
              !location ||
              !priceRange
            }
          >
            Create Profile
          </Button>
        </VStack>
      </Box>
    </Container>
  );
}
