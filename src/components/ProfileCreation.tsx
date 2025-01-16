import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Flex, 
  FormControl, 
  FormLabel, 
  Heading, 
  Input, 
  Select,
  VStack,
  HStack,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  IconButton,
  ChakraProvider
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';

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
  'Irish', 'Brazilian', 'Polish', 'Czech', 'Russian'
];

const LOCATIONS = [
  { value: 'USC', label: 'USC Area', description: 'University Park & surrounding neighborhoods' },
  { value: 'UCLA', label: 'UCLA Area', description: 'Westwood & surrounding neighborhoods' }
];

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

const MEETING_PREFERENCES = [
  { value: 'coffee', label: 'Coffee Shop' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'outdoor', label: 'Outdoor Space' }
];

interface ProfileCreationProps {
  user: User | UserProfile;
  onComplete?: () => void;
}

const ProfileCreation: React.FC<ProfileCreationProps> = ({ user, onComplete }) => {
  const [displayName, setDisplayName] = useState(
    (user as UserProfile).displayName || 
    (user as User).displayName || 
    ''
  );
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const [meetingPreference, setMeetingPreference] = useState('');
  const toast = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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

    // Basic validation
    if (!displayName || !location || !priceRange || !meetingPreference) {
      toast({
        title: 'Incomplete Profile',
        description: 'Please fill out all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      // Prepare user profile data
      const profileData = {
        uid: (user as User).uid || (user as UserProfile).uid,
        email: (user as User).email || (user as UserProfile).email || '',
        displayName,
        name: displayName,
        photoURL: (user as User).photoURL || (user as UserProfile).photoURL || '',
        interests, 
        cuisinePreferences, 
        location,
        meetingPreference,
        priceRange,
        cuisines: [],
        bio: '',
        avatar: '',
        profilePicture: '',
        isAdmin: false,
        tempDisableAdmin: false,
        registeredDrops: [],
        profileComplete: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        streak: 0,
        totalMatches: 0,
        progress: 0,
        connections: 0,
        completedChallenges: [],
        badges: [],
        matches: [],
        id: (user as User).uid || (user as UserProfile).uid
      };

      // Save profile to Firestore
      await setDoc(doc(db, 'users', (user as User).uid || (user as UserProfile).uid), profileData);

      toast({
        title: 'Profile Created',
        description: 'Your profile has been successfully created!',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // Call onComplete if provided
      onComplete?.();
    } catch (error) {
      console.error('Profile creation error:', error);
      toast({
        title: 'Error',
        description: 'There was an error creating your profile',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  return (
    <ChakraProvider>
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
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <Heading 
                  textAlign="center" 
                  color="brand.500" 
                  mb={4}
                >
                  Create Your Profile
                </Heading>

                <FormControl isRequired>
                  <FormLabel fontWeight="bold" fontSize="lg">Display Name</FormLabel>
                  <Input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="bold" fontSize="lg">Location</FormLabel>
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
                  <FormLabel fontWeight="bold" fontSize="lg">Price Range</FormLabel>
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

                <FormControl isRequired>
                  <FormLabel fontWeight="bold" fontSize="lg">Meeting Preference</FormLabel>
                  <Select 
                    placeholder="Select your preferred meeting style"
                    value={meetingPreference}
                    onChange={(e) => setMeetingPreference(e.target.value)}
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
                          bg={interests.includes(interest) ? '#FDAA25' : '#FFF5E6'}
                          color={interests.includes(interest) ? 'white' : '#FDAA25'}
                          borderColor={interests.includes(interest) ? '#FDAA25' : 'transparent'}
                          borderWidth="1px"
                          onClick={() => handleInterestToggle(interest)}
                          cursor="pointer"
                          fontFamily="Poppins"
                          fontWeight={600}
                        >
                          <TagLabel>{interest}</TagLabel>
                          {interests.includes(interest) && (
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
                          bg={cuisinePreferences.includes(cuisine) ? '#FDAA25' : '#FFF5E6'}
                          color={cuisinePreferences.includes(cuisine) ? 'white' : '#FDAA25'}
                          borderColor={cuisinePreferences.includes(cuisine) ? '#FDAA25' : 'transparent'}
                          borderWidth="1px"
                          onClick={() => handleCuisineToggle(cuisine)}
                          cursor="pointer"
                          fontFamily="Poppins"
                          fontWeight={600}
                        >
                          <TagLabel>{cuisine}</TagLabel>
                          {cuisinePreferences.includes(cuisine) && (
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
          </Box>
        </Container>
      </Flex>
    </ChakraProvider>
  );
};

export default ProfileCreation;
