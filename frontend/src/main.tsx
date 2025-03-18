/// <reference types="lodash" />
import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import ReactDOM from "react-dom/client";
import * as runtime from '../wailsjs/runtime/runtime'
import {
  HashRouter as Router,
  Routes,
  Route,
  Link
} from "react-router";
import './style.css'
import NavBar from './components/NavBar';
// Import core components normally
import Overview from './components/views/Overview';
// Lazy load everything else
const About = lazy(() => import('./components/views/About'));
const Decks = lazy(() => import('./components/views/Decks'));
const ReviewAll = lazy(() => import('./components/views/ReviewAll'));
const Deck = lazy(() => import('./components/views/Deck'));
const DeckEdit = lazy(() => import('./components/views/DeckEdit'));
const DeckDelete = lazy(() => import('./components/views/DeckDelete'));
const DeckNew = lazy(() => import('./components/views/DeckNew'));
const DeckReview = lazy(() => import('./components/views/DeckReview'));
const Cards = lazy(() => import('./components/views/Cards'));
const CardCreate = lazy(() => import('./components/views/CardCreate'));
const CardEdit = lazy(() => import('./components/views/CardEdit'));
const CardReview = lazy(() => import('./components/views/CardReview'));
const CardDelete = lazy(() => import('./components/views/CardDelete'));
const FeynmanReview = lazy(() => import('./components/views/FeynmanReview'));
const Settings = lazy(() => import('./components/views/Settings'));
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import { CircularProgress, Box } from '@mui/material';

// Memoize theme creation to prevent unnecessary recalculations
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
);

const container = document.getElementById('root')

if (container != null) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            backgroundColor: 'inherit'
          }}>
            <NavBar />
            <Toolbar />
            <div style={{
              flexGrow: 1,
              overflow: 'auto',
              padding: '20px',
              height: 'calc(100vh - 64px)',
              boxSizing: 'border-box'
            }}>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Overview />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/decks/new" element={<DeckNew />} />
                  <Route path="/decks/:deckId/edit" element={<DeckEdit />} />
                  <Route path="/decks/:deckId/delete" element={<DeckDelete />} />
                  <Route path="/decks/:deckId/review" element={<DeckReview />} />
                  <Route path="/decks/:deckId/cards/new" element={<CardCreate />} />
                  <Route path="/decks/:deckId/cards/:cardId/edit" element={<CardEdit />} />
                  <Route path="/decks/:deckId/cards/:cardId/review" element={<CardReview />} />
                  <Route path="/decks/:deckId/cards/:cardId/delete" element={<CardDelete />} />
                  <Route path="/decks/:deckId/cards" element={<Cards />} />
                  <Route path="/decks/:deckId" element={<Deck />} />
                  <Route path="/decks" element={<Decks />} />
                  <Route path="/review" element={<ReviewAll />} />
                  <Route path="/feynman-review/:deckId/:cardId" element={<FeynmanReview />} />
                </Routes>
              </Suspense>
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </React.StrictMode>
  );
}
