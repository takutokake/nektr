import { Box, VStack, Text, Progress, Icon } from '@chakra-ui/react';
import { FaUserAstronaut } from 'react-icons/fa';
import { UserProfile } from '../../types';

interface MatchPreviewProps {
  user: UserProfile;
}

export default function MatchPreview({ user }: MatchPreviewProps) {
  const hints = [
    'Loves trying new restaurants',
    'Enjoys outdoor activities',
    'Tech enthusiast',
  ];

  return (
    <Box
      p={6}
      borderRadius="lg"
      bg="white"
      boxShadow="md"
      border="1px"
      borderColor="gray.200"
    >
      <VStack spacing={4} align="stretch">
        <Box textAlign="center">
          <Icon as={FaUserAstronaut} w={12} h={12} color="blue.500" />
          <Text fontSize="xl" fontWeight="bold" mt={2}>
            Your Mystery Match
          </Text>
        </Box>

        <VStack spacing={3} align="stretch">
          {hints.map((hint, index) => (
            <Box key={index}>
              <Text fontSize="sm" mb={1}>
                Hint {index + 1}
              </Text>
              <Progress
                value={(index + 1) * 33.33}
                size="sm"
                colorScheme="blue"
                borderRadius="full"
              />
              <Text mt={1} color="gray.600">
                {hint}
              </Text>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
}
