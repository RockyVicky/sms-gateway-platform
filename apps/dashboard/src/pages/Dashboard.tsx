import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Message as MessageIcon, Devices as DevicesIcon, CheckCircle as SuccessIcon } from '@mui/icons-material';
import { API_URL } from '../config';

const fetchStats = async () => {
  const token = localStorage.getItem('jwt_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [devicesRes, messagesRes] = await Promise.all([
    fetch(`${API_URL}/api/devices`, { headers }),
    fetch(`${API_URL}/api/sms/history`, { headers }),
  ]);

  if (!devicesRes.ok || !messagesRes.ok) {
    throw new Error('Failed to fetch stats');
  }

  const devices = await devicesRes.json();
  const messages = await messagesRes.json();

  return { devices, messages };
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchStats,
    refetchInterval: 5000, // Refresh every 5s for live dashboard feel
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
        <Typography variant="h6">Failed to load statistics</Typography>
        <Typography variant="body2">{error instanceof Error ? error.message : 'Is the server running?'}</Typography>
      </Box>
    );
  }

  const devices = data?.devices || [];
  const messages = data?.messages || [];

  const totalSms = messages.length;
  const sentSms = messages.filter((m: any) => m.status === 'sent' || m.status === 'delivered').length;
  const successRate = totalSms > 0 ? Math.round((sentSms / totalSms) * 100) : 100;
  const onlineDevices = devices.filter((d: any) => d.status === 'online').length;

  // Process data for charts: group messages by date
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const count = messages.filter((m: any) => {
      const msgDate = new Date(m.createdAt);
      return msgDate.toDateString() === d.toDateString();
    }).length;

    return { name: dateStr, SMS: count };
  }).reverse();

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#1c1c1e', color: '#fff', border: '1px solid #2c2c2e', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(0,122,255,0.1)', borderRadius: 2, mr: 3 }}>
                <MessageIcon sx={{ color: '#007aff', fontSize: 30 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#aeaeb2', textTransform: 'uppercase', fontSize: '12px', letterSpacing: 0.5 }}>
                  Total Outgoing SMS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {totalSms}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#1c1c1e', color: '#fff', border: '1px solid #2c2c2e', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(52,199,89,0.1)', borderRadius: 2, mr: 3 }}>
                <SuccessIcon sx={{ color: '#34c759', fontSize: 30 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#aeaeb2', textTransform: 'uppercase', fontSize: '12px', letterSpacing: 0.5 }}>
                  Delivery Success Rate
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {successRate}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#1c1c1e', color: '#fff', border: '1px solid #2c2c2e', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(255,149,0,0.1)', borderRadius: 2, mr: 3 }}>
                <DevicesIcon sx={{ color: '#ff9500', fontSize: 30 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#aeaeb2', textTransform: 'uppercase', fontSize: '12px', letterSpacing: 0.5 }}>
                  Online Gateway SIMs
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {onlineDevices} <Typography component="span" variant="body1" sx={{ color: '#aeaeb2' }}>/ {devices.length}</Typography>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ bgcolor: '#1c1c1e', color: '#fff', border: '1px solid #2c2c2e', borderRadius: 3, p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          SMS Traffic History (7 Days)
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2e" />
              <XAxis dataKey="name" stroke="#8e8e93" />
              <YAxis stroke="#8e8e93" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1c1c1e', border: '1px solid #2c2c2e', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="SMS" stroke="#007aff" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Box>
  );
}
