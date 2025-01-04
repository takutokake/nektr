import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  VStack, 
  Heading, 
  Text, 
  useToast,
  Flex,
  Divider,
  extendTheme,
  ChakraProvider
} from '@chakra-ui/react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  AuthError 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// Custom theme with the new color
const theme = extendTheme({
  colors: {
    brand: {
      50: '#FFF5E6',
      100: '#FFE6B8',
      200: '#FFD780',
      300: '#FDAA25',
      400: '#E69422',
      500: '#FDAA25',
      600: '#CC8A1F',
      700: '#B3701A',
      800: '#995614',
      900: '#803C0F'
    }
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600'
          }
        }
      }
    }
  }
});

interface AuthProps {
  onAuthSuccess?: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess = () => {} }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const toast = useToast();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      onAuthSuccess(userCredential.user);
      toast({
        title: 'Account created',
        description: "You've successfully signed up!",
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (e: unknown) {
      const error = e as AuthError;
      toast({
        title: 'Sign Up Error',
        description: error.message || 'Failed to create account',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onAuthSuccess(userCredential.user);
      toast({
        title: 'Signed In',
        description: "You've successfully logged in!",
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (e: unknown) {
      const error = e as AuthError;
      toast({
        title: 'Sign In Error',
        description: error.message || 'Failed to sign in',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onAuthSuccess(result.user);
      toast({
        title: 'Google Sign In',
        description: "Successfully signed in with Google!",
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (e: unknown) {
      const error = e as AuthError;
      console.error('Google Sign-In Error:', error);
      
      // Specific error handling for unauthorized domain
      if (error.code === 'auth/unauthorized-domain') {
        toast({
          title: 'Authentication Error',
          description: 'Unauthorized domain. Please add your domain to Firebase authorized domains.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Google Sign In Error',
          description: error.message || 'Failed to sign in with Google',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Flex 
        height="100vh" 
        alignItems="center" 
        justifyContent="center" 
        bg="gray.50"
      >
        <Box 
          bg="white" 
          p={8} 
          borderRadius="xl" 
          boxShadow="lg"
          width="100%"
          maxWidth="400px"
        >
          <VStack spacing={6} align="stretch">
            <Heading 
              textAlign="center" 
              color="brand.500" 
              mb={4}
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Heading>

            <form onSubmit={isLogin ? handleEmailSignIn : handleEmailSignUp}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </FormControl>

                <Button 
                  colorScheme="brand" 
                  type="submit" 
                  width="full" 
                  mt={4}
                >
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Button>
              </VStack>
            </form>

            <Divider my={4} />

            <Button 
              colorScheme="red" 
              variant="outline" 
              width="full"
              onClick={handleGoogleSignIn}
              leftIcon={
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google logo" 
                  style={{ width: '20px', height: '20px', marginRight: '8px' }} 
                />
              }
            >
              Sign in with Google
            </Button>

            <Text 
              textAlign="center" 
              color="gray.600" 
              cursor="pointer"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin 
                ? "Don't have an account? Sign Up" 
                : "Already have an account? Sign In"}
            </Text>
          </VStack>
        </Box>
      </Flex>
    </ChakraProvider>
  );
};

export default Auth;
