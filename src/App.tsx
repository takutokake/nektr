import { useState, useEffect } from 'react'
import { Box, Center, Spinner, useToast } from '@chakra-ui/react'
import './App.css'
import { useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import HomePage from './components/home/HomePage'
import AdminDashboard from './components/admin/AdminDashboard'
import ProfileCreation from './components/ProfileCreation'
import LandingPage from './pages/LandingPage'  
import PrivacyPolicy from './pages/PrivacyPolicy' 
import TermsOfService from './pages/TermsOfService'
import { Drop, UserProfile } from './types'
import { dropsService } from './services/dropsService'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { User } from 'firebase/auth';
import { useAnalytics } from './hooks/useAnalytics';

function App() {
  const { user, loading, error, logout } = useAuth();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [dropsLoading, setDropsLoading] = useState(false);
  const [hasMoreDrops, setHasMoreDrops] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const analytics = useAnalytics(); // Move hook to top level

  useEffect(() => {
    const fetchDrops = async () => {
      try {
        setDropsLoading(true);
        const { drops, hasMore } = await dropsService.getDrops();
        setDrops((prevDrops) => [...prevDrops, ...drops]);
        setHasMoreDrops(hasMore);
      } catch (error) {
        console.error('Error fetching drops:', error);
      } finally {
        setDropsLoading(false);
      }
    };

    if (user) {
      fetchDrops();
    }
  }, [user?.uid]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout?.();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
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
    return <div>Error: {error.message}</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/privacy" element={<PrivacyPolicy />} /> 
      <Route path="/terms" element={<TermsOfService />} /> 

      {/* Protected Routes */}
      {user ? (
        <>
          <Route path="/home" element={
            (!userProfile || !userProfile.displayName || userProfile.interests.length === 0) ? (
              <ProfileCreation 
                user={user} 
                onComplete={() => {
                  const fetchUserProfile = async () => {
                    if (user?.uid) {
                      const userDocRef = doc(db, 'users', user.uid);
                      const userDocSnap = await getDoc(userDocRef);
                      if (userDocSnap.exists()) {
                        setUserProfile(userDocSnap.data() as UserProfile);
                      }
                    }
                  };
                  fetchUserProfile();
                  navigate('/home');
                }} 
              />
            ) : (
              <HomePage 
                user={user}
                drops={drops}
                onSignOut={handleLogout}
              />
            )
          } />
          
          {/* Admin Route */}
          <Route 
            path="/admin" 
            element={
              user.isAdmin && !user.tempDisableAdmin ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/home" replace />
              )
            } 
          />
          
          {/* Redirect unknown routes to home when authenticated */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </>
      ) : (
        // Redirect to auth if trying to access protected routes
        <Route path="*" element={<Navigate to="/auth" replace />} />
      )}
    </Routes>
  );
}

export default App;
