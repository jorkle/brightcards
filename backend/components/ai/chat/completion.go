package chat

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/sashabaranov/go-openai"
)

var (
	openaiClient *openai.Client
	initOnce     sync.Once
	initialized  bool
)

// AnalysisResponse represents the structured JSON response from the API
type AnalysisResponse struct {
	Strongspots string   `json:"strongspots"`
	Weakspots   string   `json:"weakspots"`
	Resources   []string `json:"resources"`
}

// InitChatCompletion initializes the chat completion with the OpenAI API key
func InitChatCompletion(apiKey string) error {
	if apiKey == "" {
		return fmt.Errorf("OpenAI API key cannot be empty")
	}

	initOnce.Do(func() {
		openaiClient = openai.NewClient(apiKey)
		initialized = true
	})
	return nil
}

// Replace this with your desired JSON schema for structured output
const jsonResponseFormat = `{
    "type": "object",
    "properties": {
        "strongspots": { "type": "string" },
        "weakspots": { "type": "string" },
        "resources": { "type": "array", "items": { "type": "string" } }
    },
    "required": [
        "strongspots",
        "weakspots",
        "resources"
    ]
}`

// Replace this with your system prompt
const systemPrompt = `The user will provide you with the text transcript of them explaining a concept to a imaginary child. This requires the user to be able to explain the concept in a way that is easy to understand for a child. The purpose of this is for two reasons:
1, to help the user improve at explaining the concept in a way that is easy to understand.
2, to identify the user's strongspots and weakspots.
Your job is to analyze the transcript and provide a detailed analysis of the user's performance in the form of "strongspots", and "weakspots". You will also provide a list of resources that the user can use to improve their understanding of the concept. The concept the user is explaining will be provided to you as a system prompt.
The output should be in the following JSON format:
{
    "type": "object",
    "properties": {
        "strongspots": { "type": "string" },
        "weakspots": { "type": "string" },
        "resources": { "type": "array", "items": { "type": "string" } }
    },
    "required": [
        "strongspots",
        "weakspots",
        "resources"
    ]
}
Ensure the response is always valid JSON matching this schema.`

// ProcessText sends the input text to GPT-4 for processing with structured output
func ProcessText(inputText string) (*AnalysisResponse, error) {
	if !initialized {
		return nil, fmt.Errorf("chat completion not initialized, call InitChatCompletion first")
	}

	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: systemPrompt,
		},
		{
			Role:    openai.ChatMessageRoleUser,
			Content: inputText,
		},
	}

	// Use the simpler JSON object format which is more widely supported
	req := openai.ChatCompletionRequest{
		Model:       openai.GPT4Turbo0125, // GPT-4 Turbo supports JSON output
		Messages:    messages,
		Temperature: 0.0, // Using 0 for more deterministic outputs
		ResponseFormat: &openai.ChatCompletionResponseFormat{
			Type: openai.ChatCompletionResponseFormatTypeJSONObject,
		},
	}

	resp, err := openaiClient.CreateChatCompletion(context.Background(), req)
	if err != nil {
		// If we get an error, try without the response format
		req.ResponseFormat = nil
		resp, err = openaiClient.CreateChatCompletion(context.Background(), req)
		if err != nil {
			return nil, fmt.Errorf("failed to get chat completion: %v", err)
		}
	}

	// Decode the JSON response into our struct
	var analysis AnalysisResponse
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &analysis); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	return &analysis, nil
}
