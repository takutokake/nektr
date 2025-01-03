import { Box, VStack, Text, CircularProgress, CircularProgressLabel } from '@chakra-ui/react';

interface StreakProgressProps {
  streak: number;
}

export default function StreakProgress({ streak }: StreakProgressProps) {
  const nextMilestone = Math.ceil(streak / 5) * 5;
  const progress = (streak / nextMilestone) * 100;

  return (
    <Box
      p={6}
      borderRadius="lg"
      bg="white"
      boxShadow="md"
      border="1px"
      borderColor="gray.200"
    >
      <VStack spacing={4}>
        <Text fontSize="xl" fontWeight="bold">
          Your Streak
        </Text>
        
        <CircularProgress
          value={progress}
          size="120px"
          thickness="12px"
          color="green.400"
        >
          <CircularProgressLabel>
            <VStack spacing={0}>
              <Text fontSize="2xl" fontWeight="bold">
                {streak}
              </Text>
              <Text fontSize="xs">days</Text>
            </VStack>
          </CircularProgressLabel>
        </CircularProgress>

        <Text color="gray.600" textAlign="center">
          {streak} days streak! {nextMilestone - streak} more to reach {nextMilestone} days
        </Text>

        <Box bg="green.50" p={3} borderRadius="md" width="100%">
          <Text fontSize="sm" color="green.600" textAlign="center">
            Next Reward at {nextMilestone} days:
            <br />
            🎉 Special Match Priority
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
