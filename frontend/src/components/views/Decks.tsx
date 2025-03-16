import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PreviewIcon from '@mui/icons-material/Preview';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { Deck } from '../../lib/wailsjs/go/models';
import * as api from '../../lib/wailsjs/go/api';

function Decks() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    setLoading(true);
    try {
      const decksData = await api.listDecks();
      setDecks(decksData);
      setError(null);
    } catch (err) {
      setError('Failed to load decks');
      console.error('Error loading decks:', err);
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
            Your Flashcard Decks
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/decks/new')}
          >
            Create New Deck
          </Button>
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
                  No decks yet
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Create your first deck to get started with your flashcard journey!
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/decks/new')}
                >
                  Create New Deck
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <List>
            {decks.map((deck) => (
              <ListItem
                key={deck.id}
                component={Card}
                sx={{ mb: 2, '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      edge="end" 
                      aria-label="review"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/decks/${deck.id}/cards`);
                      }}
                    >
                      <PreviewIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/decks/${deck.id}/edit`);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/decks/${deck.id}/delete`);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
                onClick={() => navigate(`/decks/${deck.id}/cards`)}
              >
                <ListItemText
                  primary={
                    <Typography variant="h6">
                      {deck.name}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {deck.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                        <Chip
                          icon={<AutoStoriesIcon />}
                          label={`${deck.cardCount} cards`}
                          variant="outlined"
                          size="small"
                        />
                        {deck.lastReviewed && (
                          <Chip
                            icon={<AccessTimeIcon />}
                            label={`Last reviewed: ${new Date(deck.lastReviewed).toLocaleDateString()}`}
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </div>
  );
}

export default Decks;
