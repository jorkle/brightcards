package api

import (
	"errors"

	"github.com/jorkle/brightcards/backend/components/algorithms"
	"github.com/jorkle/brightcards/backend/components/database"
	"github.com/jorkle/brightcards/backend/components/models"
)

type Flashcard interface {
	GetFlashcard(deckId int, cardId int) (models.FlashcardModel, error)
	GetAllFlashcards(deckId int) ([]models.FlashcardModel, error)
	GetDueFlashcards(deckId int) ([]models.FlashcardModel, error)
	CreateFlashcard(deckId int, front string, back string) (models.FlashcardModel, error)
	UpdateFlashcard(card models.FlashcardModel) (models.FlashcardModel, error)
	DeleteFlashcard(deckId int, cardId int) (models.FlashcardModel, error)
	ReviewFlashcard(deckId int, cardId int, grade string) error
	UpdateGrading(grade string) error
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

func (f *FlashcardImpl) CreateFlashcard(deckId int, front string, back string) (models.FlashcardModel, error) {
	card := models.FlashcardModel{
		DeckId: deckId,
		Front:  front,
		Back:   back,
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

	if card.FSRSStability == 0 && card.FSRSDifficulty == 0 {
		stability, difficulty := algorithms.NextReviewFirst(gradeInt)
		return database.ReviewCard(deckId, cardId, stability, difficulty, stability)
	} else {
		nextInterval, newDifficulty, newStability := algorithms.NextReviewSubsequent(gradeInt, card.FSRSDifficulty, card.FSRSStability)
		return database.ReviewCard(deckId, cardId, newStability, newDifficulty, nextInterval)
	}
}

func (f *FlashcardImpl) UpdateGrading(grade string) error {
	// This method seems redundant with Review() since we need the deckId and cardId
	// to identify which card to update. Consider removing this method from the interface
	// or clarifying its intended use case.
	return errors.New("UpdateGrading is deprecated, use Review instead")
}

type FlashcardImpl struct{}

// Implement other interface methods on DeckImpl similarly
