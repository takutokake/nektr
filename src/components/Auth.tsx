import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Divider,
  Container,
  Heading,
  FormErrorMessage,
  Flex,
} from '@chakra-ui/react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  AuthError,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleError = (error: AuthError) => {
    console.error('Auth error:', error);
    let message = 'An error occurred. Please try again.';
    
    switch (error.code) {
      case 'auth/invalid-email':
        message = 'Invalid email address format.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password.';
        break;
      case 'auth/email-already-in-use':
        message = 'An account already exists with this email.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your internet connection.';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in popup was closed before completion.';
        break;
      default:
        message = error.message;
    }

    setError(message);
    toast({
      title: 'Authentication Error',
      description: message,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Account created.',
          description: "You've successfully signed up!",
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Welcome back!',
          description: "You've successfully signed in!",
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      setEmail('');
      setPassword('');
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      toast({
        title: 'Welcome!',
        description: "You've successfully signed in with Google!",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex height="100vh" alignItems="center" justifyContent="center" bg="gray.50">
      <Container maxW="md">
        <Box bg="white" p={8} borderRadius="lg" boxShadow="lg" width="100%">
          <VStack spacing={6}>
            <Heading size="lg">{isSignUp ? 'Create Account' : 'Sign In'}</Heading>
            
            <VStack as="form" spacing={4} w="100%" onSubmit={handleEmailAuth}>
              <FormControl isRequired isInvalid={!!error}>
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your email"
                  size="lg"
                  isDisabled={isLoading}
                />
              </FormControl>

              <FormControl isRequired isInvalid={!!error}>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your password"
                  size="lg"
                  isDisabled={isLoading}
                />
                {error && <FormErrorMessage>{error}</FormErrorMessage>}
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={isLoading}
                loadingText={isSignUp ? 'Creating Account...' : 'Signing in...'}
              >
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
            </VStack>

            <Text>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Button
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                color="blue.500"
                isDisabled={isLoading}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Button>
            </Text>

            <Divider />

            <Button
              width="full"
              onClick={handleGoogleAuth}
              size="lg"
              isLoading={isLoading}
              loadingText="Signing in with Google..."
              leftIcon={
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  style={{ width: '18px', height: '18px' }}
                />
              }
            >
              Continue with Google
            </Button>
          </VStack>
        </Box>
      </Container>
    </Flex>
  );
}
