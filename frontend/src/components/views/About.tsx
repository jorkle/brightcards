import React from 'react';
import * as runtime from '../../../wailsjs/runtime/runtime';
import { Typography, Card, CardContent, Link, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { W } from 'react-router/dist/development/fog-of-war-CvttGpNz';

function About() {
  return (
    <div className="p-4">
      <Typography paddingTop={4} paddingBottom={2} variant="h4" className="mb-4">
        About Bright Cards
      </Typography>
      <Grid container spacing={2}>
        {/* Top left: App description */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                Features
              </Typography>
              <Typography variant="body1">
                Bright Cards is a powerful open-source flashcard application leveraging AI and spaced repetition.

                <Box component="ul" sx={{ pl: 2 }}>
                  <li>AI-powered flashcard generation from the contents of your clipboard</li>
                  <li>Spaced repetition algorithm (FSRS v5) for optimal learning</li>
                  <li>Modified Feynman technique sessions for deeper understanding</li>
                  <li>Releases for Windows, MacOS, and Linux</li>
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Top right: Credits and links */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                Credits & Resources
              </Typography>
              <Typography variant="body1">
                <Box component="ul" sx={{ pl: 2 }}>
                  <li>Created by Kyle Walters (<Link onClick={() => runtime.BrowserOpenURL("https://github.com/jorkle")} target="_blank" rel="noopener">Jorkle</Link>)</li>
                  <li><Link onClick={() => runtime.BrowserOpenURL("https://github.com/jorkle/brightcards")} target="_blank" rel="noopener">GitHub Repository</Link></li>
                  <li><Link onClick={() => runtime.BrowserOpenURL("https://github.com/jorkle/brightcards/wiki")} target="_blank" rel="noopener">Documentation</Link></li>
                  <li>Powered by <Link onClick={() => runtime.BrowserOpenURL("https://github.com/open-spaced-repetition/fsrs4anki/wiki/abc-of-fsrs")} target="_blank" rel="noopener">FSRS v5 algorithm</Link></li>
                  <li>Built with React, Material-UI, and other open source technologies</li>
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Bottom left: GitHub issues */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                Support & Feedback
              </Typography>
              <Typography variant="body1">
                If you encounter any issues or have suggestions for improvement, please open an issue on our GitHub repository.

                <Box sx={{ mt: 2 }}>
                  To report an issue:
                  <Box component="ol" sx={{ pl: 2 }}>
                    <li>Go to the <Link onClick={() => runtime.BrowserOpenURL("https://github.com/jorkle/brightcards/issues")} target="_blank" rel="noopener">Issues page</Link></li>
                    <li>Click "New Issue"</li>
                    <li>Provide a clear description of the problem or suggestion</li>
                    <li>Include steps to reproduce any bugs you've found</li>
                  </Box>
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Bottom right: API disclaimers */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                Important Disclaimers
              </Typography>
              <Typography variant="body1" paragraph>
                Several features require an OpenAI API key to be entered in the settings. You must setup an API key with available usage credits via the OpenAI website to access these features. Go to <Link onClick={() => runtime.BrowserOpenURL("https://platform.openai.com/api-keys")} target="_blank" rel="noopener">OpenAI API Keys</Link> to create an API key.
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                Please note: Your OpenAI API key is stored locally in a SQLite file. The only outgoing network traffic is to the OpenAI API. You assume all responsibility for API credits used and the operation of this software.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}

export default About;
