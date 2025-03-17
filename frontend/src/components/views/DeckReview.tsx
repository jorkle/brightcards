import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  LinearProgress,
  ButtonGroup,
  Fade
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { GetDueFlashcards, ReviewFlashcard } from '../../../wailsjs/go/main/FlashcardImpl';
import { GetDeck } from '../../../wailsjs/go/main/DeckImpl';
import * as models from '../../../wailsjs/go/models';

enum ReviewGrade {
  Again = 'again',
  Hard = 'hard',
  Normal = 'normal',
  Easy = 'easy'
}

function DeckReview() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<models.models.DeckModel | null>(null);
  const [cards, setCards] = useState<models.models.FlashcardModel[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, [deckId]);

  const loadData = async () => {
    if (!deckId) {
      setError('Invalid deck ID');
      setLoading(false);
      return;
    }

    try {
      const deckData = await GetDeck(parseInt(deckId));
      setDeck(deckData);
      
      const dueCards = await GetDueFlashcards(parseInt(deckId));
      setCards(dueCards);
      setLoading(false);
      
      if (dueCards.length > 0) {
        setProgress(0);
      }
    } catch (err) {
      setError(`Failed to load data: ${err}`);
      setLoading(false);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleGrade = async (grade: string) => {
    if (!deckId || cards.length === 0) return;
    
    const currentCard = cards[currentCardIndex];
    
    try {
      await ReviewFlashcard(parseInt(deckId), currentCard.ID, grade);
      
      // Move to the next card or finish
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
        setProgress(((currentCardIndex + 1) / cards.length) * 100);
      } else {
        // All cards reviewed
        navigate(`/deck/${deckId}`);
      }
    } catch (err) {
      setError(`Failed to grade card: ${err}`);
    }
  };

  const handleFeynmanReview = () => {
    const currentCard = cards[currentCardIndex];
    navigate(`/feynman-review/${deckId}/${currentCard.ID}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
        <Box mt={2}>
          <Button variant="contained" onClick={() => navigate(`/deck/${deckId}`)}>
            Back to Deck
          </Button>
        </Box>
      </Box>
    );
  }

  if (cards.length === 0) {
    return (
      <Box m={2}>
        <Alert severity="info">No cards due for review in this deck.</Alert>
        <Box mt={2}>
          <Button variant="contained" onClick={() => navigate(`/deck/${deckId}`)}>
            Back to Deck
          </Button>
        </Box>
      </Box>
    );
  }

  const currentCard = cards[currentCardIndex];
  const isFeynmanCard = currentCard.CardType === 'feynman';

  return (
    <Box m={2}>
      <Typography variant="h4" gutterBottom>
        Reviewing: {deck?.Name}
      </Typography>
      
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ mb: 3, height: 10, borderRadius: 5 }}
      />
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {currentCardIndex + 1} of {cards.length}
          </Typography>
          <Typography variant="body1" paragraph>
            {currentCard.Front}
          </Typography>
          
          {isFeynmanCard ? (
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary" paragraph>
                This is a Feynman flashcard. Click the button below to record your explanation.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleFeynmanReview}
                fullWidth
              >
                Start Feynman Review
              </Button>
            </Box>
          ) : (
            <>
              {showAnswer ? (
                <>
                  <Typography variant="h6" gutterBottom mt={2}>
                    Answer:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {currentCard.Back}
                  </Typography>
                  
                  <Box mt={2}>
                    <Typography variant="body2" gutterBottom>
                      How well did you know this?
                    </Typography>
                    <ButtonGroup variant="contained" fullWidth>
                      <Button color="error" onClick={() => handleGrade('again')}>
                        Again
                      </Button>
                      <Button color="warning" onClick={() => handleGrade('hard')}>
                        Hard
                      </Button>
                      <Button color="info" onClick={() => handleGrade('normal')}>
                        Good
                      </Button>
                      <Button color="success" onClick={() => handleGrade('easy')}>
                        Easy
                      </Button>
                    </ButtonGroup>
                  </Box>
                </>
              ) : (
                <Box mt={2}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleShowAnswer}
                    fullWidth
                  >
                    Show Answer
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default DeckReview;
