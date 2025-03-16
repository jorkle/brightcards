import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Flashcard } from '../../lib/wailsjs/go/models';
import * as api from '../../lib/wailsjs/go/api';

function CardEdit() {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    front: '',
    back: ''
  });

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
      setFormData({
        front: cardData.front,
        back: cardData.back
      });
      setError(null);
    } catch (err) {
      setError('Failed to load flashcard');
      console.error('Error loading card:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleCancel = () => {
    navigate(`/decks/${deckId}/cards`);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!card) return;

    setSaving(true);
    try {
      const updatedCard = await api.updateCard({
        ...card,
        front: formData.front,
        back: formData.back
      });
      navigate(`/decks/${deckId}/cards`);
    } catch (err) {
      setError('Failed to update flashcard');
      console.error('Error updating card:', err);
      setSaving(false);
    }
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

  const isFormValid = formData.front.trim() !== '' && formData.back.trim() !== '';

  return (
    <div className="p-4">
      <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Edit Flashcard
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Box>
                  <TextField
                    fullWidth
                    label="Front"
                    value={formData.front}
                    onChange={handleChange('front')}
                    variant="outlined"
                    multiline
                    rows={3}
                    required
                    error={formData.front.trim() === ''}
                    helperText={formData.front.trim() === '' ? 'Front content is required' : ''}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Back"
                    value={formData.back}
                    onChange={handleChange('back')}
                    variant="outlined"
                    multiline
                    rows={3}
                    required
                    error={formData.back.trim() === ''}
                    helperText={formData.back.trim() === '' ? 'Back content is required' : ''}
                  />
                </Box>

                {card.lastReviewed && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={`Last reviewed: ${new Date(card.lastReviewed).toLocaleDateString()}`}
                      variant="outlined"
                    />
                    {card.difficulty && (
                      <Chip
                        label={`Difficulty: ${card.difficulty}`}
                        color={
                          card.difficulty === 'Easy' ? 'success' :
                          card.difficulty === 'Hard' ? 'error' : 'info'
                        }
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  gap: 2,
                  mt: 2 
                }}>
                  <Button 
                    onClick={handleCancel}
                    color="inherit"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    variant="contained" 
                    color="primary"
                    disabled={!isFormValid || saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}

export default CardEdit
