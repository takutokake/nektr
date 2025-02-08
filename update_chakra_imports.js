const fs = require('fs');
const path = require('path');

const componentMappings = {
  // Stack and Layout Components
  'HStack': '@chakra-ui/react/dist/components/stack',
  'VStack': '@chakra-ui/react/dist/components/stack',
  'Stack': '@chakra-ui/react/dist/components/stack',
  
  // Table Components
  'Table': '@chakra-ui/react/dist/components/table',
  'Thead': '@chakra-ui/react/dist/components/table',
  'Tbody': '@chakra-ui/react/dist/components/table',
  'Tr': '@chakra-ui/react/dist/components/table',
  'Th': '@chakra-ui/react/dist/components/table',
  'Td': '@chakra-ui/react/dist/components/table',
  'TableContainer': '@chakra-ui/react/dist/components/table',
  
  // Form Components
  'FormControl': '@chakra-ui/react/dist/components/form-control',
  'FormLabel': '@chakra-ui/react/dist/components/form-control',
  'Select': '@chakra-ui/react/dist/components/select',
  'NumberInput': '@chakra-ui/react/dist/components/number-input',
  'NumberInputField': '@chakra-ui/react/dist/components/number-input',
  'NumberInputStepper': '@chakra-ui/react/dist/components/number-input',
  'NumberIncrementStepper': '@chakra-ui/react/dist/components/number-input',
  'NumberDecrementStepper': '@chakra-ui/react/dist/components/number-input',
  
  // Tabs Components
  'Tabs': '@chakra-ui/react/dist/components/tabs',
  'TabList': '@chakra-ui/react/dist/components/tabs',
  'TabPanels': '@chakra-ui/react/dist/components/tabs',
  'Tab': '@chakra-ui/react/dist/components/tabs',
  'TabPanel': '@chakra-ui/react/dist/components/tabs',
  
  // Accordion Components
  'Accordion': '@chakra-ui/react/dist/components/accordion',
  'AccordionItem': '@chakra-ui/react/dist/components/accordion',
  'AccordionButton': '@chakra-ui/react/dist/components/accordion',
  'AccordionPanel': '@chakra-ui/react/dist/components/accordion',
  'AccordionIcon': '@chakra-ui/react/dist/components/accordion',
  
  // Other Components
  'Switch': '@chakra-ui/react/dist/components/switch',
  'Alert': '@chakra-ui/react/dist/components/alert',
  'AlertIcon': '@chakra-ui/react/dist/components/alert',
  'Divider': '@chakra-ui/react/dist/components/divider',
  'UnorderedList': '@chakra-ui/react/dist/components/list',
};

const hookMappings = {
  'useToast': '@chakra-ui/react/dist/hooks/use-toast',
  'useColorModeValue': '@chakra-ui/react/dist/hooks/use-color-mode',
};

function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update component imports
  Object.entries(componentMappings).forEach(([component, newPath]) => {
    const importRegex = new RegExp(`import\\s+{[^}]*${component}[^}]*}\\s+from\\s+['"]@chakra-ui/react['"]`, 'g');
    content = content.replace(importRegex, `import { ${component} } from '${newPath}'`);
  });
  
  // Update hook imports
  Object.entries(hookMappings).forEach(([hook, newPath]) => {
    const importRegex = new RegExp(`import\\s+{[^}]*${hook}[^}]*}\\s+from\\s+['"]@chakra-ui/react['"]`, 'g');
    content = content.replace(importRegex, `import { ${hook} } from '${newPath}'`);
  });
  
  // Update remaining @chakra-ui/react imports
  content = content.replace(
    /import\s+{([^}]+)}\s+from\s+['"]@chakra-ui\/react['"]/g, 
    (match, imports) => {
      const remainingImports = imports.split(',')
        .map(imp => imp.trim())
        .filter(imp => 
          !componentMappings[imp] && 
          !hookMappings[imp] && 
          imp !== '' && 
          imp !== 'Box' && 
          imp !== 'Center' && 
          imp !== 'Spinner'
        );
      
      return remainingImports.length > 0 
        ? `import { ${remainingImports.join(', ')} } from '@chakra-ui/react'`
        : '';
    }
  );
  
  // Remove duplicate or empty imports
  content = content.replace(/import\s+{}\s+from\s+['"][^'"]+['"];?\n/g, '');
  content = content.replace(/import\s+{[^}]*}\s+from\s+['"]@chakra-ui\/react['"];?\n/g, '');
  
  fs.writeFileSync(filePath, content);
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      traverseDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      try {
        updateImports(fullPath);
        console.log(`Updated imports in ${fullPath}`);
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error);
      }
    }
  });
}

const projectRoot = '/Users/takuto/Documents/my-react-app/src';
traverseDirectory(projectRoot);
console.log('Import update complete!');
