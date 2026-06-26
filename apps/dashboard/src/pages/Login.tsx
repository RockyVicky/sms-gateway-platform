import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, TextField, Button, Typography, Alert } from '@mui/material';
import { API_URL } from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('jwt_token', data.access_token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Is the backend API server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#121212',
        px: 2,
      }}
    >
      <Card
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          bgcolor: '#1c1c1e',
          color: '#fff',
          borderRadius: 4,
          border: '1px solid #2c2c2e',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#007aff', letterSpacing: 0.5 }}>
            SMS Gateway
          </Typography>
          <Typography variant="body2" sx={{ color: '#8e8e93', mt: 1 }}>
            Sign in to your administration dashboard
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
            sx={{
              '& label': { color: '#8e8e93' },
              '& label.Mui-focused': { color: '#007aff' },
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#2c2c2e' },
                '&:hover fieldset': { borderColor: '#8e8e93' },
                '&.Mui-focused fieldset': { borderColor: '#007aff' },
              },
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            margin="normal"
            sx={{
              '& label': { color: '#8e8e93' },
              '& label.Mui-focused': { color: '#007aff' },
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#2c2c2e' },
                '&:hover fieldset': { borderColor: '#8e8e93' },
                '&.Mui-focused fieldset': { borderColor: '#007aff' },
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.5,
              bgcolor: '#007aff',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: '#0062cc' },
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </Box>
  );
}
