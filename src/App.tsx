import { useState, useEffect } from 'react'
import { Box, Center, Spinner, useToast } from '@chakra-ui/react'
import './App.css'
import { useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import HomePage from './components/home/HomePage'
import AdminDashboard from './components/admin/AdminDashboard'
import ProfileCreation from './components/ProfileCreation'
import { Drop, UserProfile } from './types'
import { dropsService } from './services/dropsService'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { User } from 'firebase/auth';

function App() {
  const { user, loading, error, logout } = useAuth();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [dropsLoading, setDropsLoading] = useState(false);
  const [hasMoreDrops, setHasMoreDrops] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrops = async () => {
      try {
        setDropsLoading(true);
        const { drops, hasMore } = await dropsService.getDrops();
        setDrops((prevDrops) => [...prevDrops, ...drops]);
        setHasMoreDrops(hasMore);
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
        setDropsLoading(false);
      }
    };

    if (user) {
      fetchDrops();
    }
  }, [user?.uid, toast]);

  const handleLogout = async () => {
    try {
      await logout?.();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!user) {
    return <Auth />;
  }

  // Check if user needs to complete profile
  if (!userProfile || !userProfile.displayName || userProfile.interests.length === 0) {
    return <ProfileCreation 
      user={user} 
      onComplete={() => {
        fetchUserProfile();
        // Optionally, you can add navigation or other logic here
      }} 
    />;
  }

  return (
    <Box minH="100vh">
      {user.isAdmin && !user.tempDisableAdmin ? (
        <AdminDashboard />
      ) : (
        <HomePage 
          user={user}
          drops={drops}
          onSignOut={handleLogout}
        />
      )}
    </Box>
  );
}

export default App;
