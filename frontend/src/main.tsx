import React from 'react'
import { createRoot } from 'react-dom/client'
import ReactDOM from "react-dom/client";
import * as runtime from '../wailsjs/runtime/runtime'
import {
  BrowserRouter as Router,
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
import CardNew from './components/views/CardNew';
import CardEdit from './components/views/CardEdit';
import CardReview from './components/views/CardReview';
import CardDelete from './components/views/CardDelete';

const container = document.getElementById('root')


if (container != null) {
  ReactDOM.createRoot(container).render(
    <>
      <NavBar />
      <Router>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="about" element={<About />} />
          <Route path="decks" element={<Decks />} />
          <Route path="review" element={<ReviewAll />} />
          <Route path="decks/:deckId" element={<Deck />} />
          <Route path="decks/:deckId/edit" element={<DeckEdit />} />
          <Route path="decks/:deckId/delete" element={<DeckDelete />} />
          <Route path="decks/new" element={<DeckNew />} />
          <Route path="decks/:deckId/review" element={<DeckReview />} />
          <Route path="decks/:deckId/cards" element={<Cards />} />
          <Route path="decks/:deckId/cards/new" element={<CardNew />} />
          <Route path="decks/:deckId/cards/:cardId/edit" element={<CardEdit />} />
          <Route path="decks/:deckId/cards/:cardId/review" element={<CardReview />} />
          <Route path="decks/:deckId/cards/:cardId/delete" element={<CardDelete />} />
        </Routes>
      </Router>
    </>
  );
}
