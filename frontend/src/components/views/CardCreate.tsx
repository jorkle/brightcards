import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  TextField, 
  Typography, 
  CircularProgress, 
  Alert,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel
} from '@mui/material';
import { CreateFlashcard } from '../../../wailsjs/go/main/FlashcardImpl';

const CardCreate: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  
  const [front, setFront] = useState<string>('');
  const [back, setBack] = useState<string>('');
  const [cardType, setCardType] = useState<string>('standard');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deckId) {
      setError('Invalid deck ID');
      return;
    }
    
    if (!front.trim()) {
      setError('Front side cannot be empty');
      return;
    }
    
    // For standard cards, back side is required
    if (cardType === 'standard' && !back.trim()) {
      setError('Back side cannot be empty for standard cards');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await CreateFlashcard(parseInt(deckId), front, back, cardType);
      navigate(`/deck/${deckId}/cards`);
    } catch (err) {
      setError(`Failed to create flashcard: ${err}`);
      setIsLoading(false);
    }
  };

  return (
    <Box m={2}>
      <Typography variant="h4" gutterBottom>
        Create New Flashcard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Card Type</FormLabel>
              <RadioGroup
                row
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
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
              label={cardType === 'standard' ? "Front Side" : "Concept to Explain"}
              fullWidth
              multiline
              rows={4}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              margin="normal"
              variant="outlined"
              required
            />
            
            {cardType === 'standard' && (
              <TextField
                label="Back Side"
                fullWidth
                multiline
                rows={4}
                value={back}
                onChange={(e) => setBack(e.target.value)}
                margin="normal"
                variant="outlined"
                required
              />
            )}
            
            {cardType === 'feynman' && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 2 }}>
                Feynman flashcards only require the concept to explain. During review, you'll record yourself explaining the concept as if teaching it to a child.
              </Typography>
            )}
            
            <Box mt={3} display="flex" justifyContent="space-between">
              <Button
                variant="outlined"
                onClick={() => navigate(`/deck/${deckId}/cards`)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Create Flashcard'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CardCreate; 