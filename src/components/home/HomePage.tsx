import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Progress, 
  VStack,
  HStack,
  Flex, 
  Spacer, 
  Avatar, 
  Button,
  Icon,
  Grid,
  GridItem,
  Tooltip,
  useToast,
  Image,
  SimpleGrid
} from '@chakra-ui/react';
import { 
  FaFire, 
  FaHandshake, 
  FaTrophy, 
  FaCalendarAlt, 
  FaUserFriends 
} from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useColorModeValue } from '@chakra-ui/react';
import { UserProfile, Drop } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import ProfileModal from '../ProfileModal';
import ChallengesSection from './ChallengesSection';
import DropCountdown from './DropCountdown';
import UpcomingDrops from './UpcomingDrops';
import RegisteredDrops from './RegisteredDrops';
import MatchPreview from './MatchPreview';
import AdminDrops from '../admin/AdminDrops';
import { Timestamp } from 'firebase/firestore';

interface HomePageProps {
  user: UserProfile;
  drops?: Drop[];
  onSignOut?: () => void;
}

interface NavButtonProps {
  icon: IconType;
  label: string;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, onClick }) => (
  <Tooltip label={label} hasArrow placement="bottom">
    <Button 
      variant="ghost" 
      onClick={onClick}
      display="flex"
      flexDirection="column"
      alignItems="center"
      height="80px"
      width="100px"
    >
      <Icon as={icon} boxSize={6} mb={2} />
      <Text fontSize="xs">{label}</Text>
    </Button>
  </Tooltip>
);

const HomePage: React.FC<HomePageProps> = ({ user, drops = [], onSignOut }) => {
  const { logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dropsData, setDropsData] = useState<Drop[]>(drops);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();

  useEffect(() => {
    setDropsData(drops);
  }, [drops]);

  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onSignOut) {
        onSignOut();
      }
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Logout Error',
        description: 'An error occurred while logging out.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDropUpdate = () => {
    // Refresh drops data from parent component
    setDropsData(drops);
  };

  // Convert Timestamp to Date for DropCountdown
  const getStartTime = (timestamp?: Timestamp) => {
    return timestamp ? timestamp.toDate() : new Date();
  };

  // Filter drops based on user registration
  const registeredDrops = dropsData.filter(drop => 
    drop.participants?.includes(user.uid)
  );

  const handleDropJoin = (dropId: string) => {
    toast({
      title: "Drop joined!",
      description: "You can view it in your registered drops section",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDropUnregister = (dropId: string) => {
    toast({
      title: "Drop unregistered",
      description: "You've been removed from the drop",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Top Navigation Bar */}
      <Flex 
        as="nav" 
        align="center" 
        justify="space-between" 
        wrap="wrap" 
        padding="1rem" 
        bg="white" 
        boxShadow="md"
      >
        <HStack spacing={0} alignItems="center">
          <Image 
            src="/nectr-logo.png" 
            alt="Nectr Logo" 
            boxSize="50px" 
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
        
        <HStack spacing={4}>
          <Button colorScheme="red" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
          <Avatar 
            size="md" 
            name={user?.displayName || 'User'} 
            src={user?.photoURL} 
            onClick={handleOpenProfileModal}
            cursor="pointer"
            _hover={{ opacity: 0.8 }}
          />
        </HStack>
      </Flex>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={handleCloseProfileModal} 
        initialData={user}
      />

      <Container maxW="container.xl" py={8}>
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          <GridItem colSpan={2}>
            <VStack spacing={6} align="stretch">
              <DropCountdown 
                startTime={getStartTime(dropsData[0]?.startTime)} 
                theme={dropsData[0]?.theme || 'General'} 
              />
              <UpcomingDrops 
                drops={dropsData} 
                onDropJoin={handleDropJoin}
              />
              <RegisteredDrops 
                drops={registeredDrops}
                onDropUnregister={handleDropUnregister}
              />
            </VStack>
          </GridItem>
          
          <GridItem colSpan={1}>
            <VStack spacing={6} align="stretch">
              <ChallengesSection />
              <MatchPreview user={user} />
              
              {/* Quick Stats */}
              <Box 
                p={6} 
                borderWidth={1} 
                borderRadius="lg" 
                bg={bgColor} 
                borderColor={borderColor}
              >
                <VStack align="stretch" spacing={4}>
                  <Heading size="md">Your Progress</Heading>
                  
                  <HStack justify="space-between">
                    <Text>Total Matches</Text>
                    <Text fontWeight="bold">{user.totalMatches || 0}</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text>Completed Challenges</Text>
                    <Text fontWeight="bold">{user.completedChallenges?.length || 0}</Text>
                  </HStack>
                  
                  <Box>
                    <Text mb={2}>Drop Participation</Text>
                    <Progress 
                      value={((user.completedChallenges?.length || 0) / 10) * 100} 
                      colorScheme="blue" 
                      borderRadius="full" 
                    />
                  </Box>
                </VStack>
              </Box>
            </VStack>
          </GridItem>
        </Grid>

        {/* Admin Drops Section (if admin) */}
        {user.isAdmin && <AdminDrops />}
      </Container>
    </Box>
  );
};

export default HomePage;
