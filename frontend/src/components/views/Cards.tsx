import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Checkbox,
  ListItemIcon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Toolbar,
  FormControlLabel,
  Switch
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PreviewIcon from '@mui/icons-material/Preview';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import * as models from '../../../wailsjs/go/models';
import { GetDeck } from '../../../wailsjs/go/main/DeckImpl';
import { GetAllFlashcards, GetDueFlashcards, DeleteFlashcard } from '../../../wailsjs/go/main/FlashcardImpl';

function Cards() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [cards, setCards] = useState<models.models.FlashcardModel[]>([]);
  const [dueCards, setDueCards] = useState<models.models.FlashcardModel[]>([]);
  const [deck, setDeck] = useState<models.models.DeckModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCardType, setSelectedCardType] = useState('all');
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadData();
  }, [deckId]);

  const loadData = async () => {
    console.log(deckId)
    if (!deckId) return;
    const numericDeckId = parseInt(deckId, 10);
    if (isNaN(numericDeckId)) {
      setError('Invalid deck ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [deckData, allCards, dueCardsData] = await Promise.all([
        GetDeck(numericDeckId),
        GetAllFlashcards(numericDeckId),
        GetDueFlashcards(numericDeckId)
      ]);
      setDeck(deckData);
      setCards(allCards);
      setDueCards(dueCardsData);
      setError(null);
      
      // Reset selection state when loading new data
      setSelectedCardIds([]);
      setSelectAll(false);
    } catch (err) {
      setError('Failed to load flashcards');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Reset selection when changing tabs
    setSelectedCardIds([]);
    setSelectAll(false);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Normal': return 'info';
      case 'Hard': return 'error';
      default: return 'default';
    }
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Reset selection when changing search
    setSelectedCardIds([]);
    setSelectAll(false);
  };
  
  const handleCardTypeChange = (event: SelectChangeEvent) => {
    setSelectedCardType(event.target.value);
    // Reset selection when changing filter
    setSelectedCardIds([]);
    setSelectAll(false);
  };
  
  const handleSelectCard = (cardId: number) => {
    setSelectedCardIds(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        return [...prev, cardId];
      }
    });
  };
  
  const handleSelectAllCards = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      const visibleCards = filterCards(
        tabValue === 0 ? dueCards : cards,
        searchTerm,
        selectedCardType
      );
      setSelectedCardIds(visibleCards.map(card => card.ID));
    } else {
      setSelectedCardIds([]);
    }
  };
  
  const handleDeleteSelected = () => {
    if (selectedCardIds.length > 0) {
      setDeleteDialogOpen(true);
    }
  };
  
  const confirmDeleteSelected = async () => {
    if (!deckId || selectedCardIds.length === 0) return;
    
    setDeleteLoading(true);
    
    try {
      const numericDeckId = parseInt(deckId, 10);
      
      // Process deletions sequentially
      for (const cardId of selectedCardIds) {
        await DeleteFlashcard(numericDeckId, cardId);
      }
      
      // Reload data after deletions
      await loadData();
      setDeleteDialogOpen(false);
    } catch (err) {
      setError(`Error deleting cards: ${err}`);
      console.error('Error during batch deletion:', err);
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const filterCards = (
    cardsToFilter: models.models.FlashcardModel[],
    search: string,
    cardType: string
  ) => {
    return cardsToFilter.filter(card => {
      // Filter by search term
      const matchesSearch = search === '' || 
        card.Front.toLowerCase().includes(search.toLowerCase()) || 
        card.Back.toLowerCase().includes(search.toLowerCase());
      
      // Filter by card type
      const matchesType = cardType === 'all' || card.CardType === cardType;
      
      return matchesSearch && matchesType;
    });
  };

  const renderCardList = (cardsToRender: models.models.FlashcardModel[]) => {
    const filteredCards = filterCards(cardsToRender, searchTerm, selectedCardType);
    
    return (
      <List>
        {filteredCards.length > 0 ? (
          <>
            <ListItem>
              <ListItemIcon>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectAll}
                      onChange={handleSelectAllCards}
                      color="primary"
                    />
                  }
                  label="Select All"
                />
              </ListItemIcon>
            </ListItem>
            {filteredCards.map((card) => (
              <ListItem
                key={card.ID}
                divider
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {card.Difficulty && (
                      <Chip 
                        label={card.Difficulty} 
                        size="small" 
                        color={getDifficultyColor(card.Difficulty)}
                        sx={{ mr: 2 }}
                      />
                    )}
                    <IconButton 
                      edge="end" 
                      aria-label="preview"
                      onClick={() => {
                        if (card.CardType === 'feynman') {
                          navigate(`/feynman-review/${deckId}/${card.ID}`);
                        } else {
                          navigate(`/decks/${deckId}/cards/${card.ID}/review`);
                        }
                      }}
                    >
                      <PreviewIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="edit"
                      onClick={() => navigate(`/decks/${deckId}/cards/${card.ID}/edit`)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => navigate(`/decks/${deckId}/cards/${card.ID}/delete`)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemIcon>
                  <Checkbox
                    checked={selectedCardIds.includes(card.ID)}
                    onChange={() => handleSelectCard(card.ID)}
                    color="primary"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                      }}
                    >
                      {card.Front}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {card.CardType && (
                        <Chip 
                          label={card.CardType.charAt(0).toUpperCase() + card.CardType.slice(1)} 
                          size="small" 
                          color={card.CardType === 'feynman' ? 'secondary' : 'default'}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      {card.LastReviewed && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Last reviewed: {new Date(card.LastReviewed).toLocaleDateString()}
                        </Typography>
                      )}
                      {card.DueDate && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Due: {new Date(card.DueDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            No cards found matching your filters
          </Typography>
        )}
      </List>
    );
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
  
  const currentCards = tabValue === 0 ? dueCards : cards;
  const filteredCardCount = filterCards(currentCards, searchTerm, selectedCardType).length;

  return (
    <div className="p-4">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          {deck.Name} - Flashcards
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/decks/${deckId}/cards/new`)}
        >
          Add New Card
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Due (${dueCards.length})`} />
              <Tab label={`All Cards (${cards.length})`} />
            </Tabs>
          </Box>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search flashcards..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{xs: 12, md: 3 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="card-type-filter-label">Filter by Card Type</InputLabel>
                  <Select
                    labelId="card-type-filter-label"
                    value={selectedCardType}
                    onChange={handleCardTypeChange}
                    label="Filter by Card Type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="feynman">Feynman</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  disabled={selectedCardIds.length === 0}
                  onClick={handleDeleteSelected}
                  fullWidth
                >
                  Delete Selected ({selectedCardIds.length})
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filteredCardCount} of {currentCards.length} cards
          </Typography>

          <Box sx={{ mt: 2 }}>
            {tabValue === 0 && renderCardList(dueCards)}
            {tabValue === 1 && renderCardList(cards)}
          </Box>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog for Batch Delete */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete {selectedCardIds.length} selected flashcard{selectedCardIds.length !== 1 ? 's' : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteSelected} 
            color="error" 
            autoFocus
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Cards
