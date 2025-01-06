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
  const [isLoading, setIsLoading] = useState(false);
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
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting login with email');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onAuthSuccess(userCredential.user);
      console.log('Login successful');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Sign In Error',
        description: error.message || 'Failed to sign in',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
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
        minHeight="100vh" 
        alignItems="center" 
        justifyContent="center" 
        bg="white" 
        p={[4, 6, 8]}
      >
        <Box 
          bg="white" 
          p={[8, 10, 12]} 
          borderRadius="2xl" 
          boxShadow="lg"
          width={["90%", "80%", "auto"]} 
          minWidth={["auto", "auto", "500px"]} 
          maxWidth="600px"
        >
          <VStack spacing={8} align="stretch">
            <Heading 
              textAlign="center" 
              color="#FDAA25" 
              fontSize={["2xl", "3xl"]} 
              fontWeight="600"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Heading>

            <form onSubmit={isLogin ? handleEmailSignIn : handleEmailSignUp}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel color="gray.700">Email</FormLabel>
                  <Input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    size="lg"
                    height="56px" 
                    bg="gray.50"
                    borderColor="gray.200"
                    borderRadius="md"
                    _placeholder={{ color: 'gray.400' }}
                    _hover={{
                      borderColor: "#FDAA25"
                    }}
                    _focus={{
                      borderColor: "#FDAA25",
                      boxShadow: "0 0 0 1px #FDAA25"
                    }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="gray.700">Password</FormLabel>
                  <Input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    size="lg"
                    height="56px" 
                    bg="gray.50"
                    borderColor="gray.200"
                    borderRadius="md"
                    _placeholder={{ color: 'gray.400' }}
                    _hover={{
                      borderColor: "#FDAA25"
                    }}
                    _focus={{
                      borderColor: "#FDAA25",
                      boxShadow: "0 0 0 1px #FDAA25"
                    }}
                  />
                </FormControl>

                <Button 
                  bg="#FDAA25"
                  color="white"
                  type="submit" 
                  width="full" 
                  mt={4}
                  height="56px" 
                  fontSize="lg"
                  fontWeight="600"
                  isLoading={isLoading}
                  _hover={{
                    bg: "#E69422"
                  }}
                  borderRadius="md"
                >
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Button>
              </VStack>
            </form>

            <Divider borderColor="gray.200" />

            <Button 
              variant="outline" 
              width="full"
              height="56px" 
              fontSize="lg"
              onClick={handleGoogleSignIn}
              borderColor="gray.300"
              color="gray.700"
              leftIcon={
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google logo" 
                  style={{ width: '24px', height: '24px' }} 
                />
              }
              _hover={{
                bg: "gray.50",
                borderColor: "gray.400"
              }}
              borderRadius="md"
            >
              Sign in with Google
            </Button>

            <Text 
              textAlign="center" 
              color="gray.600" 
              fontSize="md"
              cursor="pointer"
              onClick={() => setIsLogin(!isLogin)}
              _hover={{
                color: "#FDAA25"
              }}
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
