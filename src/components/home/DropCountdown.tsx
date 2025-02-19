import { Box, Text, VStack, HStack, useColorModeValue, useToast } from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import { dropsService } from '../../services/dropsService';

interface DropCountdownProps {
  registrationDeadline: Date;
  theme: string;
  dropId: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export default function DropCountdown({ registrationDeadline, theme, dropId }: DropCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [timerEnded, setTimerEnded] = useState(false);
  const toast = useToast();
  
  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const labelColor = useColorModeValue('blue.600', 'blue.200');

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <VStack 
      spacing={0} 
      bg="blue.500" 
      p={2} 
      borderRadius="md" 
      minW="60px" 
      align="center"
    >
      <Text fontSize="2xl" fontWeight="bold" color="white">
        {value.toString().padStart(2, '0')}
      </Text>
      <Text fontSize="xs" color="white">
        {label}
      </Text>
    </VStack>
  );

  const handleTimerEnd = useCallback(async () => {
    try {
      const result = await dropsService.handleDropRegistrationEnd(dropId);
      if (result) {
        toast({
          title: "Registration Closed",
          description: `Registration for ${theme} Drop has ended.`,
          status: "info",
          duration: 3000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Error handling drop registration end:', error);
    }
  }, [dropId, theme, toast]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const currentTime = new Date('2025-01-13T02:45:24-08:00');
      const difference = registrationDeadline.getTime() - currentTime.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimerEnded(true);
        handleTimerEnd();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [registrationDeadline, handleTimerEnd]);

  if (timerEnded) return null;

  return (
    <Box bg={bgColor} p={3} borderRadius="lg" width="fit-content" mx="auto">
      <Text 
        textAlign="center" 
        mb={2} 
        color={labelColor} 
        fontWeight="semibold"
      >
        {theme} Drop Registration Ends In:
      </Text>
      <HStack spacing={2} justify="center">
        <TimeUnit value={timeLeft.hours} label="hrs" />
        <Text color={labelColor} fontWeight="bold">:</Text>
        <TimeUnit value={timeLeft.minutes} label="min" />
        <Text color={labelColor} fontWeight="bold">:</Text>
        <TimeUnit value={timeLeft.seconds} label="sec" />
      </HStack>
    </Box>
  );
}
