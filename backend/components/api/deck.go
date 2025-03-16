package api

import (
	"errors"

	"github.com/jorkle/brightcards/backend/components/database"
	"github.com/jorkle/brightcards/backend/components/models"
)

type DeckImpl struct{}

type Deck interface {
	Get(deckId int) (deck models.DeckModel, err error)
	GetAll() (decks []models.DeckModel, err error)
	Create(name string, description string, purpose string) (deck models.DeckModel, err error)
	Update(deckId int, name string, description string, purpose string) (deck models.DeckModel, err error)
	Delete(deckId int) error
	Export(deckId int, format string) (string, error)
}

func (d *DeckImpl) Get(deckId int) (models.DeckModel, error) {
	dbDeck, err := database.Deck(deckId)
	if err != nil {
		return models.DeckModel{}, err
	}
	return models.DeckModel{
		ID:           dbDeck.ID,
		Name:         dbDeck.Name,
		Description:  dbDeck.Description,
		Purpose:      dbDeck.Purpose,
		CardCount:    dbDeck.CardCount,
		LastReviewed: dbDeck.LastReviewed,
		CreatedAt:    dbDeck.CreatedAt,
		UpdatedAt:    dbDeck.UpdatedAt,
	}, nil
}

func (d *DeckImpl) GetAll() ([]models.DeckModel, error) {
	dbDecks, err := database.Decks()
	if err != nil {
		return nil, err
	}

	decks := make([]models.DeckModel, len(dbDecks))
	for i, dbDeck := range dbDecks {
		decks[i] = models.DeckModel{
			ID:           dbDeck.ID,
			Name:         dbDeck.Name,
			Description:  dbDeck.Description,
			Purpose:      dbDeck.Purpose,
			CardCount:    dbDeck.CardCount,
			LastReviewed: dbDeck.LastReviewed,
			CreatedAt:    dbDeck.CreatedAt,
			UpdatedAt:    dbDeck.UpdatedAt,
		}
	}
	return decks, nil
}

func (d *DeckImpl) Create(name string, description string, purpose string) (models.DeckModel, error) {
	dbDeck, err := database.CreateDeck(name, description, purpose)
	if err != nil {
		return models.DeckModel{}, err
	}
	return models.DeckModel{
		ID:           dbDeck.ID,
		Name:         dbDeck.Name,
		Description:  dbDeck.Description,
		Purpose:      dbDeck.Purpose,
		CardCount:    dbDeck.CardCount,
		LastReviewed: dbDeck.LastReviewed,
		CreatedAt:    dbDeck.CreatedAt,
		UpdatedAt:    dbDeck.UpdatedAt,
	}, nil
}

func (d *DeckImpl) Update(deckId int, name string, description string, purpose string) (models.DeckModel, error) {
	dbDeck, err := database.UpdateDeck(deckId, name, description, purpose)
	if err != nil {
		return models.DeckModel{}, err
	}
	return models.DeckModel{
		ID:           dbDeck.ID,
		Name:         dbDeck.Name,
		Description:  dbDeck.Description,
		Purpose:      dbDeck.Purpose,
		CardCount:    dbDeck.CardCount,
		LastReviewed: dbDeck.LastReviewed,
		CreatedAt:    dbDeck.CreatedAt,
		UpdatedAt:    dbDeck.UpdatedAt,
	}, nil
}

func (d *DeckImpl) Delete(deckId int) error {
	return database.DeleteDeck(deckId)
}

func (d *DeckImpl) Export(deckId int, format string) (string, error) {
	return "", errors.New("export not implemented")
}
