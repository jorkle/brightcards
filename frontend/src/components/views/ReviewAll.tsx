import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PreviewIcon from '@mui/icons-material/Preview';
import * as models from '../../../wailsjs/go/models';
import { GetAllDecks } from '../../../wailsjs/go/main/DeckImpl';
import { GetDueFlashcards } from '../../../wailsjs/go/main/FlashcardImpl';

interface DeckWithDueCards extends models.models.DeckModel {
  dueCards: models.models.FlashcardModel[];
}

function ReviewAll() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<DeckWithDueCards[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalDueCards, setTotalDueCards] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const decksData = await GetAllDecks();
      
      // Fetch due cards for each deck
      const decksWithCards = await Promise.all(
        decksData.map(async (deck) => {
          const dueCards = await GetDueFlashcards(deck.ID);
          return {
            ...deck,
            dueCards
          };
        })
      );

      // Filter decks with due cards and calculate total
      const decksWithDueCards = decksWithCards.filter(deck => deck.dueCards.length > 0);
      const total = decksWithDueCards.reduce((sum, deck) => sum + deck.dueCards.length, 0);

      setDecks(decksWithDueCards);
      setTotalDueCards(total);
      setError(null);
    } catch (err) {
      setError('Failed to load review data');
      console.error('Error loading review data:', err);
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

  return (
    <div className="p-4">
      <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            Review All Decks
          </Typography>
          <Chip
            icon={<AutoStoriesIcon />}
            label={`${totalDueCards} cards due`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {decks.length === 0 ? (
          <Card>
            <CardContent>
              <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No cards due for review
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  All caught up! Check back later for more cards to review.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/decks')}
                >
                  View All Decks
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {decks.map((deck) => (
              <Grid item xs={12} key={deck.ID}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                          {deck.Name}
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => navigate(`/decks/${deck.ID}/review`)}
                          startIcon={<PreviewIcon />}
                        >
                          Start Review
                        </Button>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        {deck.Description}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<AutoStoriesIcon />}
                          label={`${deck.dueCards.length} cards due`}
                          color="secondary"
                          variant="outlined"
                        />
                        {deck.LastReviewed && (
                          <Chip
                            icon={<AccessTimeIcon />}
                            label={`Last reviewed: ${new Date(deck.LastReviewed).toLocaleDateString()}`}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </div>
  );
}

export default ReviewAll;
