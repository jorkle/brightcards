import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Card, CardContent, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DeleteFlashcard } from '../../../wailsjs/go/api/FlashcardImpl';

interface Flashcard {
  front: string;
  back: string;
}

function CardDelete() {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  // Placeholder card data - in a real app, this would be fetched from your backend
  const card: Flashcard = {
    front: 'Sample Front Text',
    back: 'Sample Back Text'
  };

  const handleCancel = () => {
    navigate(`/decks/${deckId}/cards/${cardId}`);
  };

  const handleDelete = async () => {
    if (!deckId) return;
    
    try {
      if (!cardId) return;
      await DeleteFlashcard(parseInt(deckId), parseInt(cardId));
      navigate(`/decks/${deckId}/cards`);
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  return (
    <div className="p-4">
      <Typography variant="h4" className="mb-4">
        Delete Card
      </Typography>
      <Grid container justifyContent="center">
        <Grid size={{ xs: 12, sm: 8, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-2">
                Card Preview
              </Typography>
              <Typography variant="body1" className="mb-2">
                Front: {card.front}
              </Typography>
              <Typography variant="body1" className="mb-4">
                Back: {card.back}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Card Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this card? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default CardDelete
