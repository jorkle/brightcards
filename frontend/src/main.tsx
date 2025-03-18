import React from 'react'
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
import Overview from './components/views/Overview';
import About from './components/views/About';
import Decks from './components/views/Decks';
import ReviewAll from './components/views/ReviewAll';
import Deck from './components/views/Deck';
import DeckEdit from './components/views/DeckEdit';
import DeckDelete from './components/views/DeckDelete';
import DeckNew from './components/views/DeckNew';
import DeckReview from './components/views/DeckReview';
import Cards from './components/views/Cards';
import CardCreate from './components/views/CardCreate';
import CardEdit from './components/views/CardEdit';
import CardReview from './components/views/CardReview';
import CardDelete from './components/views/CardDelete';
import FeynmanReview from './components/views/FeynmanReview';
import Settings from './components/views/Settings';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';

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
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </React.StrictMode>
  );
}
