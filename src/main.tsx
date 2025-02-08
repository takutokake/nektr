import React, { useLayoutEffect as reactUseLayoutEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import theme from './theme'

// Robust useLayoutEffect polyfill
const useLayoutEffect = typeof window !== 'undefined' 
  ? reactUseLayoutEffect 
  : React.useEffect;

// Patch React and global object
if (typeof window === 'undefined') {
  (React as any).useLayoutEffect = useLayoutEffect;
  global.React = {
    ...global.React,
    useLayoutEffect: useLayoutEffect
  };
}

// Patch use-callback-ref if possible
try {
  const useCallbackRef = require('use-callback-ref');
  if (useCallbackRef && typeof useCallbackRef.useLayoutEffect === 'undefined') {
    useCallbackRef.useLayoutEffect = useLayoutEffect;
  }
} catch (e) {
  console.warn('Could not patch use-callback-ref', e);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
)
