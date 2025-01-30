import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Checkbox, 
  Collapse,
  Container,
  Flex, 
  FormControl, 
  FormLabel, 
  Heading, 
  IconButton, 
  Input, 
  InputGroup, 
  InputLeftAddon, 
  Select, 
  Tag, 
  TagCloseButton, 
  TagLabel, 
  Text, 
  useToast,
  VStack, 
  Wrap,
  ChakraProvider,
  HStack,
  WrapItem,
  FormHelperText
} from '@chakra-ui/react';
import { ArrowBackIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rawPhoneNumber, setRawPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const rawInput = e.target.value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedInput = rawInput.slice(0, 10);
    
    // Set raw phone number
    setRawPhoneNumber(limitedInput);
    
    // Format phone number
    let formattedPhone = '';
    if (limitedInput.length > 0) {
      formattedPhone += '(';
      formattedPhone += limitedInput.slice(0, 3);
      if (limitedInput.length > 3) {
        formattedPhone += ') ';
        formattedPhone += limitedInput.slice(3, 6);
        if (limitedInput.length > 6) {
          formattedPhone += '-';
          formattedPhone += limitedInput.slice(6);
        }
      }
    }
    
    // Set phone number and validate
    setPhoneNumber(formattedPhone);
    
    // Validate phone number
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (formattedPhone.length === 14 && phoneRegex.test(formattedPhone)) {
      setPhoneError('');
    } else if (formattedPhone.length > 0) {
      setPhoneError('Please enter a valid 10-digit phone number');
    } else {
      setPhoneError('Phone number is required');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all basic information fields
    if (!displayName || displayName.trim() === '') {
      toast({
        title: 'Missing Information',
        description: 'Please enter your display name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!location) {
      toast({
        title: 'Missing Information',
        description: 'Please select your location',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!priceRange) {
      toast({
        title: 'Missing Information',
        description: 'Please select your price range',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!meetingPreference) {
      toast({
        title: 'Missing Information',
        description: 'Please select your meeting preference',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate interests
    if (!interests || interests.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select at least one interest',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate cuisine preferences
    if (!cuisinePreferences || cuisinePreferences.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select at least one cuisine preference',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate phone number
    if (!rawPhoneNumber || rawPhoneNumber.trim() === '') {
      toast({
        title: 'Missing Information',
        description: 'Phone number is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid US phone number in the format +1 (555) 123-4567',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate SMS consent
    if (!smsConsent) {
      toast({
        title: 'SMS Consent Required',
        description: 'You must consent to receive SMS notifications to join',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const profileData = {
        uid: (user as User).uid || (user as UserProfile).uid,
        email: (user as User).email || (user as UserProfile).email || '',
        displayName,
        location,
        priceRange,
        meetingPreference,
        interests,
        cuisinePreferences,
        socialLinks: [],
        badges: [],
        matches: [],
        id: (user as User).uid || (user as UserProfile).uid,
        phoneNumber: rawPhoneNumber ? `+1${rawPhoneNumber}` : undefined,
        phoneNumberVerified: !!rawPhoneNumber,
        smsNotificationsEnabled: smsConsent
      };

      console.log('Attempting to save profile:', profileData);

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

  const toggleSection = (sectionName: string) => {
    setOpenSection(prev => prev === sectionName ? null : sectionName);
  };

  const CollapsibleSection = ({ 
    title, 
    children, 
    sectionName 
  }: { 
    title: string, 
    children: React.ReactNode, 
    sectionName: string 
  }) => (
    <Box>
      <Button 
        onClick={() => toggleSection(sectionName)} 
        variant="ghost" 
        width="full" 
        justifyContent="space-between"
        rightIcon={openSection === sectionName ? <ChevronUpIcon /> : <ChevronDownIcon />}
      >
        {title}
      </Button>
      <Collapse in={openSection === sectionName}>
        {children}
      </Collapse>
    </Box>
  );

  useEffect(() => {
    console.log('ProfileCreation Component Rendered');
    console.log('Display Name:', displayName);
    console.log('Location:', location);
    console.log('Price Range:', priceRange);
    console.log('Meeting Preference:', meetingPreference);
  }, [displayName, location, priceRange, meetingPreference]);

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
              <VStack spacing={4} align="stretch" p={4}>
                <CollapsibleSection title="Basic Information" sectionName="basic">
                  <FormControl isRequired>
                    <FormLabel>Display Name</FormLabel>
                    <Input 
                      value={displayName}
                      onChange={(e) => {
                        // Limit to 30 characters
                        const value = e.target.value.slice(0, 30);
                        // Allow only letters, spaces, and hyphens
                        const sanitizedValue = value.replace(/[^a-zA-Z\s-]/g, '');
                        setDisplayName(sanitizedValue);
                      }}
                      placeholder="Your name"
                      variant="filled"
                      autoFocus
                      onKeyDown={(e) => {
                        // Prevent numbers and special characters
                        if (/[0-9!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    <FormHelperText>
                      {displayName.length}/30 characters (letters, spaces, and hyphens only)
                    </FormHelperText>
                  </FormControl>
                  
                  <FormControl mt={4} isRequired>
                    <FormLabel>Location</FormLabel>
                    <Select 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Select location"
                    >
                      {LOCATIONS.map(loc => (
                        <option key={loc.value} value={loc.value}>{loc.label}</option>
                      ))}
                    </Select>
                  </FormControl>
                </CollapsibleSection>

                <CollapsibleSection title="Preferences" sectionName="preferences">
                  <FormControl isRequired>
                    <FormLabel>Price Range</FormLabel>
                    <Select 
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      placeholder="Select price range"
                    >
                      {PRICE_RANGES.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl mt={4} isRequired>
                    <FormLabel>Meeting Preference</FormLabel>
                    <Select 
                      value={meetingPreference}
                      onChange={(e) => setMeetingPreference(e.target.value)}
                      placeholder="Select meeting preference"
                    >
                      {MEETING_PREFERENCES.map(pref => (
                        <option key={pref.value} value={pref.value}>{pref.label}</option>
                      ))}
                    </Select>
                  </FormControl>
                </CollapsibleSection>

                <CollapsibleSection title="Interests" sectionName="interests">
                  <FormControl isRequired>
                    <FormLabel>Select Your Interests</FormLabel>
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
                    {(!interests || interests.length === 0) && (
                      <FormHelperText color="red.500">
                        Please select at least one interest
                      </FormHelperText>
                    )}
                  </FormControl>
                </CollapsibleSection>

                <CollapsibleSection title="Cuisine Preferences" sectionName="cuisines">
                  <FormControl isRequired>
                    <FormLabel>Select Your Cuisine Preferences</FormLabel>
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
                    {(!cuisinePreferences || cuisinePreferences.length === 0) && (
                      <FormHelperText color="red.500">
                        Please select at least one cuisine preference
                      </FormHelperText>
                    )}
                  </FormControl>
                </CollapsibleSection>

                <CollapsibleSection title="Contact Information" sectionName="contact">
                  <FormControl isRequired>
                    <FormLabel>Phone Number</FormLabel>
                    <InputGroup>
                      <InputLeftAddon children='+1' />
                      <Input 
                        type="tel" 
                        placeholder="(555) 123-4567"
                        value={rawPhoneNumber}
                        onChange={handlePhoneChange}
                        variant="filled"
                        isRequired
                        autoFocus
                        onKeyDown={(e) => {
                          // Prevent non-numeric input
                          if (!/^\d$/.test(e.key) && 
                              e.key !== 'Backspace' && 
                              e.key !== 'Delete' && 
                              e.key !== 'ArrowLeft' && 
                              e.key !== 'ArrowRight') {
                            e.preventDefault();
                          }
                        }}
                      />
                    </InputGroup>
                    {phoneError && (
                      <Text color="red.500" fontSize="sm" mt={2}>
                        {phoneError}
                      </Text>
                    )}
                    <FormHelperText>
                      We need your phone number to send match notifications
                    </FormHelperText>
                  </FormControl>

                  <FormControl isRequired mt={4}>
                    <Checkbox 
                      isChecked={smsConsent}
                      onChange={(e) => setSmsConsent(e.target.checked)}
                      colorScheme="green"
                      size="lg"
                    >
                      I consent to receive SMS notifications about potential matches
                    </Checkbox>
                    <FormHelperText color="gray.500">
                      By checking this, you agree to receive text messages about your matches
                    </FormHelperText>
                  </FormControl>
                </CollapsibleSection>

                <Button 
                  colorScheme="brand" 
                  onClick={handleSubmit}
                  type="submit" 
                  width="full" 
                  mt={4}
                  bg="blue.500"
                  color="white"
                  _hover={{
                    bg: "brand.600"
                  }}
                >
                  Complete Profile
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
