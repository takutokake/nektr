import { useState, useEffect } from 'react'
import { Box, Spinner, Center, useToast } from '@chakra-ui/react'
import './App.css'
import { useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import HomePage from './components/home/HomePage'
import ProfileCreation from './components/ProfileCreation'
import { Drop } from './types'
import { dropsCache } from './services/dropsService'
import { auth } from './firebase'

function App() {
  console.log('App rendering');
  const { user, loading, error, logout } = useAuth();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [dropsLoading, setDropsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchDrops = async () => {
      if (!user?.uid) return;
      
      try {
        setDropsLoading(true);
        const upcomingDrops = await dropsCache.getUpcomingDrops(user.uid);
        setDrops(upcomingDrops);
      } catch (err) {
        console.error('Error fetching drops:', err);
        toast({
          title: 'Error',
          description: 'Failed to load upcoming drops',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setDropsLoading(false);
      }
    };

    if (user) {
      fetchDrops();
    }
  }, [user?.uid, toast]);

  const handleSignOut = async () => {
    try {
      await logout();
      dropsCache.clearAllCache();
      toast({
        title: 'Success',
        description: 'You have been signed out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Sign out error:', err);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Show loading spinner while authentication is being checked
  if (loading) {
    console.log('Auth loading...');
    return (
      <Center h="100vh">
        <Spinner size="xl" color="pink.500" thickness="4px" />
      </Center>
    );
  }

  // Show error toast if there's an error
  if (error) {
    console.log('Auth error:', error);
    toast({
      title: 'Error',
      description: error,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }

  // Show auth screen if no user
  if (!user) {
    console.log('No user, showing auth screen');
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Auth />
      </Box>
    );
  }

  // Check if user has completed their profile
  const isProfileComplete = Boolean(
    user.displayName && 
    user.location && 
    user.priceRange && 
    user.interests?.length > 0 && 
    user.cuisinePreferences?.length > 0
  );

  // Show profile creation if profile is not complete
  if (!isProfileComplete && auth.currentUser) {
    console.log('Profile incomplete, showing creation screen');
    return <ProfileCreation user={auth.currentUser} onComplete={() => window.location.reload()} />;
  }

  // Show homepage if everything is ready
  console.log('Showing homepage with drops:', drops.length);
  return (
    <Box>
      <HomePage 
        user={user} 
        drops={drops}
        onSignOut={handleSignOut}
      />
    </Box>
  );
}

export default App;
