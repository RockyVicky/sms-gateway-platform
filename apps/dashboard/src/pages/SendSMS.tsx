import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  FormHelperText,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { API_URL } from '../config';

const fetchDevicesList = async () => {
  const token = localStorage.getItem('jwt_token');
  const response = await fetch(`${API_URL}/api/devices`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch devices');
  }
  return response.json();
};

interface SendSmsParams {
  deviceId: string;
  recipients: string[];
  content: string;
  isBulk: boolean;
}

const sendSmsRequest = async ({ deviceId, recipients, content, isBulk }: SendSmsParams) => {
  const token = localStorage.getItem('jwt_token');
  const endpoint = isBulk ? '/api/sms/send-bulk' : '/api/sms/send';
  const body = isBulk
    ? { deviceId, recipients, content }
    : { deviceId, recipient: recipients[0], content };

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to dispatch messages');
  }
  return response.json();
};

export default function SendSMS() {
  const [sendType, setSendType] = useState<'single' | 'bulk'>('single');
  const [deviceId, setDeviceId] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [content, setContent] = useState('');
  const [successResult, setSuccessResult] = useState<any>(null);

  const { data: devices, isLoading: loadingDevices, error: devicesError } = useQuery({
    queryKey: ['devicesList'],
    queryFn: fetchDevicesList,
  });

  const mutation = useMutation({
    mutationFn: sendSmsRequest,
    onSuccess: (data) => {
      setSuccessResult(data);
      setRecipientInput('');
      setContent('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessResult(null);

    if (!deviceId) return;
    if (!recipientInput.trim()) return;
    if (!content.trim()) return;

    // Process recipients
    const recipientsList =
      sendType === 'bulk'
        ? recipientInput
            .split(/[\n,]+/)
            .map((r) => r.trim())
            .filter((r) => r.length > 0)
        : [recipientInput.trim()];

    mutation.mutate({
      deviceId,
      recipients: recipientsList,
      content,
      isBulk: sendType === 'bulk',
    });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#fff' }}>
        Compose SMS
      </Typography>

      <Card sx={{ bgcolor: '#1c1c1e', border: '1px solid #2c2c2e', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to send messages.'}
            </Alert>
          )}

          {successResult && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {sendType === 'bulk' ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Bulk SMS queued successfully!
                  </Typography>
                  <Typography variant="body2">
                    Enqueued Count: {successResult.enqueuedCount} | Errors: {successResult.errors.length}
                  </Typography>
                  {successResult.errors.length > 0 && (
                    <Box sx={{ mt: 1, pl: 2, fontSize: '0.8rem' }}>
                      {successResult.errors.map((err: string, idx: number) => (
                        <div key={idx} style={{ color: '#ff3b30' }}>• {err}</div>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                'Single SMS enqueued successfully!'
              )}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                row
                value={sendType}
                onChange={(e) => {
                  setSendType(e.target.value as 'single' | 'bulk');
                  setRecipientInput('');
                  setSuccessResult(null);
                }}
              >
                <FormControlLabel
                  value="single"
                  control={<Radio color="primary" />}
                  label="Single Recipient"
                  sx={{ color: '#aeaeb2', '&.Mui-checked': { color: '#007aff' } }}
                />
                <FormControlLabel
                  value="bulk"
                  control={<Radio color="primary" />}
                  label="Bulk Recipients"
                  sx={{ color: '#aeaeb2' }}
                />
              </RadioGroup>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }} required error={!!devicesError}>
              <InputLabel id="device-select-label" sx={{ color: '#8e8e93' }}>Target Gateway Device</InputLabel>
              <Select
                labelId="device-select-label"
                value={deviceId}
                label="Target Gateway Device"
                onChange={(e) => setDeviceId(e.target.value)}
                sx={{
                  bgcolor: '#2c2c2e',
                  color: '#fff',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3a3a3c' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5a5a5c' },
                }}
              >
                {loadingDevices ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 2 }} /> Loading devices...
                  </MenuItem>
                ) : devicesError ? (
                  <MenuItem disabled>Failed to load gateway devices</MenuItem>
                ) : devices && devices.length === 0 ? (
                  <MenuItem disabled>No registered devices online</MenuItem>
                ) : (
                  devices?.map((dev: any) => (
                    <MenuItem key={dev.deviceId} value={dev.deviceId}>
                      {dev.name} ({dev.phoneNumber}) - {dev.status === 'online' ? 'Online' : 'Offline'}
                    </MenuItem>
                  ))
                )}
              </Select>
              {devicesError && <FormHelperText>Check server database connection.</FormHelperText>}
            </FormControl>

            <TextField
              fullWidth
              required
              label={sendType === 'bulk' ? "Recipients (Comma-separated or line-separated)" : "Recipient Phone Number"}
              placeholder={sendType === 'bulk' ? "+916382289712, +919876543210" : "e.g. +916382289712"}
              multiline={sendType === 'bulk'}
              rows={sendType === 'bulk' ? 4 : 1}
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              variant="outlined"
              sx={{
                mb: 3,
                '& .MuiInputLabel-root': { color: '#8e8e93' },
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#2c2c2e',
                  color: '#fff',
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#3a3a3c' },
                  '&:hover fieldset': { borderColor: '#5a5a5c' },
                },
              }}
            />

            <TextField
              fullWidth
              required
              label="Message Content"
              placeholder="Type your message text here..."
              multiline
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="outlined"
              sx={{
                mb: 4,
                '& .MuiInputLabel-root': { color: '#8e8e93' },
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#2c2c2e',
                  color: '#fff',
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#3a3a3c' },
                  '&:hover fieldset': { borderColor: '#5a5a5c' },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={mutation.isPending || !deviceId || !recipientInput || !content}
              startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{
                py: 1.8,
                borderRadius: 2,
                fontSize: '16px',
                fontWeight: 600,
                bgcolor: '#007aff',
                '&:hover': { bgcolor: '#0062cc' },
              }}
            >
              {mutation.isPending ? 'Queuing Messages...' : sendType === 'bulk' ? 'Send Bulk Broadcast' : 'Send Message'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
