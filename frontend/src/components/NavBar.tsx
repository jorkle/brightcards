import React, { memo, useMemo } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link, useLocation } from 'react-router';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box } from '@mui/material';

// Navigation links defined outside component to prevent recreation on each render
const NAV_LINKS = [
  { path: "/decks", label: "Decks" },
  { path: "/", label: "Overview" },
  { path: "/review", label: "Review" },
  { path: "/about", label: "About" }
];

const NavBar = () => {
  const location = useLocation();
  
  // Memoize the navigation buttons to prevent unnecessary rerenders
  const navButtons = useMemo(() => (
    NAV_LINKS.map(link => (
      <Button 
        key={link.path}
        component={Link} 
        to={link.path} 
        color="inherit"
        sx={{ 
          fontWeight: location.pathname === link.path ? 'bold' : 'normal',
          mx: 1 
        }}
      >
        {link.label}
      </Button>
    ))
  ), [location.pathname]);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography align='left' variant="h6">
          Bright Cards
        </Typography>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {navButtons}
        </div>
        <IconButton 
          edge="end" 
          color="inherit" 
          aria-label="settings" 
          component={Link} 
          to="/settings"
        >
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

// Export memoized component to prevent re-renders when parent components update
export default memo(NavBar);
