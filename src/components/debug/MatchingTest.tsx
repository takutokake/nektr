import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Badge
} from '@chakra-ui/react';
import { createTestData } from '../../utils/testData';
import { generateDropMatches } from '../../services/matchingService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

export const MatchingTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const toast = useToast();

  const runTest = async () => {
    setLoading(true);
    try {
      console.log('Starting test...');
      
      // Create test data
      const { dropId } = await createTestData();
      console.log('Test data created with dropId:', dropId);
      
      // Wait a bit for Firestore to propagate the data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate matches
      console.log('Generating matches...');
      const matches = await generateDropMatches(dropId);
      console.log('Matches generated:', matches);

      // Fetch all related data
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const users = Object.fromEntries(
        usersSnapshot.docs.map(doc => [doc.id, doc.data()])
      );

      const matchesRef = collection(db, 'matches');
      const matchesQuery = query(matchesRef, where('dropId', '==', dropId));
      const matchesSnapshot = await getDocs(matchesQuery);
      const matchResults = matchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTestResults({
        dropId,
        users,
        matches: matchResults
      });

      toast({
        title: 'Test completed successfully',
        description: `Created ${matchResults.length} matches`,
        status: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Failed to generate matches',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Button
          colorScheme="blue"
          onClick={runTest}
          isLoading={loading}
          loadingText="Running test..."
        >
          Run Matching Test
        </Button>

        {testResults && (
          <>
            <Text fontSize="lg" fontWeight="bold">
              Test Results
            </Text>

            <Box>
              <Text fontWeight="semibold">Drop ID: {testResults.dropId}</Text>
            </Box>

            <Box>
              <Text fontWeight="semibold" mb={2}>
                Matches Generated:
              </Text>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Match ID</Th>
                    <Th>Users</Th>
                    <Th>Compatibility</Th>
                    <Th>Common Interests</Th>
                    <Th>Common Cuisines</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {testResults.matches.map((match: any) => (
                    <Tr key={match.id}>
                      <Td>{match.id}</Td>
                      <Td>
                        {match.users.map((userId: string) => (
                          <Text key={userId}>
                            {testResults.users[userId]?.displayName || userId}
                          </Text>
                        ))}
                      </Td>
                      <Td>{match.compatibility}%</Td>
                      <Td>{match.commonInterests.join(', ')}</Td>
                      <Td>{match.commonCuisines.join(', ')}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            match.status === 'confirmed'
                              ? 'green'
                              : match.status === 'pending'
                              ? 'yellow'
                              : 'red'
                          }
                        >
                          {match.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};
