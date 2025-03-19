import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Switch,
  Tooltip,
  Paper
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PreviewIcon from '@mui/icons-material/Preview';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import * as models from '../../../wailsjs/go/models';
import { GetDeck } from '../../../wailsjs/go/main/DeckImpl';
import { GetAllFlashcards, GetDueFlashcards, DeleteFlashcard, CreateFlashcard, UpdateFlashcard } from '../../../wailsjs/go/main/FlashcardImpl';
import { GenerateFlashcards } from '../../../wailsjs/go/main/AIService';
import { RephraseFlashcard } from '../../../wailsjs/go/main/RephraseService';
import { debounce } from 'lodash';
import * as runtime from '../../../wailsjs/runtime/runtime'

// Define a type for MUI Chip color props
type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

// Define a type for backend Flashcard
interface BackendFlashcard {
  front: string;
  back: string;
}

// Define an interface for the generated flashcard
interface GeneratedFlashcard {
  front?: string;
  back?: string;
  Front?: string;
  Back?: string;
  DeckId?: number;
  CardType?: string;
}

// Define interface for FlashcardGenerationDialog props
interface FlashcardGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  generatedCards: GeneratedFlashcard[];
  loading: boolean;
  error: string | null;
  selectedCards: number[];
  setSelectedCards: React.Dispatch<React.SetStateAction<number[]>>;
  onAddCards: () => Promise<void>;
  deckId: string | undefined;
}

// CardItem component to optimize rendering of individual cards
const CardItem = React.memo(({
  card,
  isSelected,
  onSelect,
  onNavigate,
  getDifficultyColor
}: {
  card: models.models.FlashcardModel,
  isSelected: boolean,
  onSelect: (id: number) => void,
  onNavigate: (path: string) => void,
  getDifficultyColor: (difficulty?: string) => ChipColor
}) => {
  // Memoize derived values
  const deckId = useMemo(() => card.DeckId, [card.DeckId]);

  // Function to get color for source chip - memoize since it's used in rendering
  const getSourceColor = useCallback((source?: string): ChipColor => {
    switch (source) {
      case 'manual': return 'default';
      case 'generated': return 'primary';
      case 'rephrased': return 'secondary';
      default: return 'default';
    }
  }, []);

  // Format source for display - memoize since it's used in rendering
  const formatSource = useCallback((source?: string): string => {
    if (!source || source === 'unspecified') return 'Unspecified';
    return source.charAt(0).toUpperCase() + source.slice(1);
  }, []);

  const handlePreviewClick = useCallback(() => {
    if (card.CardType === 'feynman') {
      onNavigate(`/feynman-review/${deckId}/${card.ID}`);
    } else {
      onNavigate(`/decks/${deckId}/cards/${card.ID}/review`);
    }
  }, [card.CardType, card.ID, deckId, onNavigate]);

  const handleEditClick = useCallback(() => {
    onNavigate(`/decks/${deckId}/cards/${card.ID}/edit`);
  }, [card.ID, deckId, onNavigate]);

  const handleDeleteClick = useCallback(() => {
    onNavigate(`/decks/${deckId}/cards/${card.ID}/delete`);
  }, [card.ID, deckId, onNavigate]);

  const handleCheckboxChange = useCallback(() => {
    onSelect(card.ID);
  }, [card.ID, onSelect]);

  // Memoize secondary text to prevent recalculation on re-renders
  const secondaryContent = useMemo(() => {
    // Create individual content items rather than wrapping in a Box
    const contentItems = [];

    if (card.CardType) {
      contentItems.push(
        <Typography component="span" variant="body2" display="block" key="cardType">
          <Chip
            label={card.CardType.charAt(0).toUpperCase() + card.CardType.slice(1)}
            size="small"
            color={card.CardType === 'feynman' ? 'secondary' : 'default'}
            sx={{ mr: 1, mb: 1 }}
          />
        </Typography>
      );
    }

    if (card.Source) {
      contentItems.push(
        <Typography component="span" variant="body2" display="block" key="source">
          <Chip
            label={formatSource(card.Source)}
            size="small"
            color={getSourceColor(card.Source)}
            sx={{ mr: 1, mb: 1 }}
          />
        </Typography>
      );
    }

    if (card.LastReviewed) {
      contentItems.push(
        <Typography variant="caption" display="block" color="text.secondary" key="lastReviewed">
          Last reviewed: {new Date(card.LastReviewed).toLocaleDateString()}
        </Typography>
      );
    }

    if (card.DueDate) {
      contentItems.push(
        <Typography variant="caption" display="block" color="text.secondary" key="dueDate">
          Due: {new Date(card.DueDate).toLocaleDateString()}
        </Typography>
      );
    }

    return <>{contentItems}</>;
  }, [card.CardType, card.Source, card.LastReviewed, card.DueDate, formatSource, getSourceColor]);

  return (
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
            onClick={handlePreviewClick}
          >
            <PreviewIcon />
          </IconButton>
          <IconButton
            edge="end"
            aria-label="edit"
            onClick={handleEditClick}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={handleDeleteClick}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      }
    >
      <ListItemIcon>
        <Checkbox
          checked={isSelected}
          onChange={handleCheckboxChange}
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
        disableTypography
        secondary={
          <Box component="div" sx={{ mt: 1 }}>
            {secondaryContent}
          </Box>
        }
      />
    </ListItem>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo to prevent unnecessary re-renders
  return prevProps.isSelected === nextProps.isSelected &&
    prevProps.card.ID === nextProps.card.ID &&
    prevProps.card.Front === nextProps.card.Front &&
    prevProps.card.Back === nextProps.card.Back &&
    prevProps.card.Source === nextProps.card.Source &&
    prevProps.card.CardType === nextProps.card.CardType &&
    prevProps.card.LastReviewed === nextProps.card.LastReviewed &&
    prevProps.card.DueDate === nextProps.card.DueDate &&
    prevProps.card.Difficulty === nextProps.card.Difficulty;
});

