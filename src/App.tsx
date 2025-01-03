import { useState, useEffect } from 'react'
import { Box, Button, Flex, Spinner, Center, useToast, Text } from '@chakra-ui/react'
import './App.css'
import { app, db, auth } from './firebase'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import Auth from './components/Auth'
import HomePage from './components/home/HomePage'
import ProfileCreation from './components/ProfileCreation'
import { UserProfile } from './types'

function App() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const fetchUserProfile = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const profileDoc = await getDoc(userRef);
      if (profileDoc.exists()) {
        setProfile(profileDoc.data() as UserProfile);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          console.log('User authenticated:', user.uid);
          setUser(user);
          const hasProfile = await fetchUserProfile(user.uid);
          if (!hasProfile) {
            console.log('No profile found for user');
          }
        } else {
          console.log('No user authenticated');
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError('Authentication error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleProfileComplete = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setError(null);
      toast({
        title: 'Signed out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Sign out error:', err);
      toast({
        title: 'Error signing out',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh">
        <Box textAlign="center">
          <Text color="red.500" fontSize="xl" mb={4}>{error}</Text>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      </Center>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <Flex justify="space-between" align="center" maxW="1200px" mx="auto" px={4}>
          <h1>Nectr</h1>
          {user && (
            <Button
              onClick={handleSignOut}
              colorScheme="blue"
              variant="outline"
              size="sm"
            >
              Sign Out
            </Button>
          )}
        </Flex>
      </header>
      
      <main className="main-content">
        {!user ? (
          <div className="auth-section">
            <Auth />
          </div>
        ) : !profile ? (
          <div className="profile-section">
            <ProfileCreation user={user} onComplete={handleProfileComplete} />
          </div>
        ) : (
          <HomePage user={profile} />
        )}
      </main>
    </div>
  );
}

export default App
