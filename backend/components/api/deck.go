package api

import (
	"errors"

	"github.com/jorkle/brightcards/backend/components/database"
	"github.com/jorkle/brightcards/backend/components/models"
)

type DeckImpl struct{}

type Deck interface {
	GetDeck(deckId int) (deck models.DeckModel, err error)
	GetAllDecks() (decks []models.DeckModel, err error)
	CreateDeck(name string, description string, purpose string) (deck models.DeckModel, err error)
	UpdateDeck(deckId int, name string, description string, purpose string) (deck models.DeckModel, err error)
	DeleteDeck(deckId int) error
	ExportDeck(deckId int, format string) (string, error)
}

func (d *DeckImpl) GetDeck(deckId int) (models.DeckModel, error) {
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

func (d *DeckImpl) GetAllDecks() ([]models.DeckModel, error) {
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

func (d *DeckImpl) CreateDeck(name string, description string, purpose string) (models.DeckModel, error) {
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

func (d *DeckImpl) UpdateDeck(deckId int, name string, description string, purpose string) (models.DeckModel, error) {
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

func (d *DeckImpl) DeleteDeck(deckId int) error {
	return database.DeleteDeck(deckId)
}

func (d *DeckImpl) ExportDeck(deckId int, format string) (string, error) {
	return "", errors.New("export not implemented")
}
