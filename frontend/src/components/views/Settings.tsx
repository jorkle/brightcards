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
  CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import { SaveOpenAIKey, GetOpenAIKey } from '../../../wailsjs/go/main/SettingsService';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    // Load the API key from the database when the component mounts
    loadApiKey();
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

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await SaveOpenAIKey(apiKey);
      
      // Show success message
      setSnackbarMessage('Settings saved successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Failed to save API key:', err);
      setSnackbarMessage('Failed to save API key: ' + err);
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
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
                onClick={handleSaveSettings}
                disabled={!apiKey.trim().startsWith('sk-') || saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          )}
          
          <Alert severity="info" sx={{ mt: 3 }}>
            Your API key is stored locally and is only used to make requests to OpenAI's services.
            The key is never shared with any third parties.
          </Alert>
        </CardContent>
      </Card>

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