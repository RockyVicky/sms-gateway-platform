import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Devices as DevicesIcon,
  Message as MessageIcon,
  Logout as LogoutIcon,
  Send as SendIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Devices', icon: <DevicesIcon />, path: '/devices' },
    { text: 'Messages', icon: <MessageIcon />, path: '/messages' },
    { text: 'Compose SMS', icon: <SendIcon />, path: '/compose' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#121212', color: '#fff' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: '#1c1c1e',
          boxShadow: 'none',
          borderBottom: '1px solid #2c2c2e',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'SMS Gateway'}
          </Typography>
          <IconButton onClick={handleLogout} sx={{ color: '#ff3b30' }}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#1c1c1e',
            color: '#fff',
            borderRight: '1px solid #2c2c2e',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1, color: '#007aff' }}>
            SG SAAS
          </Typography>
          <Typography variant="caption" sx={{ color: '#8e8e93', mt: 0.5 }}>
            SMS Gateway Control
          </Typography>
        </Box>
        <Divider sx={{ bgcolor: '#2c2c2e' }} />
        <List sx={{ px: 2, mt: 2 }}>
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: active ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
                    color: active ? '#007aff' : '#aeaeb2',
                    '&:hover': {
                      bgcolor: active ? 'rgba(0, 122, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: active ? '#007aff' : '#aeaeb2', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: '15px', fontWeight: active ? 600 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          width: `calc(100% - ${drawerWidth}px)`,
          mt: 8,
          bgcolor: '#121212',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
