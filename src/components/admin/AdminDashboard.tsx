import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Heading, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  Spinner,
  Flex,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast
} from '@chakra-ui/react';
import { Timestamp, collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { generateDropMatches } from '../../services/matchingService';
import { Drop, Match, UserProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import AdminDrops from './AdminDrops';

export default function AdminDashboard() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchDrops = async () => {
      try {
        const dropsRef = collection(db, 'drops');
        const q = query(dropsRef, orderBy('startTime', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedDrops: Drop[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as Drop));
        
        setDrops(fetchedDrops);
      } catch (error) {
        console.error('Error fetching drops:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch drops',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    };

    const fetchMatches = async () => {
      try {
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedMatches: Match[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as Match));
        
        setMatches(fetchedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch matches',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    };

    fetchDrops();
    fetchMatches();
  }, []);

  const handleGenerateMatches = async (dropId: string) => {
    setLoading(true);
    try {
      await generateDropMatches(dropId);
      toast({
        title: 'Matches generated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error generating matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate matches',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
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
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Drops</Tab>
          <Tab>Matches</Tab>
          <Tab>Create Drop</Tab>
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
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Title</Th>
                      <Th>Start Time</Th>
                      <Th>Location</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {drops.map((drop) => (
                      <Tr key={drop.id}>
                        <Td>{drop.title}</Td>
                        <Td>{drop.startTime.toDate().toLocaleString()}</Td>
                        <Td>{drop.location}</Td>
                        <Td>
                          <Badge 
                            colorScheme={
                              drop.status === 'upcoming' ? 'green' : 
                              drop.status === 'matched' ? 'blue' : 'red'
                            }
                          >
                            {drop.status}
                          </Badge>
                        </Td>
                        <Td>
                          {drop.status === 'upcoming' && (
                            <Button 
                              size="sm" 
                              colorScheme="blue" 
                              onClick={() => handleGenerateMatches(drop.id)}
                              isLoading={loading}
                            >
                              Generate Matches
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
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
                  </Tr>
                </Thead>
                <Tbody>
                  {matches.map((match) => (
                    <Tr key={match.id}>
                      <Td>{match.dropId}</Td>
                      <Td>{match.users.join(', ')}</Td>
                      <Td>{match.compatibilityScore}%</Td>
                      <Td>
                        <Badge 
                          colorScheme={
                            match.status === 'pending' ? 'yellow' : 
                            match.status === 'confirmed' ? 'green' : 'red'
                          }
                        >
                          {match.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          </TabPanel>

          <TabPanel>
            <AdminDrops />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
