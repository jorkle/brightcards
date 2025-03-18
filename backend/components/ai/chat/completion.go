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

// Flashcard type needs to be defined before being used
type Flashcard struct {
	Front string `json:"front"`
	Back  string `json:"back"`
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

func GenerateFlashcards(inputText string, purpose string, maxCards int) ([]Flashcard, error) {
	if !initialized {
		return nil, fmt.Errorf("chat completion not initialized, call InitChatCompletion first")
	}
	sysPrompt := `You turn information into one or more flashcards. A 'memory target' is the 'concept', 'idea', 'fact', or 'information' that the flashcard is intended to require you to remember. Given this definition, each flashcard must have only one 'memory target' per flashcard. Flashcards must only contain text. 

User input will contain three items:
1. The 'use_case' - this defines the purpose for which the information needs to be memorized
2. The 'information' - this is the source material to generate flashcards from
3. The 'max_cards' - the maximum number of flashcards to generate (not a required minimum)

Only generate flashcards that are relevant to the purpose. The max_cards should be treated as a cut-off point, not a requirement.

Your output must be a valid JSON with either:
1. A "flashcards" array containing objects with "front" and "back" properties:
{
  "flashcards": [
    {"front": "Question text", "back": "Answer text"},
    {"front": "Another question", "back": "Another answer"}
  ]
}

OR

2. A direct array of flashcard objects:
[
  {"front": "Question text", "back": "Answer text"},
  {"front": "Another question", "back": "Another answer"}
]`

	type userInput struct {
		UseCase     string `json:"use_case"`
		Information string `json:"information"`
		MaxCards    int    `json:"max_cards"`
	}
	uInput := userInput{
		UseCase:     purpose,
		Information: inputText,
		MaxCards:    maxCards,
	}

	userInputJSON, err := json.Marshal(uInput)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal user input: %v", err)
	}

	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: sysPrompt,
		},
		{
			Role:    openai.ChatMessageRoleUser,
			Content: string(userInputJSON),
		},
	}

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
		return nil, fmt.Errorf("failed to get chat completion: %v", err)
	}

	type generatedFlashcard struct {
		Front string `json:"front"`
		Back  string `json:"back"`
	}

	type generatedFlashcards struct {
		Flashcards []generatedFlashcard `json:"flashcards"`
	}

	var flashcardsResponse generatedFlashcards
	err = json.Unmarshal([]byte(resp.Choices[0].Message.Content), &flashcardsResponse)
	if err != nil || len(flashcardsResponse.Flashcards) == 0 {
		// Try alternate format - the response might be an array of flashcards directly
		var directFlashcards []generatedFlashcard
		err = json.Unmarshal([]byte(resp.Choices[0].Message.Content), &directFlashcards)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal generated flashcards: %v", err)
		}

		// If we got flashcards in the direct format
		if len(directFlashcards) > 0 {
			result := make([]Flashcard, len(directFlashcards))
			for i, card := range directFlashcards {
				result[i] = Flashcard{
					Front: card.Front,
					Back:  card.Back,
				}
			}
			return result, nil
		}

		return nil, fmt.Errorf("no flashcards found in response")
	}

	// Convert from the nested format to the return type
	result := make([]Flashcard, len(flashcardsResponse.Flashcards))
	for i, card := range flashcardsResponse.Flashcards {
		result[i] = Flashcard{
			Front: card.Front,
			Back:  card.Back,
		}
	}

	return result, nil
}

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
