package database

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path"

	"github.com/jorkle/brightcards/backend/components/api"
	_ "github.com/mattn/go-sqlite3"
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

func CreateDatabaseFile() error {
	sqliteFile := "bcards.db"
	userConfigDir, err := os.UserConfigDir()
	if err != nil {
		return err
	}
	storageDir := path.Join(userConfigDir, "brightcards")
	err = os.MkdirAll(storageDir, 0755)
	if err != nil {
		return err
	}
	_, err = os.Create(path.Join(storageDir, sqliteFile))
	if err != nil {
		return err
	}
	return nil
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

func Init() error {
	sqliteFile := "bcards.db"
	userConfigDir, err := os.UserConfigDir()
	if err != nil {
		return err
	}
	storageDir := path.Join(userConfigDir, "brightcards")
	DB, err = sql.Open("sqlite3", fmt.Sprintf("file:%s", path.Join(storageDir, sqliteFile)))
	if os.IsNotExist(err) {
		CreateDatabaseFile()
		erro := InitDatabase()
		if erro != nil {
			return erro
		}
		return nil
	} else if err != nil {
		return err
	}

	err = InitDatabase()
	if err != nil {
		return err
	}
	return nil
}

func Card(deckId int, cardId int) (api.FlashcardModel, error) {
	if DB != nil {
		Init()
	}

	results := DB.QueryRow("SELECT * FROM flashcards WHERE deck_id = ? AND id = ?", deckId, cardId)

	card := api.FlashcardModel{}
	err := results.Scan(&card.ID, &card.Front, &card.Back, &card.DeckId, &card.CreatedAt, &card.UpdatedAt)
	if err != nil {
		return api.FlashcardModel{}, err
	}
	return card, nil
}

func UpdateCard(card api.FlashcardModel) (api.FlashcardModel, error) {
	if DB == nil {
		Init()
	}

	_, err := DB.Exec("UPDATE flashcards SET front = ?, back = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deck_id = ?", card.Front, card.Back, card.ID, card.DeckId)
	if err != nil {
		return api.FlashcardModel{}, err
	}

	return card, nil
}

func Cards(deckId int) ([]api.FlashcardModel, error) {
	if DB == nil {
		Init()
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
		Init()
	}

	_, err := DB.Exec("INSERT INTO flashcards (front, back, deck_id, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", card.Front, card.Back, card.DeckId)
	if err != nil {
		return api.FlashcardModel{}, err
	}

	return card, nil
}
