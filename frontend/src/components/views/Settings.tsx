import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormGroup,
  Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { SaveOpenAIKey, GetOpenAIKey } from '../../../wailsjs/go/main/SettingsService';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Rephrasing settings
  const [enableAutoRephrase, setEnableAutoRephrase] = useState<boolean>(false);
  const [enableInitialismSwap, setEnableInitialismSwap] = useState<boolean>(false);
  const [maxRephrasedCards, setMaxRephrasedCards] = useState<number>(3);

  useEffect(() => {
    // Load the API key from the database when the component mounts
    loadApiKey();

    // Load rephrasing settings from localStorage
    loadRephraseSettings();
  }, []);

  const loadApiKey = async () => {
    try {
      setLoading(true);
      const key = await GetOpenAIKey();
      setApiKey(key || '');
    } catch (err) {
      console.error('Failed to load API key:', err);
      setSnackbarMessage('Failed to load API key: ' + err);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const loadRephraseSettings = () => {
    const settings = localStorage.getItem('rephraseSettings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      setEnableAutoRephrase(parsedSettings.enableAutoRephrase ?? false);
      setEnableInitialismSwap(parsedSettings.enableInitialismSwap ?? false);
      setMaxRephrasedCards(parsedSettings.maxRephrasedCards ?? 3);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // Save API key
      await SaveOpenAIKey(apiKey);

      // Save rephrasing settings to localStorage
      const rephraseSettings = {
        enableAutoRephrase,
        enableInitialismSwap,
        maxRephrasedCards
      };
      localStorage.setItem('rephraseSettings', JSON.stringify(rephraseSettings));

      // Show success message
      setSnackbarMessage('Settings saved successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSnackbarMessage('Failed to save settings: ' + err);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleMaxCardsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setMaxRephrasedCards(isNaN(value) ? 0 : Math.max(1, Math.min(10, value)));
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            API Keys
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                OpenAI API Key
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Enter your OpenAI API key to enable Feynman flashcard functionality.
                Your API key is used for audio transcription and analysis.
              </Typography>

              <TextField
                fullWidth
                label="OpenAI API Key"
                variant="outlined"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-..."
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle api key visibility"
                        onClick={handleToggleShowApiKey}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
            Your API key is stored locally and is only used to make requests to OpenAI's services.
            The key is never shared with any third parties.
          </Alert>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Flashcard Rephrasing Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="body2" color="text.secondary" paragraph>
            These settings control the default behavior for flashcard rephrasing. These settings can be overridden on a per-deck basis.
          </Typography>

          <FormGroup sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enableAutoRephrase}
                    onChange={(e) => setEnableAutoRephrase(e.target.checked)}
                  />
                }
                label="Enable AI rephrasing by default"
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
                    checked={enableInitialismSwap}
                    onChange={(e) => setEnableInitialismSwap(e.target.checked)}
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
                value={maxRephrasedCards}
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
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 