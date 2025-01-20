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

const TermsOfService: React.FC = () => {
  const sectionStyle = {
    mb: 6,
    lineHeight: 1.6,
  };

  return (
    <Box bg="gray.50" minHeight="100vh" py={16}>
      <Container maxW="container.xl" bg="white" p={10} boxShadow="md" borderRadius="lg">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" textAlign="center" color="blue.600" mb={8}>
            Nektr Terms of Service
          </Heading>

          <Text fontSize="sm" color="gray.500" textAlign="center" mb={6}>
            Effective Date: January 2025
          </Text>

          {/* 1. Acceptance of Terms */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              1. Acceptance of Terms
            </Heading>
            <Text>
              By creating an account or using Nektr, you agree to these Terms, our Privacy Policy, and any additional terms and policies referenced herein. If you do not agree to these Terms, you must not access or use our services.
            </Text>
          </Box>

          <Divider />

          {/* 2. Eligibility */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              2. Eligibility
            </Heading>
            <Text mb={4}>
              To use Nektr, you must:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>Be at least 18 years old</ListItem>
              <ListItem>Provide accurate and complete registration information</ListItem>
              <ListItem>Comply with all applicable laws and regulations</ListItem>
              <ListItem>Not have been previously suspended or removed from our platform</ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          {/* 3. Description of Services */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              3. Description of Services
            </Heading>
            <Text mb={4}>
              Nektr is a social dining platform that connects college students through shared meals. Our services include but are not limited to:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>Meal-matching based on preferences and interests</ListItem>
              <ListItem>Event and dining coordination features</ListItem>
              <ListItem>Communication tools to facilitate connections</ListItem>
            </UnorderedList>
            <Text mt={4}>
              We reserve the right to modify or discontinue any part of our services without prior notice.
            </Text>
          </Box>

          <Divider />

          {/* 4. User Accounts and Responsibilities */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              4. User Accounts and Responsibilities
            </Heading>
            <Text mb={4}>
              When you create an account, you are responsible for:
            </Text>
            <UnorderedList pl={4} mb={4}>
              <ListItem>Maintaining the confidentiality of your login credentials</ListItem>
              <ListItem>All activities that occur under your account</ListItem>
              <ListItem>Providing accurate and up-to-date information</ListItem>
            </UnorderedList>
            
            <Text mb={4}>
              You agree not to:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>Use false information or impersonate others</ListItem>
              <ListItem>Share your account credentials with others</ListItem>
              <ListItem>Engage in any illegal, abusive, or harmful activities</ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          {/* 5. Data Collection and Use */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              5. Data Collection and Use
            </Heading>
            <Text mb={4}>
              By using Nektr, you acknowledge and consent that:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>We collect and use your data as described in our Privacy Policy</ListItem>
              <ListItem>Your information may be shared with restaurant providers and food institutions to enhance your dining experience</ListItem>
              <ListItem>We reserve the right to analyze and aggregate anonymized data for business insights and improvements</ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          {/* 6. Acceptable Use Policy */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              6. Acceptable Use Policy
            </Heading>
            <Text mb={4}>
              You agree to use Nektr in compliance with all applicable laws and our community guidelines. Prohibited activities include, but are not limited to:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>Posting or sharing offensive, abusive, or discriminatory content</ListItem>
              <ListItem>Harassing or impersonating other users</ListItem>
              <ListItem>Attempting to access unauthorized areas of our platform</ListItem>
              <ListItem>Using the service for any commercial purpose without our consent</ListItem>
            </UnorderedList>
            <Text mt={4}>
              We reserve the right to suspend or terminate your account for any violations of these rules.
            </Text>
          </Box>

          <Divider />

          {/* 7. Payment and Fees */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              7. Payment and Fees
            </Heading>
            <Text mb={4}>
              Some of our services may require payment. By making a purchase, you agree that:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>All fees are non-refundable unless otherwise stated</ListItem>
              <ListItem>Payment details must be accurate and up to date</ListItem>
              <ListItem>We reserve the right to modify pricing at any time</ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          {/* 8. Termination and Suspension */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              8. Termination and Suspension
            </Heading>
            <Text>
              We reserve the right to suspend or terminate your account without notice if we believe you have violated these Terms or engaged in activities that harm the platform or its users.
            </Text>
            <Text mt={4}>
              You may terminate your account at any time by contacting our support team.
            </Text>
          </Box>

          <Divider />

          {/* 9. Limitation of Liability */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              9. Limitation of Liability
            </Heading>
            <Text mb={4}>
              To the fullest extent permitted by law, Nektr and its affiliates shall not be liable for:
            </Text>
            <UnorderedList pl={4}>
              <ListItem>Any indirect, incidental, or consequential damages arising from your use of our services</ListItem>
              <ListItem>Any loss of data, revenue, or business opportunities</ListItem>
              <ListItem>Any third-party conduct or content accessed through our platform</ListItem>
              <ListItem>Any incidents, interactions, or occurrences that take place during or as a result of meetups arranged through Nektr</ListItem>
            </UnorderedList>
            <Text mt={4}>
              Users acknowledge that they participate in such meetups at their own risk and Nektr assumes no liability for any consequences arising from them.
            </Text>
          </Box>

          <Divider />

          {/* 10. Indemnification */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              10. Indemnification
            </Heading>
            <Text>
              You agree to indemnify and hold harmless Nektr, its affiliates, officers, and employees from any claims, liabilities, damages, losses, or expenses arising from your use of our services or your violation of these Terms.
            </Text>
          </Box>

          <Divider />

          {/* 11. Intellectual Property */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              11. Intellectual Property
            </Heading>
            <Text>
              All content, logos, trademarks, and proprietary materials provided by Nektr are owned by us or licensed to us. You may not use, reproduce, or distribute any content without our written consent.
            </Text>
          </Box>

          <Divider />

          {/* 12. Modifications to Terms */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              12. Modifications to Terms
            </Heading>
            <Text>
              We reserve the right to update or modify these Terms at any time. We will notify users of significant changes via email or by posting an updated version on our website. Continued use of the services constitutes acceptance of the revised Terms.
            </Text>
          </Box>

          <Divider />

          {/* 13. Governing Law */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              13. Governing Law
            </Heading>
            <Text>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, United States. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in the State of California, United States.
            </Text>
          </Box>

          <Divider />

          {/* 14. Contact Us */}
          <Box {...sectionStyle}>
            <Heading as="h2" size="lg" mb={4} color="blue.500">
              14. Contact Us
            </Heading>
            <Text mb={4}>
              If you have any questions or concerns about these Terms, please contact us at:
            </Text>
            <Text>
              <strong>Email:</strong> <Link href="mailto:usenektr@gmail.com" color="blue.600">usenektr@gmail.com</Link>
            </Text>
          </Box>

          <Box textAlign="center" mt={8}>
            <Text fontWeight="bold" color="gray.600">
              By using Nektr, you acknowledge that you have read, understood, and agreed to these Terms of Service.
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default TermsOfService;
