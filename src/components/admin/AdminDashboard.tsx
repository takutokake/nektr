import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Button, 
  useToast, 
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Switch,
  FormControl,
  FormLabel,
  useColorModeValue,
  Badge
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  generateDropMatches, 
  getDropMatches 
} from '../../services/matchingService';
import { Drop, DropMatches, DropParticipants, Match, UserProfile } from '../../types';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminDrops from './AdminDrops';
import { MatchingTest } from '../debug/MatchingTest';

export default function AdminDashboard() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [matches, setMatches] = useState<{[dropId: string]: DropMatches}>({});
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(true);
  const { user, logout } = useAuth();
  const toast = useToast();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error signing out',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const toggleAdminMode = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      
      // Update Firestore
      await updateDoc(userRef, {
        tempDisableAdmin: true
      });
      
      // Show transition message
      toast({
        title: 'Switching to User Mode',
        description: 'Redirecting to homepage...',
        status: 'success',
        duration: 1500,
      });
      
      // Force state update and refresh without redirecting to auth
      setTimeout(() => {
        window.location.replace('/');
      }, 1000);
      
    } catch (error) {
      console.error('Error toggling admin mode:', error);
      toast({
        title: 'Error switching to user mode',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch drops and their matches
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

      // Fetch matches for each drop
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

  // Fetch matches for a drop
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
      // Don't show toast for each drop's matches fetch failure
      // as it might spam the user if multiple drops fail
    }
  };

  // Fetch participants for a drop
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

  // Handle generate matches
  const handleGenerateMatches = async (drop: Drop) => {
    try {
      // First, check if participants exist
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

      const participantsData = participantsSnap.data() as DropParticipants;
      
      // Check if there are enough participants
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

      // Set loading state for this specific drop
      setLoading(true);

      // Generate matches
      console.log('Starting match generation for drop:', drop.id);
      await generateDropMatches(drop.id);
      console.log('Match generation completed');
      
      // Fetch and update matches immediately
      console.log('Fetching updated matches');
      const updatedMatches = await getDropMatches(drop.id);
      console.log('Updated matches:', updatedMatches);
      
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

  // Fetch drops on component mount
  useEffect(() => {
    fetchDropsList();
  }, []);

  // Render matches for a specific drop
  const renderDropMatches = (dropId: string) => {
    const dropMatches = matches[dropId];
    
    if (!dropMatches) {
      return <Text color="gray.500">No matches found</Text>;
    }

    if (Object.keys(dropMatches.matches).length === 0) {
      return <Text color="gray.500">No matches generated yet</Text>;
    }

    return (
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Participants</Th>
              <Th>Compatibility</Th>
              <Th>Status</Th>
              <Th>Created</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Object.entries(dropMatches.matches).map(([matchId, match]) => (
              <Tr key={matchId}>
                <Td>
                  {Object.values(match.participants)
                    .map(participant => participant.name)
                    .join(' & ')}
                </Td>
                <Td>{match.compatibility}%</Td>
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
                <Td>{match.createdAt.toDate().toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    );
  };

  // Render drops list
  const renderDrops = () => {
    return drops.map(drop => (
      <Box 
        key={drop.id} 
        borderWidth="1px" 
        borderRadius="lg" 
        p={4} 
        mb={4}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <VStack align="start" spacing={2}>
            <Heading size="md">{drop.title}</Heading>
            <Text>Date: {drop.startTime.toDate().toLocaleDateString()}</Text>
            <Text>Location: {drop.location}</Text>
          </VStack>
          <Button 
            colorScheme="blue" 
            onClick={() => handleGenerateMatches(drop)}
          >
            Generate Matches
          </Button>
        </Flex>
        
        {/* Matches Section */}
        <Box mt={4}>
          <Heading size="sm" mb={2}>Matches</Heading>
          {renderDropMatches(drop.id)}
        </Box>
      </Box>
    ));
  };

  if (!user || !user.isAdmin) {
    return (
      <Box p={6} textAlign="center">
        <Text>Access Denied. Admin privileges required.</Text>
      </Box>
    );
  }

  return (
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
            <Tab>Create Drop</Tab>
            <Tab>Test Matching</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Upcoming Drops</Heading>
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
              <AdminDrops />
            </TabPanel>

            <TabPanel>
              <MatchingTest />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
}
