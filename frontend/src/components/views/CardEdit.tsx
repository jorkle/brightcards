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
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import * as models from '../../../wailsjs/go/models';
import { GetFlashcard, UpdateFlashcard } from '../../../wailsjs/go/main/FlashcardImpl';

function CardEdit() {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<models.models.FlashcardModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    cardType: 'standard'
  });

  useEffect(() => {
    loadCard();
  }, [deckId, cardId]);

  const loadCard = async () => {
    if (!deckId || !cardId) {
      setError('Invalid deck or card ID');
      setLoading(false);
      return;
    }

    try {
      const loadedCard = await GetFlashcard(parseInt(deckId), parseInt(cardId));
      setCard(loadedCard);
      setFormData({
        front: loadedCard.Front,
        back: loadedCard.Back,
        cardType: loadedCard.CardType || 'standard'
      });
      setError(null);
    } catch (err) {
      setError(`Failed to load flashcard: ${err}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deckId || !cardId) {
      setError('Invalid deck or card ID');
      return;
    }
    
    if (!formData.front.trim()) {
      setError('Front side cannot be empty');
      return;
    }
    
    if (formData.cardType === 'standard' && !formData.back.trim()) {
      setError('Back side cannot be empty for standard cards');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const updatedCard = new models.models.FlashcardModel();
      updatedCard.ID = parseInt(cardId);
      updatedCard.DeckId = parseInt(deckId);
      updatedCard.Front = formData.front;
      updatedCard.Back = formData.back;
      updatedCard.CardType = formData.cardType;
      updatedCard.FSRSStability = card?.FSRSStability || 0;
      updatedCard.FSRSDifficulty = card?.FSRSDifficulty || 0;
      updatedCard.DueDate = card?.DueDate || new Date().toISOString();
      
      await UpdateFlashcard(updatedCard);
      navigate(`/decks/${deckId}/cards`);
    } catch (err) {
      setError(`Failed to update flashcard: ${err}`);
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
                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <FormLabel component="legend">Card Type</FormLabel>
                  <RadioGroup
                    row
                    value={formData.cardType}
                    onChange={(e) => setFormData(prev => ({ ...prev, cardType: e.target.value }))}
                  >
                    <FormControlLabel 
                      value="standard" 
                      control={<Radio />} 
                      label="Standard Flashcard" 
                    />
                    <FormControlLabel 
                      value="feynman" 
                      control={<Radio />} 
                      label="Feynman Flashcard" 
                    />
                  </RadioGroup>
                </FormControl>

                <TextField
                  label={formData.cardType === 'standard' ? "Front Side" : "Concept to Explain"}
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.front}
                  onChange={handleChange('front')}
                  margin="normal"
                  variant="outlined"
                  required
                />

                {formData.cardType === 'standard' && (
                  <TextField
                    label="Back Side"
                    fullWidth
                    multiline
                    rows={4}
                    value={formData.back}
                    onChange={handleChange('back')}
                    margin="normal"
                    variant="outlined"
                    required
                  />
                )}

                {formData.cardType === 'feynman' && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 2 }}>
                    Feynman flashcards only require the concept to explain. During review, you'll record yourself explaining the concept as if teaching it to a child.
                  </Typography>
                )}

                {card.LastReviewed && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={`Last reviewed: ${new Date(card.LastReviewed).toLocaleDateString()}`}
                      variant="outlined"
                    />
                    {card.Difficulty && (
                      <Chip
                        label={`Difficulty: ${card.Difficulty}`}
                        color={
                          card.Difficulty === 'Easy' ? 'success' :
                          card.Difficulty === 'Hard' ? 'error' : 'info'
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
