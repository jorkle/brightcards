package api

import (
	"errors"

	"github.com/jorkle/brightcards/backend/components/algorithms"
	"github.com/jorkle/brightcards/backend/components/database"
	"github.com/jorkle/brightcards/backend/components/models"
)

type Flashcard interface {
	Get(deckId int, cardId int) (models.FlashcardModel, error)
	GetAll(deckId int) ([]models.FlashcardModel, error)
	GetDue(deckId int) ([]models.FlashcardModel, error)
	Create(deckId int, front string, back string) (models.FlashcardModel, error)
	Update(card models.FlashcardModel) (models.FlashcardModel, error)
}

func (f *FlashcardImpl) Get(deckId int, cardId int) (models.FlashcardModel, error) {
	return database.Card(deckId, cardId)
}

func (f *FlashcardImpl) GetAll(deckId int) ([]models.FlashcardModel, error) {
	return database.Cards(deckId)
}

func (f *FlashcardImpl) GetDue(deckId int) ([]models.FlashcardModel, error) {
	return database.GetDueCards(deckId)
}

func (f *FlashcardImpl) Create(deckId int, front string, back string) (models.FlashcardModel, error) {
	card := models.FlashcardModel{
		DeckId: deckId,
		Front:  front,
		Back:   back,
	}
	return database.CreateCard(card)
}

func (f *FlashcardImpl) Update(card models.FlashcardModel) (models.FlashcardModel, error) {
	return database.UpdateCard(card)
}

func (f *FlashcardImpl) Delete(deckId int, cardId int) (models.FlashcardModel, error) {
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

func (f *FlashcardImpl) Review(deckId int, cardId int, grade string) error {
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
