import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
  Alert,
  AlertTitle,
  Stack,
  Chip,
  TextField,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { Deck, ExportFormat } from '../../lib/wailsjs/go/models';
import * as api from '../../lib/wailsjs/go/api';

function DeckDelete() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDeck();
  }, [deckId]);

  const loadDeck = async () => {
    try {
      if (!deckId) return;
      const deckData = await api.getDeck(deckId);
      setDeck(deckData);
      setError(null);
    } catch (err) {
      setError('Failed to load deck details');
      console.error('Error loading deck:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = async (type: 'anki' | 'csv' | 'json') => {
    if (!deck) return;
    setExporting(true);
    try {
      const format: ExportFormat = {
        type,
        filename: `${deck.name}_${new Date().toISOString().split('T')[0]}`
      };
      const filePath = await api.exportDeck(deck.id, format);
      console.log('Exported to:', filePath);
      // TODO: Show success notification
    } catch (err) {
      setError('Failed to export deck');
      console.error('Error exporting deck:', err);
    } finally {
      setExporting(false);
      handleExportClose();
    }
  };

  const handleCancel = () => {
    navigate(`/decks/${deckId}`);
  };

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deck || deleteText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.deleteDeck(deck.id);
      navigate('/decks');
    } catch (err) {
      setError('Failed to delete deck');
      console.error('Error deleting deck:', err);
      setDeleting(false);
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

  return (
    <div className="p-4">
      <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>You're about to delete this deck</AlertTitle>
          This action is permanent and cannot be undone. Please consider exporting your data before proceeding.
        </Alert>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {deck.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {deck.description}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<AutoStoriesIcon />}
                  label={`${deck.cardCount} cards`}
                  variant="outlined"
                />
                {deck.lastReviewed && (
                  <Chip
                    icon={<AccessTimeIcon />}
                    label={`Last reviewed: ${new Date(deck.lastReviewed).toLocaleDateString()}`}
                    variant="outlined"
                  />
                )}
                <Chip
                  icon={<WarningAmberIcon />}
                  label={`Created: ${new Date(deck.createdAt).toLocaleDateString()}`}
                  variant="outlined"
                />
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                mt: 2 
              }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  endIcon={<KeyboardArrowDownIcon />}
                  onClick={handleExportClick}
                  size="large"
                  disabled={exporting}
                >
                  {exporting ? 'Exporting...' : 'Export Deck'}
                </Button>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    onClick={handleCancel} 
                    color="inherit" 
                    size="large"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDeleteClick} 
                    variant="contained" 
                    color="error"
                    size="large"
                    startIcon={<WarningAmberIcon />}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete Deck'}
                  </Button>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
      >
        <MenuItem onClick={() => handleExport('anki')} disabled={exporting}>
          <Typography>Anki Deck (.apkg)</Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Import directly into Anki
          </Typography>
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')} disabled={exporting}>
          <Typography>CSV File (.csv)</Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Compatible with spreadsheet software
          </Typography>
        </MenuItem>
        <MenuItem onClick={() => handleExport('json')} disabled={exporting}>
          <Typography>JSON File (.json)</Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Raw data format
          </Typography>
        </MenuItem>
      </Menu>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="error" />
          Confirm Permanent Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to delete <strong>{deck.name}</strong> containing {deck.cardCount} flashcards. 
            This action cannot be undone and all associated data will be permanently lost.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Type "DELETE" to confirm:
            </Typography>
            <TextField
              fullWidth
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              variant="outlined"
              size="small"
              error={deleteText !== '' && deleteText !== 'DELETE'}
              helperText={deleteText !== '' && deleteText !== 'DELETE' ? 'Please type DELETE in all caps' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmOpen(false)} 
            color="inherit"
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={deleteText !== 'DELETE' || deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default DeckDelete
