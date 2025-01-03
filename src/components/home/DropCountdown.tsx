import { Box, Text, VStack, HStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface DropCountdownProps {
  startTime: Date;
  theme: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export default function DropCountdown({ startTime, theme }: DropCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = startTime.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <VStack spacing={0} bg="blue.500" p={4} borderRadius="md" minW="100px">
      <Text fontSize="3xl" fontWeight="bold" color="white">
        {value.toString().padStart(2, '0')}
      </Text>
      <Text fontSize="sm" color="white">
        {label}
      </Text>
    </VStack>
  );

  return (
    <Box>
      <Text fontSize="xl" mb={4}>
        Next {theme} Drop in:
      </Text>
      <HStack spacing={4} justify="center">
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Minutes" />
        <TimeUnit value={timeLeft.seconds} label="Seconds" />
      </HStack>
    </Box>
  );
}
