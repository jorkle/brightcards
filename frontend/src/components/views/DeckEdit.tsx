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
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import * as models from '../../../wailsjs/go/models';
import { UpdateDeckWithRephraseSettings, GetDeck } from '../../../wailsjs/go/main/DeckImpl';

function DeckEdit() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<models.models.DeckModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purpose: '',
    enableAutoRephrase: false,
    enableInitialismSwap: false,
    maxRephrasedCards: 3
  });

  useEffect(() => {
    // Load global rephrasing settings defaults from localStorage
    loadGlobalRephraseSettings();

    // Then load deck data which will override the defaults
    loadDeck();
  }, [deckId]);

  const loadGlobalRephraseSettings = () => {
    const settings = localStorage.getItem('rephraseSettings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      setFormData(prev => ({
        ...prev,
        enableAutoRephrase: parsedSettings.enableAutoRephrase ?? false,
        enableInitialismSwap: parsedSettings.enableInitialismSwap ?? false,
        maxRephrasedCards: parsedSettings.maxRephrasedCards ?? 3
      }));
    }
  };

  const loadDeck = async () => {
    try {
      if (!deckId) return;
      const numericDeckId = parseInt(deckId, 10);

      if (isNaN(numericDeckId)) {
        setError('Invalid deck ID');
        setLoading(false);
        return;
      }

      const deckData = await GetDeck(numericDeckId);
      setDeck(deckData);
      setFormData(prev => ({
        ...prev,
        name: deckData.Name,
        description: deckData.Description,
        purpose: deckData.Purpose,
        enableAutoRephrase: deckData.EnableAutoRephrase,
        enableInitialismSwap: deckData.EnableInitialismSwap,
        maxRephrasedCards: deckData.MaxRephrasedCards
      }));
      setError(null);
    } catch (err) {
      setError('Failed to load deck details');
      console.error('Error loading deck:', err);
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

  const handleSwitchChange = (field: 'enableAutoRephrase' | 'enableInitialismSwap') => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleMaxCardsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      maxRephrasedCards: isNaN(value) ? 3 : Math.max(1, Math.min(10, value))
    }));
  };

  const handleCancel = () => {
    navigate(`/decks/${deckId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckId) return;

    const numericDeckId = parseInt(deckId, 10);
    if (isNaN(numericDeckId)) {
      setError('Invalid deck ID');
      return;
    }

    setSaving(true);
    try {
      await UpdateDeckWithRephraseSettings(
        numericDeckId,
        formData.name,
        formData.description,
        formData.purpose,
        formData.enableAutoRephrase,
        formData.enableInitialismSwap,
        formData.maxRephrasedCards
      );
      navigate('/decks');
    } catch (err) {
      setError('Failed to update deck');
      console.error('Error updating deck:', err);
    } finally {
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

  if (error || !deck) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error || 'Deck not found'}
      </Alert>
    );
  }

  const isFormValid = formData.name.trim() !== '' &&
    formData.description.trim() !== '' &&
    formData.purpose.trim() !== '' &&
    formData.maxRephrasedCards > 0;

  return (
    <div className="p-4">
      <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Edit Deck
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Box>
                  <TextField
                    fullWidth
                    label="Deck Name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    variant="outlined"
                    required
                    error={formData.name.trim() === ''}
                    helperText={formData.name.trim() === '' ? 'Deck name is required' : ''}
                  />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={handleChange('description')}
                    variant="outlined"
                    multiline
                    rows={4}
                    required
                    error={formData.description.trim() === ''}
                    helperText={formData.description.trim() === '' ? 'Description is required' : ''}
                  />
                </Box>

                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    label="Purpose/Use Case"
                    value={formData.purpose}
                    onChange={handleChange('purpose')}
                    variant="outlined"
                    multiline
                    rows={3}
                    required
                    error={formData.purpose.trim() === ''}
                    helperText={formData.purpose.trim() === '' ? 'Purpose is required for AI-assisted flashcard generation' : ''}
                    placeholder="e.g., 'Studying for a medical licensing exam, focusing on cardiovascular system' or 'Learning Python programming basics for web development'"
                  />
                  <Tooltip title="Describe the specific purpose or use case for this deck. This helps the AI generate more relevant and focused flashcards. Be as specific as possible about your learning goals and context." placement="top">
                    <IconButton
                      sx={{ position: 'absolute', right: -40, top: 8 }}
                      size="small"
                    >
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Divider />

                <Typography variant="h6">
                  Rephrasing Settings
                </Typography>

                <FormGroup>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.enableAutoRephrase}
                          onChange={handleSwitchChange('enableAutoRephrase')}
                        />
                      }
                      label="Enable AI rephrasing for this deck"
                    />
                    <Tooltip title="When enabled, the system will automatically generate rephrased versions of flashcards for better learning.">
                      <IconButton size="small">
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.enableInitialismSwap}
                          onChange={handleSwitchChange('enableInitialismSwap')}
                        />
                      }
                      label="Enable initialism/acronym swapping"
                    />
                    <Tooltip title="When enabled, the AI will replace initialisms/acronyms with their full form and vice versa when rephrasing cards.">
                      <IconButton size="small">
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <TextField
                      label="Maximum rephrased cards per flashcard"
                      type="number"
                      value={formData.maxRephrasedCards}
                      onChange={handleMaxCardsChange}
                      inputProps={{ min: 1, max: 10 }}
                      sx={{ width: 300 }}
                    />
                    <Tooltip title="Set the maximum number of rephrased versions to generate for each flashcard.">
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </FormGroup>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {deck.LastReviewed && (
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={`Last reviewed: ${new Date(deck.LastReviewed).toLocaleDateString()}`}
                      variant="outlined"
                    />
                  )}
                </Box>

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

export default DeckEdit
