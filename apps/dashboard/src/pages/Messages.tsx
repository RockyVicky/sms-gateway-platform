import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material';
import { API_URL } from '../config';

const fetchMessages = async () => {
  const token = localStorage.getItem('jwt_token');
  const response = await fetch(`${API_URL}/api/sms/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch message logs');
  }
  return response.json();
};

export default function Messages() {
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['messagesList'],
    queryFn: fetchMessages,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#007aff' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: 'rgba(255,59,48,0.1)', color: '#ff3b30', borderRadius: 3 }}>
        <Typography variant="h6">Failed to load message history</Typography>
        <Typography variant="body2">{error instanceof Error ? error.message : 'Please check connection'}</Typography>
      </Box>
    );
  }

  const getStatusChip = (status: string) => {
    let color = '#8e8e93';
    let bgcolor = 'rgba(142,142,147,0.15)';

    if (status === 'sent' || status === 'delivered') {
      color = '#34c759';
      bgcolor = 'rgba(52,199,89,0.15)';
    } else if (status === 'failed') {
      color = '#ff3b30';
      bgcolor = 'rgba(255,59,48,0.15)';
    } else if (status === 'processing') {
      color = '#007aff';
      bgcolor = 'rgba(0,122,255,0.15)';
    } else if (status === 'queued') {
      color = '#ff9500';
      bgcolor = 'rgba(255,149,0,0.15)';
    }

    return (
      <Chip
        label={status}
        size="small"
        sx={{
          bgcolor,
          color,
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: '11px',
          letterSpacing: 0.5,
        }}
      />
    );
  };

  return (
    <Box>
      <Card sx={{ bgcolor: '#1c1c1e', color: '#fff', border: '1px solid #2c2c2e', borderRadius: 3, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          SMS Outbox Audit Trail
        </Typography>

        {messages?.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: '#8e8e93' }}>
            <Typography variant="body1">No messages dispatched yet.</Typography>
            <Typography variant="caption">Send a POST request to /api/sms/send to trigger a dispatch.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ '& th': { color: '#aeaeb2', borderBottom: '1px solid #2c2c2e', fontWeight: 600 } }}>
                <TableRow>
                  <TableCell>Message ID</TableCell>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Content</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Device ID</TableCell>
                  <TableCell>Attempts</TableCell>
                  <TableCell>Error Message</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ '& td': { color: '#fff', borderBottom: '1px solid #2c2c2e' } }}>
                {messages.map((message: any) => (
                  <TableRow key={message._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px' }}>{message._id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{message.recipient}</TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {message.content}
                    </TableCell>
                    <TableCell>{getStatusChip(message.status)}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px', color: '#aeaeb2' }}>
                      {message.deviceId || 'Auto-routed'}
                    </TableCell>
                    <TableCell>{message.attempts} / {message.maxAttempts}</TableCell>
                    <TableCell sx={{ color: '#ff3b30', fontSize: '13px' }}>
                      {message.errorMessage || '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#8e8e93', fontSize: '13px' }}>
                      {new Date(message.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
