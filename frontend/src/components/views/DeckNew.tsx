import React, { useState } from 'react';
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
  IconButton
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import * as models from '../../../wailsjs/go/models';
import { CreateDeck } from '../../../wailsjs/go/main/DeckImpl';

function DeckNew() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purpose: ''
  });

  const handleChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleCancel = () => {
    navigate('/decks');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const newDeck = await CreateDeck(
        formData.name, 
        formData.description,
        formData.purpose
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
    formData.purpose.trim() !== '';

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
