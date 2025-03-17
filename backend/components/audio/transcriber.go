package audio

import (
	"context"
	"fmt"
	"os"
	"path"
	"sync"

	"github.com/sashabaranov/go-openai"
)

var (
	openaiClient *openai.Client
	initOnce     sync.Once
	initialized  bool
)

// InitTranscriber initializes the transcriber with the OpenAI API key
func InitTranscriber(apiKey string) error {
	if apiKey == "" {
		return fmt.Errorf("OpenAI API key cannot be empty")
	}

	initOnce.Do(func() {
		openaiClient = openai.NewClient(apiKey)
		initialized = true
	})
	return nil
}

// TranscribeAudio takes a path to a WAV file and returns its transcription using OpenAI's Whisper API
func TranscribeAudio(filepath string) (string, error) {
	if !initialized {
		return "", fmt.Errorf("transcriber not initialized, call InitTranscriber first")
	}

	// Open and validate the audio file
	file, err := os.Open(filepath)
	if err != nil {
		return "", fmt.Errorf("failed to open audio file: %v", err)
	}
	defer file.Close()

	req := openai.AudioRequest{
		Model:    openai.Whisper1,
		FilePath: filepath,
	}

	resp, err := openaiClient.CreateTranscription(context.Background(), req)
	if err != nil {
		return "", fmt.Errorf("failed to transcribe audio: %v", err)
	}

	return resp.Text, nil
}

// GetLastRecordingPath returns the path to the last recorded audio file
func GetLastRecordingPath() (string, error) {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		return "", fmt.Errorf("failed to get cache directory: %v", err)
	}
	return path.Join(cacheDir, "bcards_recording.wav"), nil
}
