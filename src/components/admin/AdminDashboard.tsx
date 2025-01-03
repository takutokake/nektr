import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Text,
} from '@chakra-ui/react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Drop, Match } from '../../types';
import AdminDrops from './AdminDrops';
import { generateMatches } from '../../services/matchingService';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Fetch drops and matches
  const fetchData = async () => {
    try {
      // Fetch drops
      const dropsQuery = query(
        collection(db, 'drops'),
        orderBy('startTime', 'desc')
      );
      const dropDocs = await getDocs(dropsQuery);
      const dropsData = dropDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Drop[];
      setDrops(dropsData);

      // Fetch matches
      const matchesQuery = query(collection(db, 'matches'));
      const matchDocs = await getDocs(matchesQuery);
      const matchesData = matchDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];
      setMatches(matchesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error fetching data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generate matches for a drop
  const handleGenerateMatches = async (dropId: string) => {
    setLoading(true);
    try {
      await generateMatches(dropId);
      toast({
        title: 'Matches generated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error generating matches:', error);
      toast({
        title: 'Error generating matches',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={8}>
      <Heading mb={6}>Admin Dashboard</Heading>
      
      <Tabs>
        <TabList>
          <Tab>Create Drop</Tab>
          <Tab>Manage Drops</Tab>
          <Tab>View Matches</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <AdminDrops onDropCreated={fetchData} />
          </TabPanel>

          <TabPanel>
            <VStack align="stretch" spacing={4}>
              <Heading size="md" mb={4}>Manage Drops</Heading>
              
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Title</Th>
                    <Th>Start Time</Th>
                    <Th>Location</Th>
                    <Th>Participants</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {drops.map(drop => (
                    <Tr key={drop.id}>
                      <Td>{drop.title}</Td>
                      <Td>{format(drop.startTime.toDate(), 'PPp')}</Td>
                      <Td>{drop.location}</Td>
                      <Td>{drop.currentParticipants}/{drop.maxParticipants}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            drop.status === 'upcoming'
                              ? 'blue'
                              : drop.status === 'matched'
                              ? 'green'
                              : 'gray'
                          }
                        >
                          {drop.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          isDisabled={drop.status !== 'upcoming' || loading}
                          onClick={() => handleGenerateMatches(drop.id)}
                        >
                          Generate Matches
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack align="stretch" spacing={4}>
              <Heading size="md" mb={4}>View Matches</Heading>
              
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Drop</Th>
                    <Th>Users</Th>
                    <Th>Common Interests</Th>
                    <Th>Common Cuisines</Th>
                    <Th>Score</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {matches.map(match => {
                    const drop = drops.find(d => d.id === match.dropId);
                    return (
                      <Tr key={match.id}>
                        <Td>{drop?.title || match.dropId}</Td>
                        <Td>
                          <Text fontSize="sm">{match.users.join(', ')}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{match.commonInterests.join(', ')}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{match.commonCuisines.join(', ')}</Text>
                        </Td>
                        <Td>{match.compatibilityScore.toFixed(1)}%</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              match.status === 'pending'
                                ? 'yellow'
                                : match.status === 'confirmed'
                                ? 'green'
                                : 'red'
                            }
                          >
                            {match.status}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
