
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

interface Flashcard {
  front: string;
  back: string;
}

const flashcards: Flashcard[] = [
  { front: 'Front of Card 1', back: 'Back of Card 1' },
  { front: 'Front of Card 2', back: 'Back of Card 2' },
  // Add more flashcards as needed
];

interface Deck {
  deckId: number;
  flashcards: Flashcard[];
}

interface Decks {
  decks: Deck[];
}


function ReviewAll() {
  const navigate = useNavigate();
  const deckOne: Deck = {
    deckId: 44, flashcards: flashcards
  }
  const deckTwo: Deck = {
    deckId: 44, flashcards: flashcards
  }
  const decks: Decks = {
    decks: [deckOne, deckTwo]
  }
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const handleShowBack = () => {
    setShowBack(true);
  };

  const handleGrade = (grade: string) => {
    setShowBack(false);
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
    if (currentCardIndex === flashcards.length - 1) {
      setCurrentDeckIndex((prevIndex) => (prevIndex + 1) % decks.decks.length);
      if (currentDeckIndex === decks.decks.length - 1) {
        navigate('/overview')
      }
    };
    // Handle grading logic here
    console.log(`Card graded as: ${grade}`);
  };
  const currentDeck = decks.decks[currentDeckIndex]; // Assuming we are reviewing the first deck
  const currentCard = currentDeck.flashcards[currentCardIndex];

  return (
    <div className="p-4">
      <Typography variant="h4" className="mb-4">
        Reviewing All Decks (due)
      </Typography>
      <Grid container justifyContent="center">
        <Grid size={{ xs: 12, sm: 8, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-4">
                {showBack ? currentCard.back : currentCard.front}
              </Typography>
              {!showBack ? (
                <Button variant="contained" color="primary" onClick={handleShowBack}>
                  Show Back
                </Button>
              ) : (
                <div className="flex justify-around mt-4">
                  <Button variant="outlined" color="secondary" onClick={() => handleGrade('Again')}>
                    Again
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={() => handleGrade('Easy')}>
                    Easy
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={() => handleGrade('Normal')}>
                    Normal
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={() => handleGrade('Hard')}>
                    Hard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}

export default ReviewAll
