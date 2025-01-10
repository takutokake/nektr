import { extendTheme } from '@chakra-ui/react';

const colors = {
  brand: {
    50: '#FFF7E6',
    100: '#FFE9BF',
    200: '#FFDB99',
    300: '#FDCD73',
    400: '#FDBB4C',
    500: '#FDAA25', // Primary brand color
    600: '#E69200',
    700: '#B37300',
    800: '#805300',
    900: '#4D3200',
  },
};

const theme = extendTheme({
  colors,
});

export default theme;
