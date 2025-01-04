import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  VStack, 
  Heading, 
  Text, 
  HStack, 
  Checkbox, 
  Select,
  useToast,
  Container,
  Flex,
  IconButton,
  extendTheme,
  ChakraProvider
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';

// Custom theme with the new color
const theme = extendTheme({
  colors: {
    brand: {
      50: '#FFF5E6',
      100: '#FFE6B8',
      200: '#FFD780',
      300: '#FDAA25',
      400: '#E69422',
      500: '#FDAA25',
      600: '#CC8A1F',
      700: '#B3701A',
      800: '#995614',
      900: '#803C0F'
    }
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600'
          }
        }
      }
    }
  }
});

interface ProfileCreationProps {
  user: User;
  onComplete?: () => void;
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

const LOCATIONS = [
  { value: 'USC', label: 'USC Area', description: 'University Park & surrounding neighborhoods' },
  { value: 'UCLA', label: 'UCLA Area', description: 'Westwood & surrounding neighborhoods' },
];

const ProfileCreation: React.FC<ProfileCreationProps> = ({ user, onComplete }) => {
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const toast = useToast();

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const handleCuisineToggle = (cuisine: string) => {
    setCuisinePreferences(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine) 
        : [...prev, cuisine]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!displayName || !location || !priceRange) {
        toast({
          title: 'Incomplete Profile',
          description: 'Please fill out display name, location, and price range',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }

      // Prepare user profile data
      const profileData = {
        uid: user.uid,
        email: user.email || '',
        displayName,
        location,
        priceRange,
        interests, // Optional
        cuisinePreferences, // Optional
        createdAt: Timestamp.now(),
        points: 0,
        streak: 0,
        badges: [],
        matches: []
      };

      // Save profile to Firestore
      await setDoc(doc(db, 'users', user.uid), profileData);

      // Show success toast
      toast({
        title: 'Profile Created',
        description: 'Your profile has been successfully created.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create profile. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Flex 
        height="100vh" 
        alignItems="center" 
        justifyContent="center" 
        bg="gray.50"
      >
        <Container maxW="md" position="relative">
          <IconButton 
            icon={<ArrowBackIcon />} 
            aria-label="Go Back" 
            position="absolute" 
            top="-50px" 
            left="0" 
            onClick={handleSignOut}
            variant="ghost"
            colorScheme="gray"
          />
          
          <Box 
            bg="white" 
            p={8} 
            borderRadius="xl" 
            boxShadow="lg"
            width="100%"
          >
            <VStack spacing={6} align="stretch">
              <Heading 
                textAlign="center" 
                color="brand.500" 
                mb={4}
              >
                Create Your Profile
              </Heading>

              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Display Name</FormLabel>
                    <Input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Location</FormLabel>
                    <Select 
                      placeholder="Select your area"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      {LOCATIONS.map(loc => (
                        <option key={loc.value} value={loc.value}>
                          {loc.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Price Range</FormLabel>
                    <Select 
                      placeholder="Select price range"
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                    >
                      {PRICE_RANGES.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Interests (Optional)</FormLabel>
                    <HStack flexWrap="wrap">
                      {INTERESTS.map(interest => (
                        <Checkbox
                          key={interest}
                          isChecked={interests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                        >
                          {interest}
                        </Checkbox>
                      ))}
                    </HStack>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Cuisine Preferences (Optional)</FormLabel>
                    <HStack flexWrap="wrap">
                      {CUISINES.map(cuisine => (
                        <Checkbox
                          key={cuisine}
                          isChecked={cuisinePreferences.includes(cuisine)}
                          onChange={() => handleCuisineToggle(cuisine)}
                        >
                          {cuisine}
                        </Checkbox>
                      ))}
                    </HStack>
                  </FormControl>

                  <Button 
                    colorScheme="brand" 
                    type="submit" 
                    width="full" 
                    mt={4}
                  >
                    Create Profile
                  </Button>
                </VStack>
              </form>
            </VStack>
          </Box>
        </Container>
      </Flex>
    </ChakraProvider>
  );
};

export default ProfileCreation;
