package main

import (
	"embed"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/jorkle/brightcards/backend/components/ai/chat"
	"github.com/jorkle/brightcards/backend/components/algorithms"
	"github.com/jorkle/brightcards/backend/components/database"
	"github.com/jorkle/brightcards/backend/components/models"
	"github.com/jorkle/brightcards/backend/components/services"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
//go:embed all:frontend/src
var assets embed.FS

type FlashcardModel struct {
	ID             int       `json:"ID"`
	Front          string    `json:"Front"`
	Back           string    `json:"Back"`
	DeckId         int       `json:"DeckId"`
	CardType       string    `json:"CardType"` // "standard" or "feynman"
	Source         string    `json:"Source"`   // "manual", "generated", "rephrased", or "unspecified"
	FSRSDifficulty float64   `json:"FSRSDifficulty"`
	FSRSStability  float64   `json:"FSRSStability"`
	DueDate        time.Time `json:"DueDate"`
	LastReviewed   *string   `json:"LastReviewed,omitempty"`
	Difficulty     *string   `json:"Difficulty,omitempty"`
	CreatedAt      string    `json:"CreatedAt"`
	UpdatedAt      string    `json:"UpdatedAt"`
}

type DeckModel struct {
	ID                   int     `json:"ID"`
	Name                 string  `json:"Name"`
	Description          string  `json:"Description"`
	Purpose              string  `json:"Purpose"`
	EnableAutoRephrase   bool    `json:"EnableAutoRephrase"`
	EnableInitialismSwap bool    `json:"EnableInitialismSwap"`
	MaxRephrasedCards    int     `json:"MaxRephrasedCards"`
	CardCount            int     `json:"CardCount"`
	LastReviewed         *string `json:"LastReviewed,omitempty"`
	CreatedAt            string  `json:"CreatedAt"`
	UpdatedAt            string  `json:"UpdatedAt"`
}

// FeynmanService provides functionality for Feynman flashcards
type FeynmanService struct{}

// InitFeynmanService initializes the Feynman service with the OpenAI API key
func (f *FeynmanService) InitFeynmanService(apiKey string) error {
	return services.InitFeynmanService(apiKey)
}

// StartRecording starts recording audio
func (f *FeynmanService) StartRecording() error {
	return services.StartRecording()
}

// StopRecordingAndAnalyze stops recording and analyzes the recorded audio
func (f *FeynmanService) StopRecordingAndAnalyze() (*services.FeynmanAnalysis, error) {
	return services.StopRecordingAndAnalyze()
}

// CleanupRecording cleans up the recorder resources
func (f *FeynmanService) CleanupRecording() error {
	return services.CleanupRecording()
}

// SettingsService provides functionality for app settings
type SettingsService struct{}

// SaveOpenAIKey saves the OpenAI API key to the database
func (s *SettingsService) SaveOpenAIKey(apiKey string) error {
	err := database.SaveOpenAIKey(apiKey)
	if err != nil {
		return err
	}

	// Initialize the Feynman service with the new API key
	return services.InitFeynmanService(apiKey)
}

// GetOpenAIKey retrieves the OpenAI API key from the database
func (s *SettingsService) GetOpenAIKey() (string, error) {
	return database.GetOpenAIKey()
}

// AIService provides functionality for AI-powered features
type AIService struct{}

// GenerateFlashcards generates flashcards from text using the OpenAI API
func (a *AIService) GenerateFlashcards(inputText string, purpose string, maxCards int) ([]chat.Flashcard, error) {
	return chat.GenerateFlashcards(inputText, purpose, maxCards)
}

// RephraseService provides functionality for flashcard rephrasing
type RephraseService struct{}

// RephraseFlashcard rephrases a flashcard using AI
func (r *RephraseService) RephraseFlashcard(deckId int, cardId int, maxVariations int) (models.FlashcardModel, error) {
	// Get the original flashcard
	originalCard, err := database.Card(deckId, cardId)
	if err != nil {
		return models.FlashcardModel{}, fmt.Errorf("failed to get flashcard: %v", err)
	}

	// Get the deck to check if we should use initialism/acronym expansion
	deck, err := database.Deck(deckId)
	if err != nil {
		return models.FlashcardModel{}, fmt.Errorf("failed to get deck: %v", err)
	}

	// Call the AI service to rephrase the flashcard, passing the initialism swap flag from deck settings
	rephrasedCards, err := chat.RephraseFlashcard(&originalCard, deck.EnableInitialismSwap, maxVariations)
	if err != nil {
		return models.FlashcardModel{}, fmt.Errorf("failed to rephrase flashcard: %v", err)
	}

	// Make sure we have at least one rephrased card
	if len(rephrasedCards) == 0 {
		return models.FlashcardModel{}, fmt.Errorf("no rephrased flashcards were generated")
	}

	// Create a new card for the rephrased version
	newCard := models.FlashcardModel{
		Front:          rephrasedCards[0].Front,
		Back:           rephrasedCards[0].Back,
		DeckId:         deckId,
		CardType:       originalCard.CardType,
		Source:         "rephrased",
		FSRSDifficulty: 0, // Start with default difficulty
		FSRSStability:  0, // Start with default stability
	}

	// Create the new flashcard in the database
	createdCard, err := database.CreateCard(newCard)
	if err != nil {
		return models.FlashcardModel{}, fmt.Errorf("failed to create rephrased flashcard: %v", err)
	}

	return createdCard, nil
}

func main() {
	// Create an instance of the app structure
	app := NewApp()
	flashcard := &FlashcardImpl{}
	cardModel := &FlashcardModel{}
	deckModel := &DeckModel{}
	deck := &DeckImpl{}
	feynmanService := &FeynmanService{}
	settingsService := &SettingsService{}
	aiService := &AIService{}
	rephraseService := &RephraseService{}

	// Initialize the OpenAI API key from environment variable or database
	openaiApiKey := os.Getenv("OPENAI_API_KEY")

	// If no API key in environment variables, try to get it from the database
	if openaiApiKey == "" {
		dbApiKey, err := database.GetOpenAIKey()
		if err == nil && dbApiKey != "" {
			openaiApiKey = dbApiKey
			println("Using OpenAI API key from database")
		}
	}

	// Initialize the Feynman service if API key is available
	if openaiApiKey != "" {
		if err := services.InitFeynmanService(openaiApiKey); err != nil {
			println("Warning: Failed to initialize Feynman service:", err.Error())
		} else {
			println("Feynman service initialized successfully")
		}
	} else {
		println("Warning: OPENAI_API_KEY not found in environment variables or database. Feynman flashcard features will not work.")
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "bcards",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
			flashcard,
			cardModel,
			deckModel,
			deck,
			feynmanService,
			settingsService,
			aiService,
			rephraseService,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

type DeckImpl struct{}

type Deck interface {
	GetDeck(deckId int) (deck models.DeckModel, err error)
	GetAllDecks() (decks []models.DeckModel, err error)
	CreateDeck(name string, description string, purpose string) (deck models.DeckModel, err error)
	UpdateDeck(deckId int, name string, description string, purpose string) (deck models.DeckModel, err error)
	CreateDeckWithRephraseSettings(name string, description string, purpose string, enableAutoRephrase bool, enableInitialismSwap bool, maxRephrasedCards int) (deck models.DeckModel, err error)
	UpdateDeckWithRephraseSettings(deckId int, name string, description string, purpose string, enableAutoRephrase bool, enableInitialismSwap bool, maxRephrasedCards int) (deck models.DeckModel, err error)
	DeleteDeck(deckId int) error
	ExportDeck(deckId int, format string) (string, error)
}

func (d *DeckImpl) GetDeck(deckId int) (models.DeckModel, error) {
	dbDeck, err := database.Deck(deckId)
	if err != nil {
		return models.DeckModel{}, err
	}
	return models.DeckModel{
		ID:                   dbDeck.ID,
		Name:                 dbDeck.Name,
		Description:          dbDeck.Description,
		Purpose:              dbDeck.Purpose,
		EnableAutoRephrase:   dbDeck.EnableAutoRephrase,
		EnableInitialismSwap: dbDeck.EnableInitialismSwap,
		MaxRephrasedCards:    dbDeck.MaxRephrasedCards,
		CardCount:            dbDeck.CardCount,
		LastReviewed:         dbDeck.LastReviewed,
		CreatedAt:            dbDeck.CreatedAt,
		UpdatedAt:            dbDeck.UpdatedAt,
	}, nil
}

func (d *DeckImpl) GetAllDecks() ([]models.DeckModel, error) {
	dbDecks, err := database.Decks()
	if err != nil {
		return nil, err
	}

	decks := make([]models.DeckModel, len(dbDecks))
	for i, dbDeck := range dbDecks {
		decks[i] = models.DeckModel{
			ID:                   dbDeck.ID,
			Name:                 dbDeck.Name,
			Description:          dbDeck.Description,
			Purpose:              dbDeck.Purpose,
			EnableAutoRephrase:   dbDeck.EnableAutoRephrase,
			EnableInitialismSwap: dbDeck.EnableInitialismSwap,
			MaxRephrasedCards:    dbDeck.MaxRephrasedCards,
			CardCount:            dbDeck.CardCount,
			LastReviewed:         dbDeck.LastReviewed,
			CreatedAt:            dbDeck.CreatedAt,
			UpdatedAt:            dbDeck.UpdatedAt,
		}
	}
	return decks, nil
}

func (d *DeckImpl) CreateDeck(name string, description string, purpose string) (models.DeckModel, error) {
	dbDeck, err := database.CreateDeck(name, description, purpose)
	if err != nil {
		return models.DeckModel{}, err
	}
	return models.DeckModel{
		ID:                   dbDeck.ID,
		Name:                 dbDeck.Name,
		Description:          dbDeck.Description,
		Purpose:              dbDeck.Purpose,
		EnableAutoRephrase:   dbDeck.EnableAutoRephrase,
		EnableInitialismSwap: dbDeck.EnableInitialismSwap,
		MaxRephrasedCards:    dbDeck.MaxRephrasedCards,
		CardCount:            dbDeck.CardCount,
		LastReviewed:         dbDeck.LastReviewed,
		CreatedAt:            dbDeck.CreatedAt,
		UpdatedAt:            dbDeck.UpdatedAt,
	}, nil
}

func (d *DeckImpl) UpdateDeck(deckId int, name string, description string, purpose string) (models.DeckModel, error) {
	dbDeck, err := database.UpdateDeck(deckId, name, description, purpose)
	if err != nil {
		return models.DeckModel{}, err
	}
	return models.DeckModel{
		ID:                   dbDeck.ID,
		Name:                 dbDeck.Name,
		Description:          dbDeck.Description,
		Purpose:              dbDeck.Purpose,
		EnableAutoRephrase:   dbDeck.EnableAutoRephrase,
		EnableInitialismSwap: dbDeck.EnableInitialismSwap,
		MaxRephrasedCards:    dbDeck.MaxRephrasedCards,
		CardCount:            dbDeck.CardCount,
		LastReviewed:         dbDeck.LastReviewed,
		CreatedAt:            dbDeck.CreatedAt,
		UpdatedAt:            dbDeck.UpdatedAt,
	}, nil
}

func (d *DeckImpl) CreateDeckWithRephraseSettings(name string, description string, purpose string, enableAutoRephrase bool, enableInitialismSwap bool, maxRephrasedCards int) (models.DeckModel, error) {
	dbDeck, err := database.CreateDeckWithRephraseSettings(name, description, purpose, enableAutoRephrase, enableInitialismSwap, maxRephrasedCards)
	if err != nil {
		return models.DeckModel{}, err
	}
	return models.DeckModel{
		ID:                   dbDeck.ID,
		Name:                 dbDeck.Name,
		Description:          dbDeck.Description,
		Purpose:              dbDeck.Purpose,
		EnableAutoRephrase:   dbDeck.EnableAutoRephrase,
		EnableInitialismSwap: dbDeck.EnableInitialismSwap,
		MaxRephrasedCards:    dbDeck.MaxRephrasedCards,
		CardCount:            dbDeck.CardCount,
		LastReviewed:         dbDeck.LastReviewed,
		CreatedAt:            dbDeck.CreatedAt,
		UpdatedAt:            dbDeck.UpdatedAt,
	}, nil
}

func (d *DeckImpl) UpdateDeckWithRephraseSettings(deckId int, name string, description string, purpose string, enableAutoRephrase bool, enableInitialismSwap bool, maxRephrasedCards int) (models.DeckModel, error) {
	dbDeck, err := database.UpdateDeckWithRephraseSettings(deckId, name, description, purpose, enableAutoRephrase, enableInitialismSwap, maxRephrasedCards)
	if err != nil {
		return models.DeckModel{}, err
	}
	return models.DeckModel{
		ID:                   dbDeck.ID,
		Name:                 dbDeck.Name,
		Description:          dbDeck.Description,
		Purpose:              dbDeck.Purpose,
		EnableAutoRephrase:   dbDeck.EnableAutoRephrase,
		EnableInitialismSwap: dbDeck.EnableInitialismSwap,
		MaxRephrasedCards:    dbDeck.MaxRephrasedCards,
		CardCount:            dbDeck.CardCount,
		LastReviewed:         dbDeck.LastReviewed,
		CreatedAt:            dbDeck.CreatedAt,
		UpdatedAt:            dbDeck.UpdatedAt,
	}, nil
}

func (d *DeckImpl) DeleteDeck(deckId int) error {
	return database.DeleteDeck(deckId)
}

func (d *DeckImpl) ExportDeck(deckId int, format string) (string, error) {
	return "", errors.New("export not implemented")
}

type Flashcard interface {
	GetFlashcard(deckId int, cardId int) (models.FlashcardModel, error)
	GetAllFlashcards(deckId int) ([]models.FlashcardModel, error)
	GetDueFlashcards(deckId int) ([]models.FlashcardModel, error)
	CreateFlashcard(deckId int, front string, back string, cardType string) (models.FlashcardModel, error)
	UpdateFlashcard(card models.FlashcardModel) (models.FlashcardModel, error)
	DeleteFlashcard(deckId int, cardId int) (models.FlashcardModel, error)
	ReviewFlashcard(deckId int, cardId int, grade string) error
	UpdateGrading(grade string) error
	RephraseFlashcard(deckId int, cardId int, maxVariations int) (models.FlashcardModel, error)
}

func (f *FlashcardImpl) GetFlashcard(deckId int, cardId int) (models.FlashcardModel, error) {
	return database.Card(deckId, cardId)
}

func (f *FlashcardImpl) GetAllFlashcards(deckId int) ([]models.FlashcardModel, error) {
	return database.Cards(deckId)
}

func (f *FlashcardImpl) GetDueFlashcards(deckId int) ([]models.FlashcardModel, error) {
	return database.GetDueCards(deckId)
}

func (f *FlashcardImpl) CreateFlashcard(deckId int, front string, back string, cardType string) (models.FlashcardModel, error) {
	// If card type is not specified, default to "standard"
	if cardType == "" {
		cardType = "standard"
	}

	card := models.FlashcardModel{
		DeckId:   deckId,
		Front:    front,
		Back:     back,
		CardType: cardType,
	}
	return database.CreateCard(card)
}

func (f *FlashcardImpl) UpdateFlashcard(card models.FlashcardModel) (models.FlashcardModel, error) {
	return database.UpdateCard(card)
}

func (f *FlashcardImpl) DeleteFlashcard(deckId int, cardId int) (models.FlashcardModel, error) {
	card, err := database.Card(deckId, cardId)
	if err != nil {
		return models.FlashcardModel{}, err
	}

	err = database.DeleteCard(cardId)
	if err != nil {
		return models.FlashcardModel{}, err
	}

	return card, nil
}

func (f *FlashcardImpl) ReviewFlashcard(deckId int, cardId int, grade string) error {
	card, err := database.Card(deckId, cardId)
	if err != nil {
		return err
	}

	var gradeInt int
	switch grade {
	case "again":
		gradeInt = algorithms.GradeAgain
	case "hard":
		gradeInt = algorithms.GradeHard
	case "normal":
		gradeInt = algorithms.GradeGood
	case "easy":
		gradeInt = algorithms.GradeEasy
	default:
		return errors.New("invalid grade")
	}

	// Check if this is the first review for the card
	if card.FSRSStability == 0 && card.FSRSDifficulty == 0 {
		// For the first review, get the initial stability and difficulty
		stability, difficulty := algorithms.DoInitialGrading(card, gradeInt)

		// Set the current time as LastReviewed
		now := time.Now().UTC().Format(time.RFC3339)
		card.LastReviewed = &now

		// Update the card in the database with the new stability, difficulty, and due date
		return database.ReviewCard(deckId, cardId, stability, difficulty, stability)
	} else {
		// For subsequent reviews, use the DoSubsequentGrading function with the card's current state
		nextInterval, newDifficulty, newStability := algorithms.DoSubsequentGrading(&card, gradeInt)

		// Set the current time as LastReviewed
		now := time.Now().UTC().Format(time.RFC3339)
		card.LastReviewed = &now

		// Update the card in the database with the new values
		return database.ReviewCard(deckId, cardId, newStability, newDifficulty, nextInterval)
	}
}

func (f *FlashcardImpl) UpdateGrading(grade string) error {
	// This method seems redundant with Review() since we need the deckId and cardId
	// to identify which card to update. Consider removing this method from the interface
	// or clarifying its intended use case.
	return errors.New("UpdateGrading is deprecated, use Review instead")
}

func (f *FlashcardImpl) RephraseFlashcard(deckId int, cardId int, maxVariations int) (models.FlashcardModel, error) {
	// First get the original flashcard
	originalCard, err := database.Card(deckId, cardId)
	if err != nil {
		return models.FlashcardModel{}, fmt.Errorf("failed to get flashcard: %v", err)
	}

	// Get the deck to check if we should use initialism/acronym expansion
	deck, err := database.Deck(deckId)
	if err != nil {
		return models.FlashcardModel{}, fmt.Errorf("failed to get deck: %v", err)
	}

	// Call the AI service to rephrase the flashcard, passing the initialism swap flag from deck settings
	rephrasedCards, err := chat.RephraseFlashcard(&originalCard, deck.EnableInitialismSwap, maxVariations)
	if err != nil {
		return models.FlashcardModel{}, fmt.Errorf("failed to rephrase flashcard: %v", err)
	}

	// Make sure we have at least one rephrased card
	if len(rephrasedCards) == 0 {
		return models.FlashcardModel{}, fmt.Errorf("no rephrased flashcards were generated")
	}

	// Update the first flashcard in the database and return it
	// Note: We only update the first card for now
	updatedCard, err := database.UpdateCard(rephrasedCards[0])
	if err != nil {
		return models.FlashcardModel{}, fmt.Errorf("failed to update flashcard: %v", err)
	}

	return updatedCard, nil
}

type FlashcardImpl struct{}

// Implement other interface methods on DeckImpl similarly
