import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Stack,
  Alert,
  CircularProgress,
  ButtonGroup,
  Chip,
  Fade
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Flashcard, ReviewGrade } from '../../lib/wailsjs/go/models';
import * as api from '../../lib/wailsjs/go/api';

function CardReview() {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    loadCard();
  }, [deckId, cardId]);

  const loadCard = async () => {
    try {
      if (!deckId || !cardId) return;
      const numericDeckId = parseInt(deckId, 10);
      const numericCardId = parseInt(cardId, 10);
      
      if (isNaN(numericDeckId) || isNaN(numericCardId)) {
        setError('Invalid deck or card ID');
        setLoading(false);
        return;
      }

      const cardData = await api.getCard(numericDeckId, numericCardId);
      setCard(cardData);
      setError(null);
    } catch (err) {
      setError('Failed to load flashcard');
      console.error('Error loading card:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleGrade = async (grade: ReviewGrade) => {
    if (!card || !deckId || !cardId) return;
    const numericDeckId = parseInt(deckId, 10);
    const numericCardId = parseInt(cardId, 10);
    
    if (isNaN(numericDeckId) || isNaN(numericCardId)) {
      setError('Invalid deck or card ID');
      return;
    }

    setReviewing(true);
    try {
      await api.reviewCard(numericDeckId, numericCardId, grade);
      navigate(`/decks/${numericDeckId}/cards`);
    } catch (err) {
      setError('Failed to submit review');
      console.error('Error reviewing card:', err);
      setReviewing(false);
    }
  };

  const handleSkip = () => {
    navigate(`/decks/${deckId}/cards`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !card) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error || 'Flashcard not found'}
      </Alert>
    );
  }

  return (
    <div className="p-4">
      <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            Review Card
          </Typography>
          <Button 
            color="inherit" 
            onClick={handleSkip}
            disabled={reviewing}
          >
            Skip
          </Button>
        </Box>

        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Front
                  </Typography>
                  <Typography variant="body1" whiteSpace="pre-wrap">
                    {card.front}
                  </Typography>
                </Box>

                {showAnswer ? (
                  <Fade in={showAnswer}>
                    <Box>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Back
                      </Typography>
                      <Typography variant="body1" whiteSpace="pre-wrap">
                        {card.back}
                      </Typography>
                    </Box>
                  </Fade>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={handleShowAnswer}
                      size="large"
                    >
                      Show Answer
                    </Button>
                  </Box>
                )}

                {showAnswer && (
                  <Fade in={showAnswer}>
                    <Box>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        How well did you know this?
                      </Typography>
                      <ButtonGroup variant="contained" size="large" fullWidth>
                        <Button 
                          onClick={() => handleGrade(ReviewGrade.Again)}
                          color="error"
                          disabled={reviewing}
                        >
                          Again
                        </Button>
                        <Button 
                          onClick={() => handleGrade(ReviewGrade.Hard)}
                          color="warning"
                          disabled={reviewing}
                        >
                          Hard
                        </Button>
                        <Button 
                          onClick={() => handleGrade(ReviewGrade.Normal)}
                          color="info"
                          disabled={reviewing}
                        >
                          Good
                        </Button>
                        <Button 
                          onClick={() => handleGrade(ReviewGrade.Easy)}
                          color="success"
                          disabled={reviewing}
                        >
                          Easy
                        </Button>
                      </ButtonGroup>
                    </Box>
                  </Fade>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {card.lastReviewed && (
              <Chip
                icon={<AccessTimeIcon />}
                label={`Last reviewed: ${new Date(card.lastReviewed).toLocaleDateString()}`}
                variant="outlined"
              />
            )}
            {card.difficulty && (
              <Chip
                label={`Current difficulty: ${card.difficulty}`}
                color={
                  card.difficulty === 'Easy' ? 'success' :
                  card.difficulty === 'Hard' ? 'error' : 'info'
                }
                variant="outlined"
              />
            )}
          </Box>
        </Stack>
      </Box>
    </div>
  );
}

export default CardReview
