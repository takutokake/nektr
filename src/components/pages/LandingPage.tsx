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
  Link,
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
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaUniversity, FaUserFriends, FaLock, FaClock, FaBullseye } from 'react-icons/fa';

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
      description: 'Create your profile and set your dining preferences.'
    },
    {
      title: 'Get Matched',
      description: 'Our smart algorithm pairs you with compatible students.'
    },
    {
      title: 'Meet Up',
      description: 'Enjoy meals together and make lasting friendships.'
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
      {/* Hero Section */}
      <Box
        bg="linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)"
        color="white"
        py={20}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={8}
            align="center"
            justify="space-between"
          >
            <VStack align="flex-start" spacing={6} maxW="600px">
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Heading as="h1" size="3xl" mb={4}>
                  Meet. Eat. Connect.
                </Heading>
                <Text fontSize="xl" mb={8}>
                  Turning meals into meaningful connections for college students.
                </Text>
                <MotionButton
                  size="lg"
                  colorScheme="white"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Join Now
                </MotionButton>
                <Text fontSize="sm" mt={4}>
                  Start connecting with students who share your interests over great food!
                </Text>
              </MotionBox>
            </VStack>
            <Box
              w={{ base: "full", md: "50%" }}
              h="400px"
              position="relative"
              overflow="hidden"
              borderRadius="xl"
            >
              <Image
                src="/dining-hero.jpg"
                alt="Students enjoying meals together"
                objectFit="cover"
                w="full"
                h="full"
              />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* About Us Section */}
      <Box py={20} bg={bgColor}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center" maxW="800px">
              <Heading as="h2" size="xl">
                What is Nektr?
              </Heading>
              <Text fontSize="lg" color={textColor}>
                Nektr is an innovative social dining platform designed to help college students combat
                social isolation by connecting them through shared meals. Using intelligent matching
                based on location, cuisine preferences, and interests, we make it easy to find your
                next meal buddy and build meaningful connections.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} w="full">
              {features.map((feature, index) => (
                <VStack
                  key={index}
                  p={8}
                  bg={useColorModeValue('white', 'gray.700')}
                  borderRadius="lg"
                  boxShadow="md"
                  spacing={4}
                >
                  <Icon as={feature.icon} w={10} h={10} color="blue.500" />
                  <Heading size="md">{feature.title}</Heading>
                  <Text textAlign="center" color={textColor}>
                    {feature.description}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box py={20} bg={useColorModeValue('gray.50', 'gray.900')}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <Heading as="h2" size="xl">
              How Nektr Works
            </Heading>

            <Grid
              templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
              gap={8}
              w="full"
            >
              {steps.map((step, index) => (
                <VStack
                  key={index}
                  spacing={4}
                  p={8}
                  bg={useColorModeValue('white', 'gray.700')}
                  borderRadius="lg"
                  boxShadow="md"
                >
                  <Box
                    w={12}
                    h={12}
                    borderRadius="full"
                    bg="blue.500"
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    {index + 1}
                  </Box>
                  <Heading size="md">{step.title}</Heading>
                  <Text textAlign="center" color={textColor}>
                    {step.description}
                  </Text>
                </VStack>
              ))}
            </Grid>

            <Button
              size="lg"
              colorScheme="blue"
              onClick={() => navigate('/auth')}
            >
              Get Started Today
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Why Choose Nektr Section */}
      <Box py={20} bg={bgColor}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <Heading as="h2" size="xl">
              Why Choose Nektr?
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} w="full">
              {benefits.map((benefit, index) => (
                <VStack
                  key={index}
                  p={8}
                  bg={useColorModeValue('white', 'gray.700')}
                  borderRadius="lg"
                  boxShadow="md"
                  spacing={4}
                >
                  <Icon as={benefit.icon} w={10} h={10} color="blue.500" />
                  <Heading size="md">{benefit.title}</Heading>
                  <Text textAlign="center" color={textColor}>
                    {benefit.description}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
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
                alt="Nektr Logo" 
                boxSize="60px" 
                objectFit="contain"
                mr={1}
              />
              <Text color={textColor}>Questions? Email us at usenektr@gmail.com</Text>
            </VStack>

            <Stack direction="row" spacing={6}>
              <Link href="#">About</Link>
              <Link href="#">Contact</Link>
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Terms of Service</Link>
            </Stack>

            <Stack direction="row" spacing={6}>
              <Link href="#" isExternal>Instagram</Link>
              <Link href="#" isExternal>Twitter</Link>
              <Link href="#" isExternal>LinkedIn</Link>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
