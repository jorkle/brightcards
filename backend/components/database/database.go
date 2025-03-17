package database

import (
	"database/sql"
	"errors"
	"os"
	"path"

	"github.com/jorkle/brightcards/backend/components/models"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

type DeckModel struct {
	ID           int
	Name         string
	Description  string
	Purpose      string
	CardCount    int
	LastReviewed *string
	CreatedAt    string
	UpdatedAt    string
}

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

func Init() error {
	if DB != nil {
		return nil
	}
	sqliteFile := "bcards.db"
	userConfigDir, err := os.UserConfigDir()
	if err != nil {
		return err
	}
	storageDir := path.Join(userConfigDir, "brightcards")
	_, err = os.Stat(path.Join(storageDir, sqliteFile))
	if errors.Is(err, os.ErrNotExist) {
		CreateDatabaseFile()
	}
	DB, err = sql.Open("sqlite3", path.Join(storageDir, sqliteFile))
	if err != nil {
		return err
	}

	InitDatabase()
	return nil
}

func InitDatabase() error {
	_, err := DB.Exec("CREATE TABLE IF NOT EXISTS flashcards (id INTEGER PRIMARY KEY AUTOINCREMENT, front TEXT, back TEXT, deck_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, fsrs_stability REAL DEFAULT 0.0, fsrs_difficulty REAL DEFAULT 0.0, schedule_due REAL DEFAULT 0.0)")
	if err != nil {
		return err
	}
	_, err = DB.Exec("CREATE TABLE IF NOT EXISTS decks (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, purpose TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)")
	if err != nil {
		return err
	}
	return nil
}

func Card(deckId int, cardId int) (models.FlashcardModel, error) {
	if err := Init(); err != nil {
		return models.FlashcardModel{}, err
	}

	results := DB.QueryRow("SELECT * FROM flashcards WHERE deck_id = ? AND id = ?", deckId, cardId)

	card := models.FlashcardModel{}
	err := results.Scan(&card.ID, &card.Front, &card.Back, &card.DeckId, &card.CreatedAt, &card.UpdatedAt, &card.FSRSStability, &card.FSRSDifficulty, &card.DaysTillDue)
	if err != nil {
		return models.FlashcardModel{}, err
	}
	return card, nil
}

func UpdateCard(card models.FlashcardModel) (models.FlashcardModel, error) {
	if err := Init(); err != nil {
		return models.FlashcardModel{}, err
	}

	_, err := DB.Exec("UPDATE flashcards SET front = ?, back = ?, fsrs_stability = ?, fsrs_difficulty = ?, schedule_due = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deck_id = ?", card.Front, card.Back, card.FSRSStability, card.FSRSDifficulty, card.DaysTillDue, card.ID, card.DeckId)
	if err != nil {
		return models.FlashcardModel{}, err
	}

	return card, nil
}

func Cards(deckId int) ([]models.FlashcardModel, error) {
	if err := Init(); err != nil {
		return []models.FlashcardModel{}, err
	}

	results, err := DB.Query("SELECT * FROM flashcards WHERE deck_id = ?", deckId)
	if err != nil {
		return []models.FlashcardModel{}, err
	}
	defer results.Close()
	cards := []models.FlashcardModel{}
	for results.Next() {
		card := models.FlashcardModel{}

		err = results.Scan(&card.ID, &card.Front, &card.Back, &card.DeckId, &card.CreatedAt, &card.UpdatedAt, &card.FSRSStability, &card.FSRSDifficulty, &card.DaysTillDue)
		if err != nil {
			return []models.FlashcardModel{}, err
		}
		cards = append(cards, card)
	}
	return cards, nil
}

func CreateCard(card models.FlashcardModel) (models.FlashcardModel, error) {
	if err := Init(); err != nil {
		return models.FlashcardModel{}, err
	}

	result, err := DB.Exec("INSERT INTO flashcards (front, back, deck_id, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", card.Front, card.Back, card.DeckId)
	if err != nil {
		return models.FlashcardModel{}, err
	}

	cardId, err := result.LastInsertId()
	if err != nil {
		return models.FlashcardModel{}, err
	}

	return Card(card.DeckId, int(cardId))
}

func UpdateGrading(cardId int, stability float64, difficulty float64, daysTillDue float64) error {
	if err := Init(); err != nil {
		return err
	}

	_, err := DB.Exec("UPDATE flashcards SET fsrs_stability = ?, fsrs_difficulty = ?, schedule_due = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		stability, difficulty, daysTillDue, cardId)
	if err != nil {
		return err
	}

	return nil
}

func Deck(deckId int) (DeckModel, error) {
	if err := Init(); err != nil {
		return DeckModel{}, err
	}

	result := DB.QueryRow("SELECT * FROM decks WHERE id = ?", deckId)

	deck := DeckModel{}
	err := result.Scan(&deck.ID, &deck.Name, &deck.Description, &deck.Purpose, &deck.CreatedAt, &deck.UpdatedAt)
	if err != nil {
		return DeckModel{}, err
	}

	return deck, nil
}

func Decks() ([]DeckModel, error) {
	if err := Init(); err != nil {
		return []DeckModel{}, err
	}

	results, err := DB.Query("SELECT * FROM decks")
	if err != nil {
		return []DeckModel{}, err
	}
	defer results.Close()
	decks := []DeckModel{}
	for results.Next() {
		deck := DeckModel{}
		err = results.Scan(&deck.ID, &deck.Name, &deck.Description, &deck.Purpose, &deck.CreatedAt, &deck.UpdatedAt)
		if err != nil {
			return []DeckModel{}, err
		}
		decks = append(decks, deck)
	}
	return decks, nil
}

func CreateDeck(name string, description string, purpose string) (DeckModel, error) {
	if err := Init(); err != nil {
		return DeckModel{}, err
	}

	result, err := DB.Exec("INSERT INTO decks (name, description, purpose, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
		name, description, purpose)
	if err != nil {
		return DeckModel{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return DeckModel{}, err
	}

	return Deck(int(id))
}

func UpdateDeck(deckId int, name string, description string, purpose string) (DeckModel, error) {
	if err := Init(); err != nil {
		return DeckModel{}, err
	}

	_, err := DB.Exec("UPDATE decks SET name = ?, description = ?, purpose = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		name, description, purpose, deckId)
	if err != nil {
		return DeckModel{}, err
	}

	return Deck(deckId)
}

func DeleteDeck(deckId int) error {
	if err := Init(); err != nil {
		return err
	}

	// First delete all flashcards associated with the deck
	_, err := DB.Exec("DELETE FROM flashcards WHERE deck_id = ?", deckId)
	if err != nil {
		return err
	}

	// Then delete the deck itself
	_, err = DB.Exec("DELETE FROM decks WHERE id = ?", deckId)
	if err != nil {
		return err
	}

	return nil
}

func GetDueCards(deckId int) ([]models.FlashcardModel, error) {
	if err := Init(); err != nil {
		return []models.FlashcardModel{}, err
	}

	results, err := DB.Query("SELECT * FROM flashcards WHERE deck_id = ? AND schedule_due <= CURRENT_TIMESTAMP", deckId)
	if err != nil {
		return []models.FlashcardModel{}, err
	}
	defer results.Close()
	cards := []models.FlashcardModel{}
	for results.Next() {
		card := models.FlashcardModel{}
		err = results.Scan(&card.ID, &card.Front, &card.Back, &card.DeckId, &card.CreatedAt, &card.UpdatedAt,
			&card.FSRSStability, &card.FSRSDifficulty, &card.DaysTillDue)
		if err != nil {
			return []models.FlashcardModel{}, err
		}
		cards = append(cards, card)
	}
	return cards, nil
}

func ReviewCard(deckId int, cardId int, stability float64, difficulty float64, daysTillDue float64) error {
	if err := Init(); err != nil {
		return err
	}

	_, err := DB.Exec("UPDATE flashcards SET fsrs_stability = ?, fsrs_difficulty = ?, schedule_due = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deck_id = ?",
		stability, difficulty, daysTillDue, cardId, deckId)
	if err != nil {
		return err
	}

	return nil
}

func DeleteCard(cardId int) error {
	if err := Init(); err != nil {
		return err
	}

	_, err := DB.Exec("DELETE FROM flashcards WHERE id = ?", cardId)
	if err != nil {
		return err
	}

	return nil
}
