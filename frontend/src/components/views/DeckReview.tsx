import React, { useState } from 'react';
import { useParams } from 'react-router';
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

function DeckReview() {
  const { deckId } = useParams<{ deckId: string }>();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const handleShowBack = () => {
    setShowBack(true);
  };

  const handleGrade = (grade: string) => {
    setShowBack(false);
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
    // Handle grading logic here
    console.log(`Card graded as: ${grade}`);
  };

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="p-4">
      <Typography variant="h4" className="mb-4">
        Reviewing Deck {deckId}
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

export default DeckReview;
