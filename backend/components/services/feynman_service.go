package services

import (
	"fmt"
	"os"

	"github.com/jorkle/brightcards/backend/components/ai/chat"
	"github.com/jorkle/brightcards/backend/components/audio"
)

// FeynmanAnalysis represents the analysis of a Feynman flashcard explanation
type FeynmanAnalysis struct {
	Strongspots string   `json:"strongspots"`
	Weakspots   string   `json:"weakspots"`
	Resources   []string `json:"resources"`
}

// InitFeynmanService initializes the Feynman service with the OpenAI API key
func InitFeynmanService(apiKey string) error {
	// Initialize the audio transcriber
	if err := audio.InitTranscriber(apiKey); err != nil {
		return fmt.Errorf("failed to initialize transcriber: %v", err)
	}

	// Initialize the chat completion service
	if err := chat.InitChatCompletion(apiKey); err != nil {
		return fmt.Errorf("failed to initialize chat completion: %v", err)
	}

	return nil
}

// StartRecording starts recording audio
func StartRecording() error {
	recorder, err := audio.GetRecorder()
	if err != nil {
		return fmt.Errorf("failed to get recorder: %v", err)
	}

	return recorder.StartRecording()
}

// StopRecordingAndAnalyze stops recording and analyzes the recorded audio
func StopRecordingAndAnalyze() (*FeynmanAnalysis, error) {
	// Stop recording
	recorder, err := audio.GetRecorder()
	if err != nil {
		return nil, fmt.Errorf("failed to get recorder: %v", err)
	}

	if err := recorder.StopRecording(); err != nil {
		return nil, fmt.Errorf("failed to stop recording: %v", err)
	}

	// Get the path to the recording
	recordingPath, err := audio.GetLastRecordingPath()
	if err != nil {
		return nil, fmt.Errorf("failed to get recording path: %v", err)
	}

	// Check if the file exists
	if _, err := os.Stat(recordingPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("recording file not found: %v", err)
	}

	// Transcribe the audio
	transcription, err := audio.TranscribeAudio(recordingPath)
	if err != nil {
		return nil, fmt.Errorf("failed to transcribe audio: %v", err)
	}

	// Analyze the transcription
	analysis, err := chat.ProcessText(transcription)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze transcription: %v", err)
	}

	// Convert to our service-specific type
	result := &FeynmanAnalysis{
		Strongspots: analysis.Strongspots,
		Weakspots:   analysis.Weakspots,
		Resources:   analysis.Resources,
	}

	return result, nil
}

// CleanupRecording cleans up the recorder resources
func CleanupRecording() error {
	recorder, err := audio.GetRecorder()
	if err != nil {
		return fmt.Errorf("failed to get recorder: %v", err)
	}

	recorder.Cleanup()
	return nil
}
