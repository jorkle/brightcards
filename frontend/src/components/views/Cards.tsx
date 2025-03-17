import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PreviewIcon from '@mui/icons-material/Preview';
import AddIcon from '@mui/icons-material/Add';
import * as models from '../../../wailsjs/go/models';
import { GetDeck} from '../../../wailsjs/go/api/DeckImpl';
import { GetAllFlashcards, GetDueFlashcards } from '../../../wailsjs/go/api/FlashcardImpl';

function Cards() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [cards, setCards] = useState<models.models.FlashcardModel[]>([]);
  const [dueCards, setDueCards] = useState<models.models.FlashcardModel[]>([]);
  const [deck, setDeck] = useState<models.models.DeckModel | null>(null);
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
      const [deckData, allCards, dueCardsData] = await Promise.all([
        GetDeck(numericDeckId),
        GetAllFlashcards(numericDeckId),
        GetDueFlashcards(numericDeckId)
      ]);
      setDeck(deckData);
      setCards(allCards);
      setDueCards(dueCardsData);
      setError(null);
    } catch (err) {
      setError('Failed to load flashcards');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Normal': return 'info';
      case 'Hard': return 'error';
      default: return 'default';
    }
  };

  const renderCardList = (cardsToRender: models.models.FlashcardModel[]) => (
    <List>
      {cardsToRender.map((card) => (
        <ListItem
          key={card.ID}
          divider
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
          secondaryAction={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {card.Difficulty && (
                <Chip 
                  label={card.Difficulty} 
                  size="small" 
                  color={getDifficultyColor(card.Difficulty)}
                  sx={{ mr: 2 }}
                />
              )}
              <IconButton 
                edge="end" 
                aria-label="preview"
                onClick={() => navigate(`/decks/${deckId}/cards/${card.ID}/review`)}
              >
                <PreviewIcon />
              </IconButton>
              <IconButton 
                edge="end" 
                aria-label="edit"
                onClick={() => navigate(`/decks/${deckId}/cards/${card.ID}/edit`)}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => navigate(`/decks/${deckId}/cards/${card.ID}/delete`)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          }
        >
          <ListItemText
            primary={
              <Typography
                sx={{
                  display: '-webkit-box',
                  overflow: 'hidden',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                }}
              >
                {card.Front}
              </Typography>
            }
            secondary={
              <Box sx={{ mt: 1 }}>
                {card.LastReviewed && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    Last reviewed: {new Date(card.LastReviewed).toLocaleDateString()}
                  </Typography>
                )}
                {card.DaysTillDue && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    Due: {(() => { const d = new Date(); d.setDate(d.getDate() + card.DaysTillDue); return d.toLocaleDateString(); })()}
                  </Typography>
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          {deck.Name} - Flashcards
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/decks/${deckId}/cards/new`)}
        >
          Add New Card
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Due (${dueCards.length})`} />
              <Tab label={`All Cards (${cards.length})`} />
            </Tabs>
          </Box>

          <Box sx={{ mt: 2 }}>
            {tabValue === 0 && (
              <>
                {dueCards.length > 0 ? (
                  renderCardList(dueCards)
                ) : (
                  <Typography variant="body1" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                    No cards due for review!
                  </Typography>
                )}
              </>
            )}
            {tabValue === 1 && (
              <>
                {cards.length > 0 ? (
                  renderCardList(cards)
                ) : (
                  <Typography variant="body1" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                    No cards in this deck yet. Add your first card to get started!
                  </Typography>
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}

export default Cards
