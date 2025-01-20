import React from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  Divider,
  UnorderedList,
  ListItem,
  Link
} from '@chakra-ui/react';

const PrivacyPolicy: React.FC = () => {
  const sectionStyle = {
    mb: 6,
    lineHeight: 1.6,
  };

  return (
    <Box bg="gray.50" minHeight="100vh" py={16}>
      <Container maxW="container.xl" bg="white" p={10} boxShadow="md" borderRadius="lg">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" textAlign="center" color="blue.600" mb={8}>
            Nektr Privacy Policy
          </Heading>

          <Text fontSize="sm" color="gray.500" textAlign="center" mb={6}>
            Effective Date: January 2025
          </Text>

          {/* 1. Information We Collect */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              1. Information We Collect
            </Heading>
            <Text mb={4}>
              When you use Nektr, we may collect the following types of information:
            </Text>
            
            <Heading as="h3" size="md" mb={2} color="blue.400">
              Personal Information:
            </Heading>
            <UnorderedList pl={4} mb={4}>
              <ListItem>Name, email address, phone number, and other contact details when you sign up or contact us</ListItem>
              <ListItem>Profile information such as your preferences, interests, and location (if provided)</ListItem>
            </UnorderedList>

            <Heading as="h3" size="md" mb={2} color="blue.400">
              Usage Data:
            </Heading>
            <UnorderedList pl={4} mb={4}>
              <ListItem>Information on how you interact with our website, including pages visited, time spent, and features used</ListItem>
              <ListItem>Device information such as browser type, operating system, and IP address</ListItem>
            </UnorderedList>

            <Heading as="h3" size="md" mb={2} color="blue.400">
              Cookies and Tracking Technologies:
            </Heading>
            <Text>
              We use cookies, web beacons, and other tracking technologies to enhance user experience and analyze site traffic.
            </Text>
          </Box>

          <Divider />

          {/* 2. How We Use Your Information */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              2. How We Use Your Information
            </Heading>
            <Text mb={4}>
              We use the collected information to:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>Provide and personalize our services to match your preferences</ListItem>
              <ListItem>Improve our website functionality and user experience</ListItem>
              <ListItem>Communicate with you about updates, promotions, and important notices</ListItem>
              <ListItem>Monitor site security and prevent fraudulent activities</ListItem>
              <ListItem>Provide data to other restaurant providers and food institutes</ListItem>
              <ListItem>Comply with legal obligations and enforce our terms</ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          {/* 3. Sharing Your Information */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              3. Sharing Your Information
            </Heading>
            <Text mb={4}>
              We do not sell or rent your personal data. However, we may share your information with:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>
                <strong>Service Providers:</strong> Third-party vendors who help us operate and improve our services (e.g., hosting providers, analytics tools, payment processors)
              </ListItem>
              <ListItem>
                <strong>Restaurant Providers and Food Institutes:</strong> We may provide your data to partner restaurants and food service institutions to enhance your dining experience
              </ListItem>
              <ListItem>
                <strong>Legal Compliance:</strong> If required to comply with legal obligations, enforce our policies, or protect our rights
              </ListItem>
              <ListItem>
                <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of our company assets, your information may be transferred to the new entity
              </ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          {/* 4. Your Choices and Rights */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              4. Your Choices and Rights
            </Heading>
            <Text mb={4}>
              You have the right to:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>Access, update, or delete your personal information by contacting us</ListItem>
              <ListItem>Opt-out of marketing communications at any time</ListItem>
              <ListItem>Disable cookies via your browser settings, though this may impact website functionality</ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          {/* 5. Data Security */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              5. Data Security
            </Heading>
            <Text>
              We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </Text>
          </Box>

          <Divider />

          {/* 6. Third-Party Links */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              6. Third-Party Links
            </Heading>
            <Text>
              Our website may contain links to third-party sites. We are not responsible for their privacy practices, and we encourage you to review their privacy policies before providing any personal information.
            </Text>
          </Box>

          <Divider />

          {/* 7. Children's Privacy */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              7. Children's Privacy
            </Heading>
            <Text>
              Nektr is not intended for children under the age of 18. We do not knowingly collect personal information from children, and if we become aware of such data, we will take immediate steps to delete it.
            </Text>
          </Box>

          <Divider />

          {/* 8. Data Usage and Ownership */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              8. Data Usage and Ownership
            </Heading>
            <Text mb={4}>
              By using Nektr, you acknowledge and agree that:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>
                Any information, preferences, or content you submit through our platform, including but not limited to profile data, dining preferences, and interactions, may be used by Nektr to enhance your experience and improve our services
              </ListItem>
              <ListItem>
                Nektr reserves the right to analyze, aggregate, and share anonymized data with our partners, including restaurant providers and food institutions, to offer personalized experiences, insights, and promotions
              </ListItem>
              <ListItem>
                We may use submitted information to develop new features, conduct research, and better understand dining trends without further notice or compensation to you
              </ListItem>
              <ListItem>
                Your data will be handled in compliance with this Privacy Policy and applicable data protection laws, and any personally identifiable information will not be disclosed without your consent, except as outlined in this policy
              </ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          {/* 9. Changes to This Policy */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              9. Changes to This Policy
            </Heading>
            <Text>
              We may update this Privacy Policy from time to time to reflect changes in our practices. We will notify you of any significant changes by posting an updated version on our website.
            </Text>
          </Box>

          <Divider />

          {/* 10. Contact Us */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              10. Contact Us
            </Heading>
            <Text mb={2}>
              If you have any questions or concerns about this Privacy Policy, please contact us at:
            </Text>
            <Text>
              <strong>Email:</strong> <Link href="mailto:usenektr@gmail.com" color="blue.600">usenektr@gmail.com</Link>
            </Text>
          </Box>

          <Box textAlign="center" mt={8}>
            <Text fontWeight="bold" color="gray.600">
              By using our website, you agree to the terms of this Privacy Policy.
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
