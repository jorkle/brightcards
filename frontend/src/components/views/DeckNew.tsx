import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Stack,
  Alert,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import * as models from '../../../wailsjs/go/models';
import { CreateDeckWithRephraseSettings } from '../../../wailsjs/go/main/DeckImpl';

function DeckNew() {
  const navigate = useNavigate();
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
  }, []);

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
    navigate('/decks');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const newDeck = await CreateDeckWithRephraseSettings(
        formData.name,
        formData.description,
        formData.purpose,
        formData.enableAutoRephrase,
        formData.enableInitialismSwap,
        formData.maxRephrasedCards
      );
      navigate(`/decks/${newDeck.ID}`);
    } catch (err) {
      setError('Failed to create deck');
      console.error('Error creating deck:', err);
      setSaving(false);
    }
  };

  const isFormValid = formData.name.trim() !== '' &&
    formData.description.trim() !== '' &&
    formData.purpose.trim() !== '' &&
    formData.maxRephrasedCards > 0;

  return (
    <div className="p-4">
      <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Create New Deck
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card>
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
                    autoFocus
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
                    {saving ? 'Creating...' : 'Create Deck'}
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

export default DeckNew
