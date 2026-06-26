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
  LinearProgress,
} from '@mui/material';
import { SignalCellular4Bar as SignalIcon, BatteryChargingFull as BatteryIcon } from '@mui/icons-material';
import { API_URL } from '../config';

const fetchDevices = async () => {
  const token = localStorage.getItem('jwt_token');
  const response = await fetch(`${API_URL}/api/devices`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch devices');
  }
  return response.json();
};

export default function Devices() {
  const { data: devices, isLoading, error } = useQuery({
    queryKey: ['devicesList'],
    queryFn: fetchDevices,
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
        <Typography variant="h6">Failed to load devices</Typography>
        <Typography variant="body2">{error instanceof Error ? error.message : 'Please check connection'}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ bgcolor: '#1c1c1e', color: '#fff', border: '1px solid #2c2c2e', borderRadius: 3, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Gateway SIM Devices
        </Typography>

        {devices?.length === 0 ? (
          <Box sx={{ py: 6, textCenter: 'center', color: '#8e8e93' }}>
            <Typography variant="body1">No gateway devices registered yet.</Typography>
            <Typography variant="caption">Connect your Android app to link a Jio SIM gateway.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ '& th': { color: '#aeaeb2', borderBottom: '1px solid #2c2c2e', fontWeight: 600 } }}>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Device ID</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Carrier</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Battery</TableCell>
                  <TableCell>Signal</TableCell>
                  <TableCell>Last Seen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ '& td': { color: '#fff', borderBottom: '1px solid #2c2c2e' } }}>
                {devices.map((device: any) => (
                  <TableRow key={device.deviceId} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{device.name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '13px' }}>{device.deviceId}</TableCell>
                    <TableCell>{device.phoneNumber}</TableCell>
                    <TableCell>{device.provider}</TableCell>
                    <TableCell>
                      <Chip
                        label={device.status}
                        size="small"
                        sx={{
                          bgcolor:
                            device.status === 'online'
                              ? 'rgba(52,199,89,0.15)'
                              : device.status === 'paused'
                              ? 'rgba(255,149,0,0.15)'
                              : 'rgba(142,142,147,0.15)',
                          color:
                            device.status === 'online'
                              ? '#34c759'
                              : device.status === 'paused'
                              ? '#ff9500'
                              : '#8e8e93',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
                        <BatteryIcon sx={{ color: '#34c759', mr: 1, fontSize: 18 }} />
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={device.battery}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#2c2c2e',
                              '& .MuiLinearProgress-bar': { bgcolor: '#34c759' },
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#aeaeb2', fontSize: '13px' }}>
                          {device.battery}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SignalIcon sx={{ color: '#007aff', mr: 1, fontSize: 18 }} />
                        <Typography variant="body2">{device.signal} / 4</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#8e8e93', fontSize: '13px' }}>
                      {new Date(device.lastSeenAt).toLocaleString()}
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
