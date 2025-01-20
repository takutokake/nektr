import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  VStack, 
  HStack, 
  Text, 
  Badge, 
  Icon,
  Heading,
  TableContainer,
  Skeleton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Flex,
  useColorModeValue,
  FormControl,
  FormLabel,
  Switch,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image,
  Spacer
} from '@chakra-ui/react';
import { 
  collection, 
  query, 
  getDocs, 
  Timestamp,
  doc,
  getDoc,
  orderBy,
  updateDoc,
  DocumentData
} from 'firebase/firestore';
import { format } from 'date-fns';
import { 
  MatchOutcome, 
  UserProfile, 
  Drop, 
  DropMatches, 
  DropParticipants 
} from '../../types';
import { MatchRegistrationService } from '../../services/matchRegistrationService';
import { generateDropMatches, getDropMatches } from '../../services/matchingService';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import AdminDrops from './AdminDrops';
import { MatchingTest } from '../debug/MatchingTest';
import { FaRegSadTear } from 'react-icons/fa';
import { FiInbox } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const SuccessfulMatchesTable: React.FC = () => {
  const [successfulMatches, setSuccessfulMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuccessfulMatches = async () => {
      try {
        setIsLoading(true);
        const successfulMatchesRef = collection(db, 'successfulMatches');
        const q = query(successfulMatchesRef);
        
        const querySnapshot = await getDocs(q);
        const matches = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSuccessfulMatches(matches);
      } catch (error) {
        console.error('Error fetching successful matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuccessfulMatches();
  }, []);

  const tableRowBg = useColorModeValue('gray.50', 'gray.700');

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="300px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Match ID</Th>
            <Th>Drop ID</Th>
            <Th>Participants</Th>
            <Th>Compatibility</Th>
            <Th>Common Interests</Th>
            <Th>Common Cuisines</Th>
            <Th>Matched At</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {successfulMatches.map(match => (
            <Tr key={match.id} bg={tableRowBg}>
              <Td fontSize="sm">{match.id}</Td>
              <Td fontSize="sm">{match.dropId}</Td>
              <Td fontSize="sm">
                {Object.entries(match.participants || {}).map(([userId, participant]: [string, any]) => (
                  <Box key={userId}>
                    {participant?.profile?.name || userId}
                  </Box>
                ))}
              </Td>
              <Td fontSize="sm">{match.matchDetails?.compatibility?.toFixed(2)}%</Td>
              <Td fontSize="sm">{match.matchDetails?.commonInterests?.join(', ')}</Td>
              <Td fontSize="sm">{match.matchDetails?.commonCuisines?.join(', ')}</Td>
              <Td fontSize="sm">
                {match.createdAt && format(
                  (match.createdAt as Timestamp).toDate(), 
                  'MMM d, yyyy HH:mm'
                )}
              </Td>
              <Td>
                <Badge 
                  colorScheme={
                    match.status === 'active' ? 'green' : 
                    match.status === 'completed' ? 'blue' : 
                    'red'
                  }
                >
                  {match.status}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {successfulMatches.length === 0 && (
        <Flex justify="center" align="center" height="300px">
          <Text>No successful matches found</Text>
        </Flex>
      )}
    </Box>
  );
};

const MatchOutcomesTable: React.FC = () => {
  const [matchOutcomes, setMatchOutcomes] = useState<MatchOutcome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'successful' | 'unsuccessful'>('all');
  const [lastFetch, setLastFetch] = useState<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds
  const MAX_RETRIES = 3;

  const handleFilterChange = (newFilter: 'all' | 'successful' | 'unsuccessful') => {
    if (filter === newFilter) return; // Don't reload if same filter
    setFilter(newFilter);
    setLastFetch(0); // Force a new fetch when changing filters
    setIsLoading(true); // Show loading state immediately
  };

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    let retryTimeout: NodeJS.Timeout;

    const fetchMatchOutcomes = async () => {
      if (!isMounted) return;

      try {
        setError(null);
        const now = Date.now();
        
        if (now - lastFetch < CACHE_DURATION && matchOutcomes.length > 0) {
          setIsLoading(false);
          return;
        }

        const outcomes = filter === 'all' 
          ? await MatchRegistrationService.getMatchOutcomes()
          : await MatchRegistrationService.getMatchOutcomes(filter);
        
        if (!isMounted) return;

        setMatchOutcomes(outcomes);
        setLastFetch(now);
        retryCount = 0;
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error fetching match outcomes:', error);
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retry attempt ${retryCount} in ${Math.pow(2, retryCount)} seconds`);
          
          // Clear any existing timeout
          if (retryTimeout) {
            clearTimeout(retryTimeout);
          }
          
          // Set new timeout with exponential backoff
          retryTimeout = setTimeout(() => {
            if (isMounted) {
              fetchMatchOutcomes();
            }
          }, 1000 * Math.pow(2, retryCount));
        } else {
          setError(error instanceof Error ? error.message : 'An unknown error occurred');
          setMatchOutcomes([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMatchOutcomes();

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [filter]);

  const renderFilterTabs = () => {
    return (
      <HStack spacing={4} mb={6}>
        <Button
          colorScheme={filter === 'all' ? 'blue' : 'gray'}
          onClick={() => handleFilterChange('all')}
          size="md"
          variant={filter === 'all' ? 'solid' : 'outline'}
        >
          All Matches
        </Button>
        <Button
          colorScheme={filter === 'successful' ? 'blue' : 'gray'}
          onClick={() => handleFilterChange('successful')}
          size="md"
          variant={filter === 'successful' ? 'solid' : 'outline'}
        >
          Successful Matches
        </Button>
        <Button
          colorScheme={filter === 'unsuccessful' ? 'blue' : 'gray'}
          onClick={() => handleFilterChange('unsuccessful')}
          size="md"
          variant={filter === 'unsuccessful' ? 'solid' : 'outline'}
        >
          Unsuccessful Matches
        </Button>
      </HStack>
    );
  };

  const renderParticipants = (match: MatchOutcome) => {
    return (
      <Box>
        {Object.entries(match.participants).map(([userId, participant]) => (
          <Box key={userId} display="flex" alignItems="center" mb={1}>
            {participant.profile?.displayName || 
             participant.profile?.name || 
             participant.profile?.email || 
             userId}{' '}
            <Badge 
              colorScheme={participant.response === 'yes' ? 'green' : 'red'}
              ml={2}
            >
              {participant.response === 'yes' ? 'Accepted' : 'Declined'}
            </Badge>
          </Box>
        ))}
      </Box>
    );
  };

  const renderMatchOutcomesTable = () => {
    if (isLoading) {
      return (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>CREATED AT</Th>
                <Th>DROP ID</Th>
                <Th>PARTICIPANTS</Th>
                <Th>STATUS</Th>
                <Th>COMPATIBILITY</Th>
              </Tr>
            </Thead>
            <Tbody>
              {[...Array(3)].map((_, i) => (
                <Tr key={i}>
                  <Td><Skeleton height="20px" /></Td>
                  <Td><Skeleton height="20px" /></Td>
                  <Td><Skeleton height="20px" /></Td>
                  <Td><Skeleton height="20px" /></Td>
                  <Td><Skeleton height="20px" /></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      );
    }

    // If no match outcomes and not loading, show empty state
    if (matchOutcomes.length === 0 && !isLoading) {
      return (
        <Box textAlign="center" py={10}>
          <Icon as={FaRegSadTear} boxSize={10} color="gray.400" mb={4} />
          <Text color="gray.500" fontSize="lg">
            {filter === 'successful' 
              ? 'No successful matches found'
              : filter === 'unsuccessful'
                ? 'No unsuccessful matches found'
                : 'No matches found'}
          </Text>
        </Box>
      );
    }

    return (
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>CREATED AT</Th>
              <Th>DROP ID</Th>
              <Th>PARTICIPANTS</Th>
              <Th>STATUS</Th>
              <Th>COMPATIBILITY</Th>
            </Tr>
          </Thead>
          <Tbody>
            {matchOutcomes.map((match) => (
              <Tr key={match.id}>
                <Td fontSize="sm">
                  {match.createdAt instanceof Timestamp 
                    ? new Date(match.createdAt.seconds * 1000).toLocaleString()
                    : 'Invalid Date'}
                </Td>
                <Td fontSize="sm">{match.dropId}</Td>
                <Td fontSize="sm">{renderParticipants(match)}</Td>
                <Td>
                  <Badge
                    colorScheme={match.status === 'successful' ? 'green' : 'red'}
                    fontSize="sm"
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    {match.status === 'successful' ? 'Successful' : 'Unsuccessful'}
                  </Badge>
                </Td>
                <Td fontSize="sm">
                  {match.matchDetails?.compatibility 
                    ? `${(match.matchDetails.compatibility * 1).toFixed(2)}%`
                    : 'N/A'}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    );
  };

  const tableRowBg = useColorModeValue('gray.50', 'gray.700');

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="300px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex 
        direction="column" 
        justify="center" 
        align="center" 
        height="300px" 
        p={4} 
        textAlign="center"
      >
        <Text fontSize="xl" color="red.500" mb={4}>
          Error Fetching Matches
        </Text>
        <Text color="gray.500">{error}</Text>
        <Button 
          mt={4} 
          colorScheme="blue" 
          onClick={() => {
            setError(null);
            setLastFetch(0); // Force refetch
          }}
        >
          Try Again
        </Button>
      </Flex>
    );
  }

  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading as="h1" size="xl">Match Outcomes</Heading>
        </HStack>

        {renderFilterTabs()}

        {error ? (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error loading match outcomes</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              ml={4}
              onClick={() => {
                setError(null);
                setLastFetch(0); // Force a new fetch
              }}
            >
              Try Again
            </Button>
          </Alert>
        ) : (
          renderMatchOutcomesTable()
        )}
      </VStack>
    </Box>
  );
};

export default function AdminDashboard() {
  const toast = useToast();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [matches, setMatches] = useState<{[dropId: string]: DropMatches}>({});
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');  // Navigate to landing page
      toast({
        title: 'Logged Out',
        description: 'Successfully logged out',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleAdminMode = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        tempDisableAdmin: user.tempDisableAdmin ? false : true
      });
      
      if (user) {
        user.tempDisableAdmin = !user.tempDisableAdmin;
      }
      
      // Navigate to home page when disabling admin mode
      if (user.tempDisableAdmin) {
        navigate('/home');
      }
    } catch (error) {
      console.error('Error toggling admin mode:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle admin mode',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropsList = async () => {
    try {
      setLoading(true);
      const dropsRef = collection(db, 'drops');
      const q = query(dropsRef, orderBy('startTime', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedDrops: Drop[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as Drop));
      
      setDrops(fetchedDrops);

      for (const drop of fetchedDrops) {
        await fetchDropMatchesById(drop.id);
      }
    } catch (error) {
      console.error('Error fetching drops:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch drops',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropMatchesById = async (dropId: string) => {
    try {
      const dropMatchesData = await getDropMatches(dropId);
      
      if (dropMatchesData) {
        setMatches(prev => ({
          ...prev,
          [dropId]: dropMatchesData
        }));
      }
    } catch (error) {
      console.error(`Error fetching matches for drop ${dropId}:`, error);
    }
  };

  const fetchDropParticipants = async (dropId: string): Promise<DropParticipants | null> => {
    try {
      const participantsRef = doc(db, 'dropParticipants', dropId);
      const participantsSnap = await getDoc(participantsRef);
      
      return participantsSnap.exists() 
        ? participantsSnap.data() as DropParticipants 
        : null;
    } catch (error) {
      console.error(`Error fetching participants for drop ${dropId}:`, error);
      return null;
    }
  };

  const handleGenerateMatches = async (drop: Drop) => {
    try {
      const participantsRef = doc(db, 'dropParticipants', drop.id);
      const participantsSnap = await getDoc(participantsRef);
      
      if (!participantsSnap.exists()) {
        toast({
          title: 'No Participants',
          description: 'No participants found for this drop',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const participantsData = participantsSnap.data();
      
      if (Object.keys(participantsData.participants).length < 2) {
        toast({
          title: 'Insufficient Participants',
          description: 'At least 2 participants are required to generate matches',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setLoading(true);

      await generateDropMatches(drop.id);
      
      const updatedMatches = await getDropMatches(drop.id);
      
      if (updatedMatches) {
        setMatches(prev => ({
          ...prev,
          [drop.id]: updatedMatches
        }));
      }

      toast({
        title: 'Matches Generated',
        description: `Successfully generated ${updatedMatches?.totalMatches || 0} matches`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating matches:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate matches',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDropMatches = (dropId: string) => {
    const dropMatches = matches[dropId];
    
    // If matches is undefined or null, return a "no matches" message
    if (!dropMatches) {
      return (
        <Text color="gray.500" p={4}>
          No matches found for this drop
        </Text>
      );
    }

    // If matches exist but are empty, return a "no matches generated" message
    if (!dropMatches.matches || Object.keys(dropMatches.matches).length === 0) {
      return (
        <Text color="gray.500" p={4}>
          No matches generated yet
        </Text>
      );
    }

    // Render matches table
    return (
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Participants</Th>
            <Th>Responses</Th>
            <Th>Compatibility</Th>
            <Th>Status</Th>
            <Th>Created</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.entries(dropMatches.matches).map(([matchId, match]) => {
            // Add an extra safety check for each match
            if (!match || typeof match !== 'object') {
              return null;
            }

            return (
              <Tr key={matchId}>
                <Td fontSize="sm">
                  {match.participants && Object.entries(match.participants).map(([userId, participant], index, arr) => (
                    <React.Fragment key={userId}>
                      {participant?.name || 'Unknown Participant'}
                      {index < arr.length - 1 ? ' & ' : ''}
                    </React.Fragment>
                  ))}
                </Td>
                <Td fontSize="sm">
                  {match.responses && Object.entries(match.responses || {}).map(([userId, response], index, arr) => (
                    <React.Fragment key={userId}>
                      <Badge 
                        colorScheme={response?.response === 'accepted' ? 'green' : 
                                   response?.response === 'declined' ? 'red' : 
                                   'yellow'}
                        mr={1}
                      >
                        {response?.response || 'pending'}
                      </Badge>
                    </React.Fragment>
                  ))}
                </Td>
                <Td fontSize="sm">{match.compatibility || 'N/A'}%</Td>
                <Td>
                  <Badge 
                    colorScheme={
                      match.status === 'confirmed' ? 'green' :
                      match.status === 'pending' ? 'yellow' :
                      'red'
                    }
                  >
                    {match.status || 'Unknown'}
                  </Badge>
                </Td>
                <Td fontSize="sm">
                  {match.createdAt && match.createdAt.toDate 
                    ? match.createdAt.toDate().toLocaleDateString() 
                    : 'Unknown Date'}
                </Td>
              </Tr>
            );
          }).filter(Boolean)}
        </Tbody>
      </Table>
    );
  };

  useEffect(() => {
    fetchDropsList();
  }, []);

  const renderDrops = () => {
    const currentTime = new Date();
    
    const upcomingDrops = drops.filter(drop => 
      drop.registrationDeadline.toDate() >= currentTime
    );
    
    const pastDrops = drops
      .filter(drop => 
        drop.registrationDeadline.toDate() < currentTime
      )
      .sort((a, b) => b.registrationDeadline.toDate().getTime() - a.registrationDeadline.toDate().getTime())
      .slice(0, 10);

    const renderDropCard = (drop: Drop, isPastDrop: boolean = false) => (
      <Box 
        key={drop.id} 
        borderWidth="1px" 
        borderRadius="lg" 
        p={4} 
        boxShadow="md"
      >
        <Flex justifyContent="space-between" alignItems="center">
          <VStack align="start" spacing={2} flex="1" mr={4}>
            <Heading size="md">{drop.title}</Heading>
            <Text>
              {isPastDrop ? 'Registration Closed' : 'Registration Deadline'}: 
              {drop.registrationDeadline.toDate().toLocaleDateString()}
            </Text>
            <Text>Location: {drop.location}</Text>
          </VStack>
          <Button 
            colorScheme={isPastDrop ? "gray" : "blue"} 
            onClick={() => handleGenerateMatches(drop)}
            isDisabled={loading}
          >
            Generate Matches
          </Button>
        </Flex>
        
        <Box mt={4}>
          <Heading size="sm" mb={2}>Matches</Heading>
          {renderDropMatches(drop.id)}
        </Box>
      </Box>
    );

    return (
      <Flex>
        <Box flex="1" mr={4}>
          <Heading size="md" mb={4}>Upcoming Drops</Heading>
          <VStack spacing={4} align="stretch">
            {upcomingDrops.length > 0 ? (
              upcomingDrops.map(drop => renderDropCard(drop))
            ) : (
              <Text color="gray.500">No upcoming drops</Text>
            )}
          </VStack>
        </Box>

        <Box flex="1">
          <Heading size="md" mb={4}>Past Drops</Heading>
          <VStack spacing={4} align="stretch">
            {pastDrops.length > 0 ? (
              pastDrops.map(drop => renderDropCard(drop, true))
            ) : (
              <Text color="gray.500">No past drops</Text>
            )}
          </VStack>
        </Box>
      </Flex>
    );
  };

  if (!user || !user.isAdmin) {
    return (
      <Box p={6} textAlign="center">
        <Text>Access Denied. Admin privileges required.</Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Top Navigation Bar */}
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding="1rem"
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        boxShadow="md"
      >
        <HStack spacing={0} alignItems="center">
          <Image 
            src="/nectr-logo.png" 
            alt="Nectr Logo" 
            boxSize="60px" 
            objectFit="contain"
            mr={1}
          />
          <Heading 
            size="lg" 
            color="#FDAA25" 
            fontWeight="bold"
          >
            Nektr Admin
          </Heading>
        </HStack>

        <Spacer />

        <HStack spacing={4}>
          <HStack spacing={2}>
            <Text>Admin Mode</Text>
            <Switch
              isChecked={!user?.tempDisableAdmin}
              onChange={toggleAdminMode}
              isDisabled={loading}
              colorScheme="blue"
            />
          </HStack>
        </HStack>
      </Flex>

      <Box p={6}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="center">
            <Text fontSize="2xl" fontWeight="bold">Admin Dashboard</Text>
            <HStack spacing={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="admin-mode" mb="0">
                  Admin Mode
                </FormLabel>
                <Switch
                  id="admin-mode"
                  isChecked={isAdminMode}
                  onChange={toggleAdminMode}
                />
              </FormControl>
              <Button colorScheme="red" onClick={handleSignOut}>
                Sign Out
              </Button>
            </HStack>
          </HStack>

          <Tabs>
            <TabList>
              <Tab>Drops</Tab>
              <Tab>Matches</Tab>
              <Tab>Match Outcomes</Tab>
              <Tab>Successful Matches</Tab>
              <Tab>Create Drop</Tab>
              <Tab>Test Matching</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Drops</Heading>
                  {loading ? (
                    <Flex justify="center" align="center" height="200px">
                      <Spinner />
                    </Flex>
                  ) : (
                    renderDrops()
                  )}
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Recent Matches</Heading>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Drop</Th>
                        <Th>Users</Th>
                        <Th>Compatibility</Th>
                        <Th>Status</Th>
                        <Th>Common Interests</Th>
                        <Th>Common Cuisines</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {/* matches.map((match) => (
                        <Tr key={match.id}>
                          <Td>{match.dropId}</Td>
                          <Td>{match.users.join(', ')}</Td>
                          <Td>{match.compatibilityScore}%</Td>
                          <Td>
                            <Badge 
                              colorScheme={
                                match.status === 'confirmed' ? 'green' :
                                match.status === 'pending' ? 'yellow' :
                                'red'
                              }
                            >
                              {match.status}
                            </Badge>
                          </Td>
                          <Td>{match.commonInterests.join(', ')}</Td>
                          <Td>{match.commonCuisines.join(', ')}</Td>
                        </Tr>
                      )) */}
                    </Tbody>
                  </Table>
                </VStack>
              </TabPanel>

              <TabPanel>
                <MatchOutcomesTable />
              </TabPanel>

              <TabPanel>
                <SuccessfulMatchesTable />
              </TabPanel>

              <TabPanel>
                <AdminDrops />
              </TabPanel>

              <TabPanel>
                <MatchingTest />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>
    </Box>
  );
}
