import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Stack,
  Alert
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { CreateFlashcard } from '../../../wailsjs/go/api/FlashcardImpl';
import { Create } from '@mui/icons-material';

function CardNew() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    front: '',
    back: ''
  });

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
    if (!deckId) return;

    setSaving(true);
    try {
      const newCard = await CreateFlashcard(parseInt(deckId), formData.front, formData.back);
      navigate(`/decks/${deckId}/cards`);
    } catch (err) {
      setError('Failed to create flashcard');
      console.error('Error creating card:', err);
      setSaving(false);
    }
  };

  const isFormValid = formData.front.trim() !== '' && formData.back.trim() !== '';

  return (
    <div className="p-4">
      <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Add New Flashcard
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
                    {saving ? 'Creating...' : 'Create Card'}
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

export default CardNew
