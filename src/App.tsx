import { useState, useEffect } from 'react'
import { Box, Center, Spinner, useToast } from '@chakra-ui/react'
import './App.css'
import { useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import HomePage from './components/home/HomePage'
import AdminDashboard from './components/admin/AdminDashboard'
import { Drop, UserProfile } from './types'
import { dropsCache } from './services/dropsService'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'

function App() {
  const { user, loading, error, logout } = useAuth();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [dropsLoading, setDropsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrops = async () => {
      try {
        setDropsLoading(true);
        const cachedDrops = await dropsCache.getDrops();
        setDrops(cachedDrops);
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
