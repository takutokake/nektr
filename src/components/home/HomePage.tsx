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
  MenuDivider,
  useToast,
  useColorModeValue,
  Center
} from '@chakra-ui/react';
import { FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Drop } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import ProfileModal from '../ProfileModal';
import UpcomingDrops from './UpcomingDrops';
import RegisteredDrops from './RegisteredDrops';
import ChallengesSection from './ChallengesSection';
import NotificationBell from '../notifications/NotificationBell';
import { Notification } from '../../types/notifications';
import { auth, db } from '../../firebase';
import { MatchRegistrationService } from '../../services/matchRegistrationService';
import { 
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  setDoc,
  addDoc
} from 'firebase/firestore';
import { dropsService } from '../../services/dropsService';
import { useMatchRegistration } from '../../hooks/useMatchRegistration';
import { MatchNotificationModal } from '../notifications/MatchNotificationModal';

interface HomePageProps {
  user: UserProfile;
  drops?: Drop[];
  onSignOut?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, drops = [], onSignOut }) => {
  const { logout } = useAuth();
  const { respondToMatch } = useMatchRegistration();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dropsData, setDropsData] = useState<Drop[]>([]);
  const [dropsCache, setDropsCache] = useState<{[key: string]: Drop}>({});
  const [participantsCache, setParticipantsCache] = useState<{[key: string]: any}>({});
  const [currentUser, setCurrentUser] = useState(user);

  // Update currentUser when user prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser({
          ...currentUser,
          photoURL: user.photoURL || undefined,
          displayName: user.displayName || ''
        });
      }
    });

    return () => unsubscribe();
  }, []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [currentMatchNotification, setCurrentMatchNotification] = useState<Notification | null>(null);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDrops = async () => {
      try {
        const { drops } = await dropsService.getDrops();
        setDropsData(drops);
      } catch (error) {
        console.error('Error fetching drops:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch drops',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchDrops();
  }, []);

  useEffect(() => {
    const matchNotification = notifications.find(
      n => n.type === 'match' && !n.read
    );
    
    setCurrentMatchNotification(matchNotification || null);
  }, [notifications]);

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
      navigate('/');  
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
    // Removed this function as it's no longer needed
  };

  const getStartTime = (timestamp?: any) => {
    return timestamp ? timestamp.toDate() : new Date();
  };

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
      
      if (user) {
        user.tempDisableAdmin = !user.tempDisableAdmin;
      }
      
      // Navigate to admin dashboard when enabling admin mode
      if (!user.tempDisableAdmin) {
        navigate('/admin');
      } else {
        navigate('/home');
      }
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
      
      const now = Timestamp.now();
      
      const dropsRef = collection(db, 'drops');
      const q = query(
        dropsRef,
        where('startTime', '>', now),
        orderBy('startTime', 'asc'),
        limit(10)
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
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Notifications updated: ${snapshot.size} items`);
        }
        
        const newNotifications: Notification[] = [];
        snapshot.forEach((doc) => {
          try {
            const data = doc.data();
            const createdAt = data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate() 
              : new Date(data.createdAt);

            let matchDetails = data.matchDetails;
            if (matchDetails?.matchTime) {
              matchDetails = {
                ...matchDetails,
                matchTime: matchDetails.matchTime instanceof Timestamp 
                  ? matchDetails.matchTime.toDate() 
                  : new Date(matchDetails.matchTime)
              };
            }

            newNotifications.push({
              id: doc.id,
              type: data.type,
              title: data.title,
              message: data.message,
              read: data.read,
              createdAt,
              actionTaken: data.actionTaken,
              matchDetails
            });
          } catch (error) {
            console.error('Error processing notification:', error);
          }
        });
        
        setNotifications(newNotifications);
        setNotificationError(null);
      },
      (error) => {
        console.error('Notification error:', error.message);
        setNotificationError(error.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.uid) return;
    
    const notificationRef = doc(db, 'users', user.uid, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    
    const promises = notifications
      .filter(n => !n.read)
      .map(notification => {
        const notificationRef = doc(db, 'users', user.uid, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
    
    await Promise.all(promises);
  };

  const handleAcceptMatch = async (notificationId: string, matchDetails: any) => {
    if (!user?.uid) return;

    try {
      console.log('Attempting to accept match:', { 
        notificationId, 
        matchDetails,
        userId: user.uid
      });

      // Ensure we have the correct dropId and matchId
      const dropId = matchDetails.dropId;
      
      // Try to extract the actual matchId from the available information
      const actualMatchId = [
        matchDetails.matchId,
        `${user.uid}_${matchDetails.matchedUserId}`,
        `${matchDetails.matchedUserId}_${user.uid}`
      ].find(id => id && id.length > 10);

      // Validate required fields
      if (!dropId) {
        console.error('Missing dropId in match details');
        toast({
          title: 'Match Accept Failed',
          description: 'Missing drop information',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        return;
      }

      // Construct a consistent matchId format
      const matchId = `${dropId}_${actualMatchId}`;

      // Use respondToMatch to handle the match response
      const success = await respondToMatch(dropId, matchId, 'accepted');

      if (success) {
        const notificationRef = doc(db, 'users', user.uid, 'notifications', notificationId);
        
        try {
          await updateDoc(notificationRef, {
            actionTaken: true,
            'matchDetails.status': 'accepted',
            read: true
          });
        } catch (notificationUpdateError) {
          console.error('Error updating notification:', notificationUpdateError);
        }

        toast({
          title: 'Match Accepted',
          description: `You've accepted the match with ${matchDetails.matchedUserName}!`,
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      } else {
        toast({
          title: 'Match Accept Failed',
          description: 'Unable to accept the match. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Error accepting match:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while accepting the match.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleDeclineMatch = async (notificationId: string, matchDetails: any) => {
    console.group('HomePage - handleDeclineMatch');
    console.log('1. Starting decline match flow:', {
      notificationId,
      matchDetails,
      userId: user?.uid,
      timestamp: new Date().toISOString()
    });

    if (!user?.uid) {
      console.error('No user ID found');
      console.groupEnd();
      return;
    }

    try {
      console.log('2. Calling respondToMatch');
      const success = await respondToMatch(
        matchDetails.dropId,
        `${matchDetails.dropId}_${user.uid}_${matchDetails.matchedUserId}`,
        'declined'
      );

      console.log('3. Response from respondToMatch:', {
        success,
        timestamp: new Date().toISOString()
      });

      if (success) {
        console.log('4. Updating notification status');
        const notificationRef = doc(db, 'users', user.uid, 'notifications', notificationId);
        await updateDoc(notificationRef, {
          actionTaken: true,
          'matchDetails.status': 'declined',
          read: true
        });

        console.log('5. Notification updated successfully');

        toast({
          title: 'Match Declined',
          description: 'You have declined this match.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.error('Match decline failed in respondToMatch');
        toast({
          title: 'Match Decline Failed',
          description: 'Unable to decline the match. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Error in handleDeclineMatch:', error);
      toast({
        title: 'Match Decline Error',
        description: `An unexpected error occurred. ${error instanceof Error ? error.message : 'Please try again.'}`,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
    console.groupEnd();
  };

  const createTestNotification = async () => {
    if (!user?.uid) return;

    try {
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      const newNotification = {
        type: 'match',
        title: 'New Match Found!',
        message: 'You have been matched with a test user',
        read: false,
        createdAt: Timestamp.now(),
        actionTaken: false,
        matchDetails: {
          matchedUserId: 'test-user-id',
          matchedUserName: 'Test User',
          dropId: 'test-drop-id',
          dropTitle: 'Test Drop',
          cuisineMatch: {
            preference: 'Japanese',
            recommendation: 'Sushi Restaurant'
          },
          status: 'pending',
          matchTime: Timestamp.now()
        }
      };

      await addDoc(notificationsRef, newNotification);
      console.log('Test notification created successfully');
      toast({
        title: 'Test Notification Created',
        description: 'A new test notification has been added to your notifications.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      
      toast({
        title: 'Error',
        description: `Failed to create test notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).createTestNotification = createTestNotification;
    }
  }, [user?.uid]);

  const goToAdmin = () => {
    navigate('/admin');
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
        
        <HStack spacing={4}>
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
          <NotificationBell
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onAcceptMatch={handleAcceptMatch}
            onDeclineMatch={handleDeclineMatch}
          />
          <Menu>
            <MenuButton
              as={Button}
              rounded={'full'}
              variant={'link'}
              cursor={'pointer'}
              minW={0}
            >
              <Avatar
                size={'sm'}
                src={currentUser?.photoURL || undefined}
                key={currentUser?.photoURL} // Force re-render when URL changes
              />
            </MenuButton>
            <MenuList alignItems={'center'}>
              <br />
              <Center>
                <Avatar
                  size={'2xl'}
                  src={currentUser?.photoURL || undefined}
                  key={currentUser?.photoURL} // Force re-render when URL changes
                />
              </Center>
              <br />
              <Center>
                <p>{user?.displayName}</p>
              </Center>
              <br />
              <MenuDivider />
              <MenuItem onClick={handleOpenProfileModal}>
                Profile Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                Sign Out
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={handleCloseProfileModal} 
        initialData={user}
      />

      {currentMatchNotification && (
        <MatchNotificationModal
          isOpen={!!currentMatchNotification}
          onClose={() => {
            // Mark notification as read if not explicitly accepted/declined
            if (currentMatchNotification) {
              handleMarkAsRead(currentMatchNotification.id);
            }
            setCurrentMatchNotification(null);
          }}
          notification={currentMatchNotification}
          onAcceptMatch={async (notificationId, matchDetails) => {
            await handleAcceptMatch(notificationId, matchDetails);
            setCurrentMatchNotification(null);
          }}
          onDeclineMatch={async (notificationId, matchDetails) => {
            await handleDeclineMatch(notificationId, matchDetails);
            setCurrentMatchNotification(null);
          }}
        />
      )}

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
      </Container>
    </Box>
  );
};

export default HomePage;
