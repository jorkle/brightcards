import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

function NavBar() {
  return (
    <AppBar position="static">
      <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography align='left' variant="h6">
          Bright Cards
        </Typography>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>

          <Button href="/decks" color="inherit">Decks</Button>
          <Button href="/" color="inherit">Overview</Button>
          <Button href="/review" color="inherit">Review</Button>
          <Button href="/about" color="inherit">About</Button>
        </div>
        <IconButton edge="end" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;