// Flashcard generation dialog component
const FlashcardGenerationDialog = React.memo<FlashcardGenerationDialogProps>(({
  open,
  onClose,
  generatedCards,
  loading,
  error,
  selectedCards,
  setSelectedCards,
  onAddCards,
  deckId
}) => {
  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedCards(generatedCards.map((_, index: number) => index));
    } else {
      setSelectedCards([]);
    }
  }, [generatedCards, setSelectedCards]);

  const handleSelectCard = useCallback((index: number) => {
    setSelectedCards(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  }, [setSelectedCards]);

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Generating Flashcards</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
          <DialogContentText sx={{ textAlign: 'center' }}>
            Processing your clipboard content and generating flashcards...
          </DialogContentText>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Error Generating Flashcards</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <DialogContentText>
            There was an error processing your clipboard content. Please try again or ensure your content is appropriate for flashcard generation.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Generated Flashcards</DialogTitle>
      <DialogContent>
        {generatedCards.length > 0 ? (
          <>
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedCards.length === generatedCards.length}
                    onChange={handleSelectAll}
                    indeterminate={selectedCards.length > 0 && selectedCards.length < generatedCards.length}
                  />
                }
                label="Select All"
              />
              <Typography variant="body2" color="text.secondary">
                {selectedCards.length} of {generatedCards.length} selected
              </Typography>
            </Box>
            <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
              {generatedCards.map((card, index) => (
                <Paper key={index} elevation={1} sx={{ mb: 2, p: 2 }}>
                  <ListItem
                    sx={{
                      p: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch'
                    }}
                  >
                    <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                      <Checkbox
                        checked={selectedCards.includes(index)}
                        onChange={() => handleSelectCard(index)}
                        color="primary"
                      />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Card {index + 1}
                      </Typography>
                    </Box>
                    <Box sx={{ pl: 4, width: '100%' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Front:
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {card.Front || card.front}
                      </Typography>

                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Back:
                      </Typography>
                      <Typography variant="body1">
                        {card.Back || card.back}
                      </Typography>
                    </Box>
                  </ListItem>
                </Paper>
              ))}
            </List>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No flashcards could be generated. Try different clipboard content.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlaylistAddIcon />}
          disabled={selectedCards.length === 0}
          onClick={onAddCards}
        >
          Add Selected Flashcards
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// Memoized Cards component to prevent unnecessary re-renders
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

  // New state variables for flashcard generation
  const [maxCards, setMaxCards] = useState<number>(5);
  const [generationDialogOpen, setGenerationDialogOpen] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [selectedGeneratedCards, setSelectedGeneratedCards] = useState<number[]>([]);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // New state variables for rephrasing
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [rephraseError, setRephraseError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use refs to store previous values for comparison
  const prevTabValueRef = useRef(tabValue);
  const prevSearchTermRef = useRef(searchTerm);
  const prevSelectedCardTypeRef = useRef(selectedCardType);

  // Optimize debounce by memoizing it to prevent recreating it on each render
  const debouncedSearch = useMemo(() =>
    debounce((value: string) => {
      setSearchTerm(value);
      setSelectedCardIds([]);
      setSelectAll(false);
    }, 300)
    , []); // Empty dependencies to create it once

  // Load data only when needed
  const loadData = useCallback(async () => {
    if (!deckId) return;
    const numericDeckId = parseInt(deckId, 10);
    if (isNaN(numericDeckId)) {
      setError('Invalid deck ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use Promise.all to parallelize requests
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
  }, [deckId]); // Only recreate when deckId changes

  useEffect(() => {
    loadData();
  }, [loadData]); // Only reload when loadData changes

  // Further optimized filtering - create once and cache result
  const filterCards = useCallback((
    cardsToFilter: models.models.FlashcardModel[],
    search: string,
    cardType: string
  ) => {
    // Only perform filtering if necessary
    if (search === '' && cardType === 'all') {
      return cardsToFilter;
    }

    const lowerCaseSearch = search.toLowerCase();
    return cardsToFilter.filter(card => {
      // Filter by search term
      const matchesSearch = search === '' ||
        card.Front.toLowerCase().includes(lowerCaseSearch) ||
        card.Back.toLowerCase().includes(lowerCaseSearch);

      // Filter by card type
      const matchesType = cardType === 'all' || card.CardType === cardType;

      return matchesSearch && matchesType;
    });
  }, []);

  // Memoize filtered cards to prevent recalculation on every render
  const filteredDueCards = useMemo(() => {
    // Check if inputs have changed before recomputing
    const shouldRecompute =
      searchTerm !== prevSearchTermRef.current ||
      selectedCardType !== prevSelectedCardTypeRef.current;

    if (shouldRecompute || !prevTabValueRef.current) {
      prevSearchTermRef.current = searchTerm;
      prevSelectedCardTypeRef.current = selectedCardType;
      return filterCards(dueCards, searchTerm, selectedCardType);
    }
    return filterCards(dueCards, searchTerm, selectedCardType);
  }, [dueCards, searchTerm, selectedCardType, filterCards]);

  const filteredAllCards = useMemo(() => {
    // Check if inputs have changed before recomputing
    const shouldRecompute =
      searchTerm !== prevSearchTermRef.current ||
      selectedCardType !== prevSelectedCardTypeRef.current;

    if (shouldRecompute || !prevTabValueRef.current) {
      prevSearchTermRef.current = searchTerm;
      prevSelectedCardTypeRef.current = selectedCardType;
      return filterCards(cards, searchTerm, selectedCardType);
    }
    return filterCards(cards, searchTerm, selectedCardType);
  }, [cards, searchTerm, selectedCardType, filterCards]);

  // Only update prevTabValue when tabValue changes
  useEffect(() => {
    prevTabValueRef.current = tabValue;
  }, [tabValue]);

  // Memoize currentFilteredCards to prevent unnecessary recalculation
  const currentFilteredCards = useMemo(() =>
    tabValue === 0 ? filteredDueCards : filteredAllCards,
    [tabValue, filteredDueCards, filteredAllCards]
  );

  // Memoized handlers to prevent recreating functions on each render
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Reset selection when changing tabs
    setSelectedCardIds([]);
    setSelectAll(false);
  }, []);

  const getDifficultyColor = useCallback((difficulty?: string): ChipColor => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Normal': return 'info';
      case 'Hard': return 'error';
      default: return 'default';
    }
  }, []);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  }, [debouncedSearch]);

  const handleCardTypeChange = useCallback((event: SelectChangeEvent) => {
    setSelectedCardType(event.target.value);
    // Reset selection when changing filter
    setSelectedCardIds([]);
    setSelectAll(false);
  }, []);

  const handleSelectCard = useCallback((cardId: number) => {
    setSelectedCardIds(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        return [...prev, cardId];
      }
    });
  }, []);

  const handleSelectAllCards = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [tabValue, dueCards, cards, searchTerm, selectedCardType, filterCards]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedCardIds.length > 0) {
      setDeleteDialogOpen(true);
    }
  }, [selectedCardIds]);

  const confirmDeleteSelected = useCallback(async () => {
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
  }, [deckId, selectedCardIds, loadData]);

  // Handle max cards input change
  const handleMaxCardsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMaxCards(value);
    }
  }, []);

  // New function to handle clipboard flashcard generation
  const handleGenerateFromClipboard = useCallback(async () => {
    if (!deckId || !deck) return;

    try {
      // Read clipboard content
      const clipboardContent = await runtime.ClipboardGetText();

      if (!clipboardContent.trim()) {
        setGenerationError('Clipboard is empty. Please copy some text first.');
        setGenerationDialogOpen(true);
        return;
      }

      // Open dialog and show loading state
      setGenerationLoading(true);
      setGenerationError(null);
      setGeneratedCards([]);
      setSelectedGeneratedCards([]);
      setGenerationDialogOpen(true);

      // Call backend to generate flashcards
      const maxCardsValue = maxCards || 5;
      const flashcards = await GenerateFlashcards(clipboardContent, deck.Purpose, maxCardsValue);

      if (flashcards && flashcards.length > 0) {
        // Convert to frontend format
        const formattedCards = flashcards.map((card: BackendFlashcard) => ({
          Front: card.front,
          Back: card.back,
          DeckId: parseInt(deckId, 10),
          CardType: 'standard'
        }));

        setGeneratedCards(formattedCards);
        // Auto-select all cards by default
        setSelectedGeneratedCards(Array.from({ length: formattedCards.length }, (_, i) => i));
      } else {
        setGenerationError('No flashcards could be generated from your clipboard content.');
      }
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setGenerationError(`Error generating flashcards: ${err}`);
    } finally {
      setGenerationLoading(false);
    }
  }, [deckId, deck, maxCards]);

  // Function to add selected generated flashcards to the deck
  const handleAddGeneratedCards = useCallback(async () => {
    if (!deckId || selectedGeneratedCards.length === 0) return;

    setGenerationLoading(true);
    const numericDeckId = parseInt(deckId, 10);

    try {
      // Add each selected flashcard to the database
      for (const index of selectedGeneratedCards) {
        const card = generatedCards[index];
        const front = card.Front || card.front || '';
        const back = card.Back || card.back || '';

        // First create the card using CreateFlashcard which doesn't accept source
        const createdCard = await CreateFlashcard(
          numericDeckId,
          front,
          back,
          'standard' // Card type
        );

        // Then update the newly created card to set source to "generated"
        if (createdCard && createdCard.ID) {
          createdCard.Source = 'generated';
          await UpdateFlashcard(createdCard);
        }
      }

      // Reload the cards after adding
      await loadData();

      // Close the dialog
      setGenerationDialogOpen(false);
      setGeneratedCards([]);
      setSelectedGeneratedCards([]);
    } catch (err) {
      console.error('Error adding flashcards:', err);
      setGenerationError(`Error adding flashcards: ${err}`);
    } finally {
      setGenerationLoading(false);
    }
  }, [deckId, selectedGeneratedCards, generatedCards, loadData]);

  // New function to handle rephrasing selected cards
  const handleRephraseCards = useCallback(async () => {
    if (selectedCardIds.length === 0) {
      setError('Please select at least one card to rephrase');
      return;
    }

    setIsRephrasing(true);
    setRephraseError(null);

    try {
      // Get the deck to check rephrasing settings - only if we have cards to rephrase
      const numericDeckId = parseInt(deckId as string, 10);
      if (isNaN(numericDeckId)) {
        throw new Error("Invalid deck ID");
      }

      // Use the deck from state if available to avoid API call
      const deckData = deck || await GetDeck(numericDeckId);

      if (!deckData.EnableAutoRephrase) {
        setRephraseError('Automatic rephrasing is disabled for this deck. Please enable it in deck settings.');
        setIsRephrasing(false);
        return;
      }

      let successCount = 0;
      // Process each selected card in batches to improve performance
      const batchSize = 3; // Process 3 cards at a time
      const batches = Math.ceil(selectedCardIds.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, selectedCardIds.length);
        const batch = selectedCardIds.slice(start, end);

        // Process batch in parallel
        const results = await Promise.allSettled(
          batch.map(cardId =>
            RephraseFlashcard(numericDeckId, cardId, deckData.MaxRephrasedCards)
          )
        );

        // Count successful operations
        successCount += results.filter(result => result.status === 'fulfilled').length;
      }

      // Refresh the cards list
      await loadData();

      // Clear selection
      setSelectedCardIds([]);

      // Show success message
      setSuccess(`Created ${successCount} new rephrased flashcard${successCount !== 1 ? 's' : ''}. The original cards have been preserved.`);

    } catch (err) {
      console.error('Error rephrasing cards:', err);
      setRephraseError(`Failed to rephrase cards: ${err}`);
    } finally {
      setIsRephrasing(false);
    }
  }, [selectedCardIds, deckId, deck, loadData]);

  // Function to render the card list efficiently
  const renderCardList = useCallback((filteredCards: models.models.FlashcardModel[]) => {
    // Early return for empty lists to avoid unnecessary processing
    if (filteredCards.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
          No cards found matching your filters
        </Typography>
      );
    }

    // Create card items with optimized rendering
    const cardItems = filteredCards.map((card) => (
      <CardItem
        key={card.ID}
        card={card}
        isSelected={selectedCardIds.includes(card.ID)}
        onSelect={handleSelectCard}
        onNavigate={handleNavigate}
        getDifficultyColor={getDifficultyColor}
      />
    ));

    return (
      <List sx={{ width: '100%' }}>
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
        {cardItems}
      </List>
    );
  }, [
    selectAll,
    handleSelectAllCards,
    selectedCardIds,
    handleSelectCard,
    handleNavigate,
    getDifficultyColor
  ]);

  // Memoize UI elements to prevent unnecessary re-renders
  // These should only be created if deck exists
  const deckNameHeading = useMemo(() => {
    if (!deck) return null;
    return (
      <Typography variant="h4">
        {deck.Name} - Flashcards
      </Typography>
    );
  }, [deck]);

  const cardControls = useMemo(() => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <TextField
        type="number"
        label="Max Cards"
        value={maxCards}
        onChange={handleMaxCardsChange}
        size="small"
        sx={{ width: '100px', mr: 1 }}
        inputProps={{ min: 1, max: 20 }}
      />
      <Tooltip title="Generate flashcards from clipboard">
        <IconButton
          color="primary"
          aria-label="generate from clipboard"
          onClick={handleGenerateFromClipboard}
          sx={{
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 1
          }}
        >
          <LightbulbIcon />
          <ContentPasteIcon fontSize="small" sx={{ position: 'absolute', bottom: 0, right: 0, fontSize: '0.7rem' }} />
        </IconButton>
      </Tooltip>
    </Box>
  ), [maxCards, handleMaxCardsChange, handleGenerateFromClipboard]);

  const actionButtons = useMemo(() => (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => navigate(`/decks/${deckId}/cards/new`)}
      >
        Add New Card
      </Button>

      <Button
        variant="contained"
        color="secondary"
        startIcon={<LightbulbIcon />}
        onClick={handleRephraseCards}
        disabled={selectedCardIds.length === 0 || isRephrasing}
        sx={{ ml: 2 }}
      >
        {isRephrasing ? 'Rephrasing...' : 'Rephrase Selected'}
      </Button>
    </>
  ), [navigate, deckId, handleRephraseCards, selectedCardIds.length, isRephrasing]);

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
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Fixed header section - approximately 20% of the vertical space */}
      <div style={{
        flexShrink: 0,
        marginBottom: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          {deckNameHeading}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {cardControls}
            {actionButtons}
          </Box>
        </Box>

        {/* Alert messages */}
        {rephraseError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRephraseError(null)}>
            {rephraseError}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
      </div>

      {/* Card section - approximately 80% of the vertical space with scrolling */}
      <Card sx={{
        maxHeight: 'calc(80vh - 120px)', // Set a maximum height (80% of viewport minus header space)
        display: 'flex',
        flexDirection: 'column',
        mb: 0
      }}>
        <CardContent sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <Box sx={{
            borderBottom: 1,
            borderColor: 'divider',
            flexShrink: 0
          }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Due (${dueCards.length})`} />
              <Tab label={`All Cards (${cards.length})`} />
            </Tabs>
          </Box>

          <Box sx={{
            mt: 2,
            mb: 2,
            flexShrink: 0
          }}>
            <Grid container spacing={2} alignItems="center">
              <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search flashcards..."
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
              <Grid size={{ xs: 12, md: 3 }}>
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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexShrink: 0 }}>
            Showing {currentFilteredCards.length} of {tabValue === 0 ? dueCards.length : cards.length} cards
          </Typography>

          <Box sx={{
            flexGrow: 1,
            overflow: 'auto' // This is the only scrollable area
          }}>
            {renderCardList(currentFilteredCards)}
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

      {/* New Dialog for Flashcard Generation */}
      <FlashcardGenerationDialog
        open={generationDialogOpen}
        onClose={() => setGenerationDialogOpen(false)}
        generatedCards={generatedCards}
        loading={generationLoading}
        error={generationError}
        selectedCards={selectedGeneratedCards}
        setSelectedCards={setSelectedGeneratedCards}
        onAddCards={handleAddGeneratedCards}
        deckId={deckId}
      />
    </div>
  );
}

// Export memoized component
export default React.memo(Cards);
