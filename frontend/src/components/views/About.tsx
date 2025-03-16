import React from 'react';
import { Typography, Card, CardContent, Link } from '@mui/material';
import Grid from '@mui/material/Grid2';

function About() {
  return (
    <div className="p-4">
      <Typography paddingTop={4} paddingBottom={2} variant="h4" className="mb-4">
        About Bright Cards
      </Typography>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                Spaced Repetition Algorithm
              </Typography>
              <Typography variant="body1">
                Our app leverages a spaced repetition algorithm to optimize your learning and retention. This method ensures that you review flashcards at the optimal intervals to maximize memory retention.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                AI-Powered Flashcard Generation
              </Typography>
              <Typography variant="body1">
                Generate flashcards from various sources such as audio dictation, web pages, clipboard, and YouTube videos. Our AI helps in creating accurate and relevant flashcards for your study needs.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                Duplicate Detection
              </Typography>
              <Typography variant="body1">
                Our AI detects and removes duplicate flashcards to keep your deck clean and efficient.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                Feynman Sessions
              </Typography>
              <Typography variant="body1">
                Engage in Feynman sessions where you explain flashcards out loud as if teaching a child. The AI identifies gaps in your understanding and helps you improve your knowledge.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                About the Author
              </Typography>
              <Typography variant="body1">
                This app was created by Kyle Walters (<Link href="https://github.com/jorkle">Jorkle</Link>), a passionate developer dedicated to enhancing learning experiences through technology.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-2">
                GitHub Repository
              </Typography>
              <Typography variant="body1">
                Check out the source code and contribute to the project on our <Link href="https://github.com/jorkle/brightcards" target="_blank" rel="noopener">GitHub repository</Link>.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}

export default About;
