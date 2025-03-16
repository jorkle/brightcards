package database

import (
	"database/sql"
	"errors"

	"github.com/jorkle/bcards/backend/components/api"
)

type Database interface {
	GetCards(deckId int) ([]api.FlashcardModel, error)
	GetCard(deckId int, cardId int) (api.FlashcardModel, error)
	CreateCard(card api.FlashcardModel) (api.FlashcardModel, error)
	UpdateCard(card api.FlashcardModel) (api.FlashcardModel, error)
	DeleteCard(deckId int, cardId int) (api.FlashcardModel, error)
	ReviewCard(deckId int, cardId int, grade string) error
}

var DB *sql.DB

func Card(deckId int, cardId int) (api.FlashcardModel, error) {

	if DB == nil {
		return api.FlashcardModel{}, errors.New("database not initialized")
	}

	results := DB.QueryRow("SELECT * FROM flashcards WHERE deck_id = ? AND id = ?", deckId, cardId)

	card := api.FlashcardModel{}
	err := results.Scan(&card.ID, &card.Front, &card.Back, &card.DeckId, &card.CreatedAt, &card.UpdatedAt)
	if err != nil {
		return api.FlashcardModel{}, err
	}
	return card, nil
}

func Cards(deckId int) ([]api.FlashcardModel, error) {
	if DB == nil {
		return []api.FlashcardModel{}, errors.New("database not initialized")
	}

	results, err := DB.Query("SELECT * FROM flashcards WHERE deck_id = ?", deckId)
	if err != nil {
		return []api.FlashcardModel{}, err
	}

	cards := []api.FlashcardModel{}
	for results.Next() {
		card := api.FlashcardModel{}
		err = results.Scan(&card.ID, &card.Front, &card.Back, &card.DeckId, &card.CreatedAt, &card.UpdatedAt)
		if err != nil {
			return []api.FlashcardModel{}, err
		}
		cards = append(cards, card)
	}
	return cards, nil
}

func CreateCard(card api.FlashcardModel) (api.FlashcardModel, error) {
	if DB == nil {
		return api.FlashcardModel{}, errors.New("database not initialized")
	}

	_, err := DB.Exec("INSERT INTO flashcards (front, back, deck_id, created_at, updated_at) VALUES (?, ?, ?)", card.Front, card.Back, card.DeckId)
	if err != nil {
		return api.FlashcardModel{}, err
	}

	return card, nil
}

func InitDatabase() error {
	if DB != nil {
		return errors.New("database already initialized")
	}
	_, err := DB.Exec("CREATE TABLE IF NOT EXISTS flashcards (id INTEGER PRIMARY KEY AUTOINCREMENT, front TEXT, back TEXT, deck_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, fsrs_stability REAL DEFAULT 0.0, fsrs_difficulty REAL DEFAULT 0.0, schedule_due DATETIME DEFAULT CURRENT_TIMESTAMP)")
	if err != nil {
		return err
	}
	_, err = DB.Exec("CREATE TABLE IF NOT EXISTS decks (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, purpose TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)")
	if err != nil {
		return err
	}
	return nil
}
