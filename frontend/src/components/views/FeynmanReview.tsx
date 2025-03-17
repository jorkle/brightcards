import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Alert, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  Paper
} from '@mui/material';
import { 
  StartRecording, 
  StopRecordingAndAnalyze, 
  CleanupRecording 
} from '../../../wailsjs/go/main/FeynmanService';
import { GetFlashcard } from '../../../wailsjs/go/main/FlashcardImpl';
import  * as models from '../../../wailsjs/go/models';

interface FeynmanAnalysis {
  strongspots: string;
  weakspots: string;
  resources: string[];
}

const FeynmanReview: React.FC = () => {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
  const navigate = useNavigate();
  
  const [card, setCard] = useState<models.models.FlashcardModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<FeynmanAnalysis | null>(null);

  useEffect(() => {
    loadCard();
    
    // Cleanup recording when component unmounts
    return () => {
      if (isRecording) {
        CleanupRecording()
          .catch(err => console.error('Failed to cleanup recording:', err));
      }
    };
  }, []);

  const loadCard = async () => {
    if (!deckId || !cardId) {
      setError('Invalid deck or card ID');
      setIsLoading(false);
      return;
    }

    try {
      const loadedCard = await GetFlashcard(parseInt(deckId), parseInt(cardId));
      
      // Check if this is a Feynman card
      if (loadedCard.CardType !== 'feynman') {
        setError('This is not a Feynman flashcard');
        setIsLoading(false);
        return;
      }
      
      setCard(loadedCard);
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to load flashcard: ${err}`);
      setIsLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      setError(null);
      await StartRecording();
    } catch (err) {
      setError(`Failed to start recording: ${err}`);
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording) return;
    
    try {
      setIsRecording(false);
      setIsAnalyzing(true);
      
      const result = await StopRecordingAndAnalyze();
      setAnalysis(result);
      setIsAnalyzing(false);
    } catch (err) {
      setError(`Failed to analyze recording: ${err}`);
      setIsRecording(false);
      setIsAnalyzing(false);
    }
  };

  const handleFinish = () => {
    // Navigate back to the deck view
    navigate(`/deck/${deckId}`);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
        <Box mt={2}>
          <Button variant="contained" onClick={() => navigate(`/deck/${deckId}`)}>
            Back to Deck
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box m={2}>
      <Typography variant="h4" gutterBottom>
        Feynman Flashcard Review
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Concept to Explain
          </Typography>
          <Typography variant="body1" paragraph>
            {card?.Front}
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            Explain this concept as if you were teaching it to a child. Record your explanation by clicking the Start button.
          </Typography>
        </CardContent>
      </Card>

      {!analysis ? (
        <Box display="flex" justifyContent="center" mb={3}>
          {!isRecording ? (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleStartRecording}
              disabled={isAnalyzing}
              size="large"
            >
              Start Recording
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleStopRecording}
              size="large"
            >
              Stop Recording
            </Button>
          )}
        </Box>
      ) : (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleFinish}
          sx={{ mb: 3 }}
        >
          Finish Review
        </Button>
      )}

      {isAnalyzing && (
        <Box display="flex" flexDirection="column" alignItems="center" my={4}>
          <CircularProgress />
          <Typography variant="body1" mt={2}>
            Analyzing your explanation...
          </Typography>
        </Box>
      )}

      {analysis && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Analysis of Your Explanation
          </Typography>
          
          <Typography variant="h6" color="primary" gutterBottom>
            Strong Points
          </Typography>
          <Typography variant="body1" paragraph>
            {analysis.strongspots}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" color="secondary" gutterBottom>
            Areas for Improvement
          </Typography>
          <Typography variant="body1" paragraph>
            {analysis.weakspots}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Recommended Resources
          </Typography>
          <List>
            {analysis.resources.map((resource, index) => (
              <ListItem key={index}>
                <ListItemText primary={resource} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default FeynmanReview; 