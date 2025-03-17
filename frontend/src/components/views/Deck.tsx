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
  Chip,
  Stack,
  Grid
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import * as models from '../../../wailsjs/go/models';
import { GetDeck } from '../../../wailsjs/go/main/DeckImpl';
import { GetDueFlashcards } from '../../../wailsjs/go/main/FlashcardImpl';

function DeckDetails() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<models.models.DeckModel | null>(null);
  const [dueCards, setDueCards] = useState<models.models.FlashcardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [deckId]);

  const loadData = async () => {
    if (!deckId) return;
    const numericDeckId = parseInt(deckId, 10);
    if (isNaN(numericDeckId)) {
      setError('Invalid deck ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [deckData, dueCardsData] = await Promise.all([
        GetDeck(numericDeckId),
        GetDueFlashcards(numericDeckId)
      ]);
      setDeck(deckData);
      setDueCards(dueCardsData);
      setError(null);
    } catch (err) {
      setError('Failed to load deck details');
      console.error('Error loading deck:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !deck) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error || 'Deck not found'}
      </Alert>
    );
  }

  return (
    <div className="p-4">
      <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          {deck.Name}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="body1">
                    {deck.Description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Purpose: {deck.Purpose}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {deck.LastReviewed && (
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={`Last reviewed: ${new Date(deck.LastReviewed).toLocaleDateString()}`}
                        variant="outlined"
                      />
                    )}
                    <Chip
                      icon={<AutoStoriesIcon />}
                      label={`${deck.CardCount} cards`}
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => navigate(`/decks/${deck.ID}/cards`)}
                    >
                      View Cards
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => navigate(`/decks/${deck.ID}/edit`)}
                    >
                      Edit Deck
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">
                    Cards Due for Review: {dueCards.length}
                  </Typography>
                  {dueCards.length > 0 && (
                    <Button 
                      variant="contained" 
                      color="secondary"
                      onClick={() => navigate(`/decks/${deck.ID}/review`)}
                    >
                      Start Review
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

export default DeckDetails;
