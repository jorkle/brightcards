import React from 'react';
import { useParams } from 'react-router';
import { Button, Card, CardContent, Typography, Grid2 as Grid } from '@mui/material';

function DeckDetails() {
  const { deckId } = useParams<{ deckId: string }>();

  // Placeholder data for the deck details
  const deck = {
    name: 'Sample Deck',
    description: 'This is a sample deck description.',
    purpose: 'To help users learn sample content.',
    createdDate: '2023-01-01',
    lastModifiedDate: '2023-10-01',
    flashcardsDue: 5,
  };

  return (
    <div className="p-4">
      <Typography variant="h4" className="mb-4">
        Deck Details
      </Typography>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                {deck.name}
              </Typography>
              <Typography variant="body1" className="mb-2">
                {deck.description}
              </Typography>
              <Typography variant="body2" color="textSecondary" className="mb-2">
                Purpose: {deck.purpose}
              </Typography>
              <Typography variant="body2" color="textSecondary" className="mb-2">
                Created Date: {deck.createdDate}
              </Typography>
              <Typography variant="body2" color="textSecondary" className="mb-2">
                Last Modified Date: {deck.lastModifiedDate}
              </Typography>
              <div className="flex justify-around mt-4">
                <Button variant="contained" color="primary" className="mr-2">
                  Export to Anki/Markdown
                </Button>
                <Button variant="outlined" color="primary" className="mr-2">
                  Enable/Disable Syncing
                </Button>
                <Button variant="outlined" color="primary">
                  Generate Sharing Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-2">
                Flashcards Due for Review: {deck.flashcardsDue}
              </Typography>
              <Button variant="contained" color="secondary">
                View Statistics
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}

export default DeckDetails;
