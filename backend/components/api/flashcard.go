package api

import (
	"database/sql"
	"errors"
)

type Flashcard interface {
	Get(deckId int, cardId int) (FlashcardModel, error)
	GetAll(deckId int) ([]FlashcardModel, error)
	GetDue(deckId int) ([]FlashcardModel, error)
	Create(deckId int, front string, back string) (FlashcardModel, error)
	Update(card FlashcardModel) (FlashcardModel, error)
	Delete(deckId int, cardId int) (FlashcardModel, error)
	Review(deckId int, cardId int, grade string) error
}

var DB *sql.DB

func (f *FlashcardModel) Get(deckId int, cardId int) (FlashcardModel, error) {

	if DB == nil {
		return FlashcardModel{}, errors.New("database not initialized")
	}

	card, err := database.GetCard(deckId, cardId)
	if err != nil {
		return FlashcardModel{}, err
	}

	return card, nil
}
