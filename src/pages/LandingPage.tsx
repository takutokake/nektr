import React from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  Link as ChakraLink,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  HStack,
  Spacer
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FaUtensils, FaUniversity, FaUserFriends, FaLock, FaClock, FaBullseye, FaArrowRight, FaUsers, FaHeart } from 'react-icons/fa';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const LandingPage = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  const features = [
    {
      icon: FaUtensils,
      title: 'Social Dining Made Easy',
      description: 'Meet new people over a shared meal.'
    },
    {
      icon: FaUniversity,
      title: 'Campus-Focused',
      description: 'Designed for USC, UCLA, and beyond.'
    },
    {
      icon: FaUserFriends,
      title: 'Smart Matching',
      description: 'Find like-minded students effortlessly.'
    }
  ];

  const steps = [
    {
      title: 'Sign Up',
      description: 'Create your profile and set your dining preferences.',
      icon: FaUserFriends
    },
    {
      title: 'Get Matched',
      description: 'Our smart algorithm pairs you with compatible students.',
      icon: FaUniversity
    },
    {
      title: 'Meet Up',
      description: 'Enjoy meals together and make lasting friendships.',
      icon: FaUtensils
    }
  ];

  const benefits = [
    {
      icon: FaBullseye,
      title: 'Smart Matching',
      description: 'Our compatibility algorithm ensures quality connections.'
    },
    {
      icon: FaClock,
      title: 'Flexible Scheduling',
      description: 'Join meals at times that work for you.'
    },
    {
      icon: FaLock,
      title: 'Privacy First',
      description: 'We prioritize your preferences and security.'
    }
  ];

  const faqs = [
    {
      question: 'Is Nektr free to use?',
      answer: 'Yes! Signing up and matching with students is completely free.'
    },
    {
      question: 'How does the matching algorithm work?',
      answer: 'We consider location, preferences, and shared interests.'
    },
    {
      question: 'Is my personal data safe?',
      answer: 'Absolutely! Your privacy is our top priority.'
    }
  ];

  return (
    <Box>
      {/* Top Navigation Bar */}
      <Flex 
        as="nav" 
        align="center" 
        justify="space-between" 
        wrap="wrap" 
        padding="1rem" 
        bg="white" 
        boxShadow="md"
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
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
            Nektr
          </Heading>
        </HStack>
        
        <Spacer />
        
        <HStack spacing={8}>
          <HStack spacing={8} color="gray.500">
            <Text 
              fontWeight="semibold" 
              fontSize="md"
              cursor="pointer"
              _hover={{ color: "#FDAA25" }}
            >
              Home
            </Text>
            <Text 
              fontWeight="semibold" 
              fontSize="md"
              cursor="pointer"
              _hover={{ color: "#FDAA25" }}
            >
              Match
            </Text>
            <Text 
              fontWeight="semibold" 
              fontSize="md"
              cursor="pointer"
              _hover={{ color: "#FDAA25" }}
            >
              About
            </Text>
          </HStack>
          <Button
            bg="#0066F9"
            color="white"
            size="md"
            px={8}
            borderRadius="full"
            _hover={{
              bg: "#0052CC",
              transform: "scale(1.05)",
            }}
            onClick={() => navigate('/auth')}
          >
            Sign Up
          </Button>
        </HStack>
      </Flex>

      {/* Add margin-top to account for fixed navbar */}
      <Box pt="76px">
        {/* Hero Section */}
        <Box 
          bg="linear-gradient(135deg, #FDAA25 0%, #CE7AFF 100%)" 
          color="white" 
          py={20} 
          position="relative" 
          overflow="hidden"
        >
          <Container maxW="container.xl">
            <Stack 
              direction={{ base: 'column', md: 'row' }} 
              align="center" 
              justify="center" 
              spacing={10}
            >
              <VStack align="flex-start" spacing={6} maxW="700px">
                <MotionBox 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5 }}
                >
                  <Heading as="h1" size="3xl" fontWeight="bold" lineHeight="1.2">
                    Meet. <Text as="span" color="#FEF8EB">Eat.</Text> Connect.
                  </Heading>
                  <Text fontSize="xl" mb={8}>
                    Discover your next favorite meal and make new friends along the way!
                  </Text>
                  <HStack spacing={4}>
                    <MotionButton 
                      size="lg" 
                      bgColor="#0085D6"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      color="white" 
                      _hover={{ boxShadow: "lg" }}
                      onClick={() => navigate('/auth')}
                    >
                      Join Now
                    </MotionButton>
                    <Button size="lg" variant="link" color="white">
                      Learn More
                    </Button>
                  </HStack>
                </MotionBox>
              </VStack>
              <MotionBox 
                animate={{ y: [0, -5, 0] }} 
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Image 
                  src="homescreen.png" 
                  alt="Students enjoying meals" 
                  objectFit="cover" 
                  w="full" 
                  h="full" 
                  borderRadius="xl" 
                />
              </MotionBox>
            </Stack>
          </Container>
        </Box>

        {/* About Us Section */}
        <Box py={20} bg={bgColor}>
          <Container maxW="container.xl">
            <VStack spacing={12} textAlign="center">
              <VStack spacing={6} maxW="800px">
                <Heading as="h2" size="xl">
                  What is Nektr?
                </Heading>
                <Text fontSize="lg" color={textColor}>
                  Nektr is a social dining platform that connects college students over shared meals, helping them build meaningful relationships in a fun and engaging way.
                </Text>
              </VStack>

              <VStack spacing={6} align="start" maxW="600px">
                {[
                  { 
                    icon: FaUsers, 
                    text: "Meet new people with shared interests."
                  },
                  { 
                    icon: FaUtensils, 
                    text: "Enjoy great meals at local restaurants."
                  },
                  { 
                    icon: FaClock, 
                    text: "Flexible, stress-free scheduling."
                  },
                  { 
                    icon: FaHeart, 
                    text: "Combat loneliness and build lasting friendships."
                  }
                ].map((item, index) => (
                  <MotionBox
                    key={index}
                    whileHover={{ 
                      scale: 1.02, 
                      transition: { duration: 0.2 } 
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                    w="full"
                  >
                    <HStack 
                      spacing={6} 
                      p={4}
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      borderRadius="xl"
                      align="center"
                    >
                      <Icon 
                        as={item.icon} 
                        w={10} 
                        h={10} 
                        color="blue.500" 
                      />
                      <Text 
                        fontSize="lg" 
                        color={useColorModeValue('gray.700', 'gray.200')}
                      >
                        {item.text}
                      </Text>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </VStack>
          </Container>
        </Box>

        {/* How It Works Section */}
        <Box py={20} bg={useColorModeValue('gray.50', 'gray.900')}>
          <Container maxW="container.xl">
            <VStack spacing={12}>
              <Heading as="h2" size="xl" textAlign="center">
                How Nektr Works
              </Heading>

              <SimpleGrid 
                columns={{ base: 1, md: 3 }} 
                spacing={8} 
                w="full"
              >
                {steps.map((step, index) => (
                  <MotionBox
                    key={index}
                    whileHover={{ 
                      scale: 1.05, 
                      rotate: 2,
                      transition: { duration: 0.3 }
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                  >
                    <VStack
                      spacing={6}
                      p={8}
                      bg={useColorModeValue('white', 'gray.700')}
                      borderRadius="xl"
                      boxShadow="md"
                      position="relative"
                      overflow="hidden"
                      h="full"
                      align="center"
                      textAlign="center"
                    >
                      {/* Animated Number */}
                      <MotionBox
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 260, 
                          damping: 20 
                        }}
                      >
                        <Box
                          w={16}
                          h={16}
                          borderRadius="full"
                          bg="blue.500"
                          color="white"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="2xl"
                          fontWeight="bold"
                          mb={4}
                          boxShadow="md"
                        >
                          {index + 1}
                        </Box>
                      </MotionBox>

                      {/* Step Icon with Hover Effect */}
                      <Icon 
                        as={step.icon || FaUserFriends} 
                        w={12} 
                        h={12} 
                        color="blue.500" 
                        mb={4}
                      />

                      {/* Step Content */}
                      <VStack spacing={3}>
                        <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                          {step.title}
                        </Heading>
                        <Text 
                          color={useColorModeValue('gray.600', 'gray.300')} 
                          textAlign="center"
                        >
                          {step.description}
                        </Text>
                      </VStack>

                      {/* Decorative Gradient Overlay */}
                      <Box
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        height="4px"
                        bgGradient="linear(to-r, #FDAA25, #CE7AFF)"
                      />
                    </VStack>
                  </MotionBox>
                ))}
              </SimpleGrid>

              {/* Enhanced CTA Button */}
              <MotionButton
                size="lg"
                bgGradient="linear(to-r, #FDAA25 30%, #CE7AFF 80%)"
                color="white"
                _hover={{ 
                  boxShadow: "xl", 
                  transform: "scale(1.05)" 
                }}
                leftIcon={<FaArrowRight />}
                onClick={() => navigate('/auth')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Today
              </MotionButton>
            </VStack>
          </Container>
        </Box>

        {/* FAQs Section */}
        <Box py={20} bg={useColorModeValue('gray.50', 'gray.900')}>
          <Container maxW="container.xl">
            <VStack spacing={12}>
              <Heading as="h2" size="xl">
                Got Questions? We've Got Answers!
              </Heading>

              <Accordion allowToggle w="full" maxW="800px">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index}>
                    <AccordionButton py={4}>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        {faq.question}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4} color={textColor}>
                      {faq.answer}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </VStack>
          </Container>
        </Box>

        {/* Footer */}
        <Box bg={useColorModeValue('gray.100', 'gray.800')} py={10}>
          <Container maxW="container.xl">
            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={8}
              justify="space-between"
              align="center"
            >
              <VStack align={{ base: 'center', md: 'flex-start' }}>
                <Image 
                  src="/nectr-logo.png" 
                  alt="Nectr Logo" 
                  boxSize="60px" 
                  objectFit="contain"
                  mr={1}
                />
                <Text color={textColor}>Questions? Email us at usenektr@gmail.com</Text>
              </VStack>

              <Stack direction="row" spacing={6}>
                <ChakraLink href="#">About</ChakraLink>
                <ChakraLink href="#">Contact</ChakraLink>
                <ChakraLink href="#">Privacy Policy</ChakraLink>
                <ChakraLink href="#">Terms of Service</ChakraLink>
              </Stack>

              <Stack direction="row" spacing={6}>
                <ChakraLink href="#" isExternal>Instagram</ChakraLink>
                <ChakraLink href="#" isExternal>Twitter</ChakraLink>
                <ChakraLink href="#" isExternal>LinkedIn</ChakraLink>
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* Footer with Privacy Policy Link */}
        <Box bg="gray.100" py={8}>
          <Container maxW="container.xl">
            <VStack spacing={4} align="center">
              <HStack spacing={4}>
                <ChakraLink 
                  as={RouterLink} 
                  to="/privacy" 
                  color="blue.500" 
                  fontWeight="bold"
                  _hover={{ color: "blue.600", textDecoration: "underline" }}
                >
                  Privacy Policy
                </ChakraLink>
                <ChakraLink 
                  as={RouterLink} 
                  to="/terms" 
                  color="blue.500" 
                  fontWeight="bold"
                  _hover={{ color: "blue.600", textDecoration: "underline" }}
                >
                  Terms of Service
                </ChakraLink>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                {new Date().getFullYear()} Nektr. All rights reserved.
              </Text>
            </VStack>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
