import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Messages from './pages/Messages';
import SendSMS from './pages/SendSMS';

// Configure React Query Client
const queryClient = new QueryClient();

// Configure Material UI Dark Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1c1c1e',
    },
    primary: {
      main: '#007aff',
    },
    success: {
      main: '#34c759',
    },
    error: {
      main: '#ff3b30',
    },
    warning: {
      main: '#ff9500',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});

// Guard component to verify JWT session
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('jwt_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public auth route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes wrapped in Layout */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="devices" element={<Devices />} />
              <Route path="messages" element={<Messages />} />
              <Route path="compose" element={<SendSMS />} />
            </Route>

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
