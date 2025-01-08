import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Avatar,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Switch,
  Spacer,
  Image,
  Heading,
  Progress,
  Grid,
  GridItem,
  VStack,
  Container,
  Tooltip,
  Icon,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { FaCog } from 'react-icons/fa';
import { UserProfile, Drop } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import ProfileModal from '../ProfileModal';
import UpcomingDrops from './UpcomingDrops';
import RegisteredDrops from './RegisteredDrops';
import ChallengesSection from './ChallengesSection';
import AdminDrops from '../admin/AdminDrops';
import { auth, db } from '../../firebase';
import { 
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';

interface HomePageProps {
  user: UserProfile;
  drops?: Drop[];
  onSignOut?: () => void;
}

interface NavButtonProps {
  icon: any;
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
  const [dropsCache, setDropsCache] = useState<{[key: string]: Drop}>({});
  const [participantsCache, setParticipantsCache] = useState<{[key: string]: any}>({});
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();
  const [loading, setLoading] = useState(false);

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
  const getStartTime = (timestamp?: any) => {
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

  const toggleAdminMode = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        tempDisableAdmin: user.tempDisableAdmin ? false : true
      });
      
      // Update local user state
      if (user) {
        user.tempDisableAdmin = !user.tempDisableAdmin;
      }
      
      // Refresh the page to update the view
      window.location.reload();
    } catch (error) {
      console.error('Error toggling admin mode:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle admin mode',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDrops = async () => {
    try {
      setLoading(true);
      
      // Get current timestamp for filtering
      const now = Timestamp.now();
      
      // Query drops that haven't started yet
      const dropsRef = collection(db, 'drops');
      const q = query(
        dropsRef,
        where('startTime', '>', now),
        orderBy('startTime', 'asc'),
        limit(10) // Limit to reduce reads
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedDrops: Drop[] = [];
      const newDropsCache: {[key: string]: Drop} = {};
      const dropIds: string[] = [];
      
      querySnapshot.forEach((doc) => {
        const drop = { id: doc.id, ...doc.data() } as Drop;
        fetchedDrops.push(drop);
        newDropsCache[doc.id] = drop;
        dropIds.push(doc.id);
      });
      
      setDropsData(fetchedDrops);
      setDropsCache(prev => ({ ...prev, ...newDropsCache }));
      
      // Batch get participants for all drops
      if (dropIds.length > 0) {
        const participantsQuery = query(
          collection(db, 'dropParticipants'),
          where('__name__', 'in', dropIds)
        );
        const participantsSnap = await getDocs(participantsQuery);
        
        const newParticipantsCache: {[key: string]: any} = {};
        participantsSnap.forEach(doc => {
          newParticipantsCache[doc.id] = doc.data();
        });
        
        setParticipantsCache(prev => ({ ...prev, ...newParticipantsCache }));
      }
      
    } catch (error) {
      console.error('Error fetching drops:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch drops',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getParticipantsCount = (dropId: string): number => {
    return participantsCache[dropId]?.totalParticipants || 0;
  };

  const isUserRegistered = (dropId: string): boolean => {
    const user = auth.currentUser;
    if (!user) return false;
    return !!participantsCache[dropId]?.participants[user.uid];
  };

  useEffect(() => {
    fetchDrops();
  }, []);

  const handleAdminMode = () => {
    if (user?.isAdmin && !user?.tempDisableAdmin) {
      // Removed navigate reference
    }
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
            Nectr
          </Heading>
        </HStack>
        
        <Spacer />
        
        <HStack spacing={4}>
          <Button colorScheme="red" size="sm" onClick={onSignOut}>
            Sign Out
          </Button>
          <Avatar 
            size="md" 
            name={user?.displayName || 'User'} 
            src={user?.photoURL} 
            onClick={() => setIsProfileModalOpen(true)}
            cursor="pointer"
            _hover={{ opacity: 0.8 }}
          />
          {user?.isAdmin && (
            <HStack spacing={2}>
              <Text>Admin Mode</Text>
              <Switch
                isChecked={!user.tempDisableAdmin}
                onChange={toggleAdminMode}
                isDisabled={loading}
                colorScheme="blue"
              />
            </HStack>
          )}
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
