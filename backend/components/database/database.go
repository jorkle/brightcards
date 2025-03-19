package database

import (
	"database/sql"
	"errors"
	"os"
	"path"
	"time"

	"github.com/jorkle/brightcards/backend/components/models"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

type DeckModel struct {
	ID                   int
	Name                 string
	Description          string
	Purpose              string
	EnableAutoRephrase   bool
	EnableInitialismSwap bool
	MaxRephrasedCards    int
	CardCount            int
	LastReviewed         *string
	CreatedAt            string
	UpdatedAt            string
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
	_, err := DB.Exec("CREATE TABLE IF NOT EXISTS flashcards (id INTEGER PRIMARY KEY AUTOINCREMENT, front TEXT, back TEXT, deck_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, fsrs_stability REAL DEFAULT 0.0, fsrs_difficulty REAL DEFAULT 0.0, schedule_due DATETIME DEFAULT CURRENT_TIMESTAMP, card_type TEXT DEFAULT 'standard', last_reviewed DATETIME, source TEXT DEFAULT 'unspecified')")
	if err != nil {
		return err
	}
	_, err = DB.Exec("CREATE TABLE IF NOT EXISTS decks (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, purpose TEXT, enable_auto_rephrase BOOLEAN DEFAULT 0, enable_initialism_swap BOOLEAN DEFAULT 0, max_rephrased_cards INTEGER DEFAULT 3, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)")
	if err != nil {
		return err
	}

	// Create settings table if it doesn't exist
	_, err = DB.Exec("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)")
	if err != nil {
		return err
	}

	// Add columns to existing databases
	err = addCardTypeColumn()
	if err != nil {
		return err
	}

	err = addLastReviewedColumn()
	if err != nil {
		return err
	}

	// Add source column to flashcards
	err = addSourceColumn()
	if err != nil {
		return err
	}

	// Add rephrase settings columns to decks
	err = addDeckRephraseSettingsColumns()
	if err != nil {
		return err
	}

	return nil
}

func Card(deckId int, cardId int) (models.FlashcardModel, error) {
	if err := Init(); err != nil {
		return models.FlashcardModel{}, err
	}

	// Check if card_type column exists and add it if it doesn't
	err := addCardTypeColumn()
	if err != nil {
		return models.FlashcardModel{}, err
	}

	// Check if last_reviewed column exists and add it if it doesn't
	err = addLastReviewedColumn()
	if err != nil {
		return models.FlashcardModel{}, err
	}

	// Check if source column exists and add it if it doesn't
	err = addSourceColumn()
	if err != nil {
		return models.FlashcardModel{}, err
	}

	// Include last_reviewed in the query
	results := DB.QueryRow("SELECT id, front, back, deck_id, created_at, updated_at, fsrs_stability, fsrs_difficulty, schedule_due, card_type, last_reviewed, source FROM flashcards WHERE deck_id = ? AND id = ?", deckId, cardId)

	card := models.FlashcardModel{}
	var cardType sql.NullString
	var lastReviewed sql.NullString
	var source sql.NullString
	err = results.Scan(&card.ID, &card.Front, &card.Back, &card.DeckId, &card.CreatedAt, &card.UpdatedAt, &card.FSRSStability, &card.FSRSDifficulty, &card.DueDate, &cardType, &lastReviewed, &source)
	if err != nil {
		return models.FlashcardModel{}, err
	}

	// Set default card type if null
	if cardType.Valid {
		card.CardType = cardType.String
	} else {
		card.CardType = "standard"
	}

	// Set LastReviewed if not null
	if lastReviewed.Valid {
		card.LastReviewed = &lastReviewed.String
	}

	// Set Source if not null
	if source.Valid {
		card.Source = source.String
	} else {
		card.Source = "unspecified"
	}

	return card, nil
}

func UpdateCard(card models.FlashcardModel) (models.FlashcardModel, error) {
	if err := Init(); err != nil {
		return models.FlashcardModel{}, err
	}

	// Check if card_type column exists and add it if it doesn't
	err := addCardTypeColumn()
	if err != nil {
		return models.FlashcardModel{}, err
	}

	// Check if source column exists and add it if it doesn't
	err = addSourceColumn()
	if err != nil {
		return models.FlashcardModel{}, err
	}

	// If source is not specified, default to "manual"
	if card.Source == "" {
		card.Source = "manual"
	}

	// Update the card
	_, err = DB.Exec("UPDATE flashcards SET front = ?, back = ?, card_type = ?, source = ?, fsrs_stability = ?, fsrs_difficulty = ?, schedule_due = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		card.Front, card.Back, card.CardType, card.Source, card.FSRSStability, card.FSRSDifficulty, card.DueDate, card.ID)
	if err != nil {
		return models.FlashcardModel{}, err
	}

	return Card(card.DeckId, card.ID)
}

func Cards(deckId int) ([]models.FlashcardModel, error) {
	if err := Init(); err != nil {
		return []models.FlashcardModel{}, err
	}

	// Check if card_type column exists and add it if it doesn't
	err := addCardTypeColumn()
	if err != nil {
		return []models.FlashcardModel{}, err
	}

	// Check if last_reviewed column exists and add it if it doesn't
	err = addLastReviewedColumn()
	if err != nil {
		return []models.FlashcardModel{}, err
	}

	// Check if source column exists and add it if it doesn't
	err = addSourceColumn()
	if err != nil {
		return []models.FlashcardModel{}, err
	}

	results, err := DB.Query("SELECT id, front, back, deck_id, created_at, updated_at, fsrs_stability, fsrs_difficulty, schedule_due, card_type, last_reviewed, source FROM flashcards WHERE deck_id = ?", deckId)
	if err != nil {
		return []models.FlashcardModel{}, err
	}
	defer results.Close()
	cards := []models.FlashcardModel{}
	for results.Next() {
		card := models.FlashcardModel{}
		var cardType sql.NullString
		var lastReviewed sql.NullString
		var source sql.NullString

		err = results.Scan(&card.ID, &card.Front, &card.Back, &card.DeckId, &card.CreatedAt, &card.UpdatedAt, &card.FSRSStability, &card.FSRSDifficulty, &card.DueDate, &cardType, &lastReviewed, &source)
		if err != nil {
			return []models.FlashcardModel{}, err
		}

		// Set default card type if null
		if cardType.Valid {
			card.CardType = cardType.String
		} else {
			card.CardType = "standard"
		}

		// Set LastReviewed if not null
		if lastReviewed.Valid {
			card.LastReviewed = &lastReviewed.String
		}

		// Set Source if not null
		if source.Valid {
			card.Source = source.String
		} else {
			card.Source = "unspecified"
		}

		cards = append(cards, card)
	}
	return cards, nil
}

func CreateCard(card models.FlashcardModel) (models.FlashcardModel, error) {
	if err := Init(); err != nil {
		return models.FlashcardModel{}, err
	}

	// Check if card_type column exists and add it if it doesn't
	err := addCardTypeColumn()
	if err != nil {
		return models.FlashcardModel{}, err
	}

	// Check if source column exists and add it if it doesn't
	err = addSourceColumn()
	if err != nil {
		return models.FlashcardModel{}, err
	}

	// If card type is not specified, default to "standard"
	if card.CardType == "" {
		card.CardType = "standard"
	}

	// If source is not specified, default to "manual"
	if card.Source == "" {
		card.Source = "manual"
	}

	result, err := DB.Exec("INSERT INTO flashcards (front, back, deck_id, card_type, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
		card.Front, card.Back, card.DeckId, card.CardType, card.Source)
	if err != nil {
		return models.FlashcardModel{}, err
	}

	cardId, err := result.LastInsertId()
	if err != nil {
		return models.FlashcardModel{}, err
	}

	return Card(card.DeckId, int(cardId))
}

func Deck(deckId int) (DeckModel, error) {
	if err := Init(); err != nil {
		return DeckModel{}, err
	}

	// Check if rephrasing settings columns exist and add them if they don't
	err := addDeckRephraseSettingsColumns()
	if err != nil {
		return DeckModel{}, err
	}

	// Update the SQL query to include the new columns
	result := DB.QueryRow(`
		SELECT id, name, description, purpose, enable_auto_rephrase, 
		enable_initialism_swap, max_rephrased_cards, created_at, updated_at 
		FROM decks WHERE id = ?
	`, deckId)

	deck := DeckModel{}
	var enableAutoRephrase sql.NullBool
	var enableInitialismSwap sql.NullBool
	var maxRephrasedCards sql.NullInt64

	err = result.Scan(
		&deck.ID, &deck.Name, &deck.Description, &deck.Purpose,
		&enableAutoRephrase, &enableInitialismSwap, &maxRephrasedCards,
		&deck.CreatedAt, &deck.UpdatedAt,
	)
	if err != nil {
		return DeckModel{}, err
	}

	// Set defaults for null values
	if enableAutoRephrase.Valid {
		deck.EnableAutoRephrase = enableAutoRephrase.Bool
	} else {
		deck.EnableAutoRephrase = false
	}

	if enableInitialismSwap.Valid {
		deck.EnableInitialismSwap = enableInitialismSwap.Bool
	} else {
		deck.EnableInitialismSwap = false
	}

	if maxRephrasedCards.Valid {
		deck.MaxRephrasedCards = int(maxRephrasedCards.Int64)
	} else {
		deck.MaxRephrasedCards = 3 // Default value
	}

	// Count cards for this deck
	var cardCount int
	countErr := DB.QueryRow("SELECT COUNT(*) FROM flashcards WHERE deck_id = ?", deckId).Scan(&cardCount)
	if countErr == nil {
		deck.CardCount = cardCount
	}

	// Get the last reviewed date for this deck (most recent card review)
	var lastReviewed sql.NullString
	lastReviewedErr := DB.QueryRow(`
		SELECT last_reviewed FROM flashcards 
		WHERE deck_id = ? AND last_reviewed IS NOT NULL 
		ORDER BY last_reviewed DESC LIMIT 1
	`, deckId).Scan(&lastReviewed)

	if lastReviewedErr == nil && lastReviewed.Valid {
		deck.LastReviewed = &lastReviewed.String
	}

	return deck, nil
}

func Decks() ([]DeckModel, error) {
	if err := Init(); err != nil {
		return []DeckModel{}, err
	}

	// Check if rephrasing settings columns exist and add them if they don't
	err := addDeckRephraseSettingsColumns()
	if err != nil {
		return []DeckModel{}, err
	}

	// Update the SQL query to include the new columns
	results, err := DB.Query(`
		SELECT id, name, description, purpose, enable_auto_rephrase, 
		enable_initialism_swap, max_rephrased_cards, created_at, updated_at 
		FROM decks
	`)
	if err != nil {
		return []DeckModel{}, err
	}
	defer results.Close()

	decks := []DeckModel{}
	for results.Next() {
		deck := DeckModel{}
		var enableAutoRephrase sql.NullBool
		var enableInitialismSwap sql.NullBool
		var maxRephrasedCards sql.NullInt64

		err = results.Scan(
			&deck.ID, &deck.Name, &deck.Description, &deck.Purpose,
			&enableAutoRephrase, &enableInitialismSwap, &maxRephrasedCards,
			&deck.CreatedAt, &deck.UpdatedAt,
		)
		if err != nil {
			return []DeckModel{}, err
		}

		// Set defaults for null values
		if enableAutoRephrase.Valid {
			deck.EnableAutoRephrase = enableAutoRephrase.Bool
		} else {
			deck.EnableAutoRephrase = false
		}

		if enableInitialismSwap.Valid {
			deck.EnableInitialismSwap = enableInitialismSwap.Bool
		} else {
			deck.EnableInitialismSwap = false
		}

		if maxRephrasedCards.Valid {
			deck.MaxRephrasedCards = int(maxRephrasedCards.Int64)
		} else {
			deck.MaxRephrasedCards = 3 // Default value
		}

		// Count cards for this deck
		var cardCount int
		countErr := DB.QueryRow("SELECT COUNT(*) FROM flashcards WHERE deck_id = ?", deck.ID).Scan(&cardCount)
		if countErr == nil {
			deck.CardCount = cardCount
		}

		// Get the last reviewed date for this deck (most recent card review)
		var lastReviewed sql.NullString
		lastReviewedErr := DB.QueryRow(`
			SELECT last_reviewed FROM flashcards 
			WHERE deck_id = ? AND last_reviewed IS NOT NULL 
			ORDER BY last_reviewed DESC LIMIT 1
		`, deck.ID).Scan(&lastReviewed)

		if lastReviewedErr == nil && lastReviewed.Valid {
			deck.LastReviewed = &lastReviewed.String
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

// CreateDeckWithRephraseSettings creates a new deck with rephrasing settings
func CreateDeckWithRephraseSettings(name string, description string, purpose string, enableAutoRephrase bool, enableInitialismSwap bool, maxRephrasedCards int) (DeckModel, error) {
	if err := Init(); err != nil {
		return DeckModel{}, err
	}

	// Check if rephrasing settings columns exist and add them if they don't
	err := addDeckRephraseSettingsColumns()
	if err != nil {
		return DeckModel{}, err
	}

	result, err := DB.Exec(`
		INSERT INTO decks (
			name, 
			description, 
			purpose, 
			enable_auto_rephrase,
			enable_initialism_swap,
			max_rephrased_cards,
			created_at, 
			updated_at
		) 
		VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
		name, description, purpose, enableAutoRephrase, enableInitialismSwap, maxRephrasedCards)
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

// UpdateDeckWithRephraseSettings updates a deck with rephrasing settings
func UpdateDeckWithRephraseSettings(deckId int, name string, description string, purpose string, enableAutoRephrase bool, enableInitialismSwap bool, maxRephrasedCards int) (DeckModel, error) {
	if err := Init(); err != nil {
		return DeckModel{}, err
	}

	// Check if rephrasing settings columns exist and add them if they don't
	err := addDeckRephraseSettingsColumns()
	if err != nil {
		return DeckModel{}, err
	}

	_, err = DB.Exec(`
		UPDATE decks SET 
		name = ?, 
		description = ?, 
		purpose = ?, 
		enable_auto_rephrase = ?,
		enable_initialism_swap = ?,
		max_rephrased_cards = ?,
		updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?`,
		name, description, purpose, enableAutoRephrase, enableInitialismSwap, maxRephrasedCards, deckId)
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

	// Check if card_type column exists and add it if it doesn't
	err := addCardTypeColumn()
	if err != nil {
		return []models.FlashcardModel{}, err
	}

	// Check if last_reviewed column exists and add it if it doesn't
	err = addLastReviewedColumn()
	if err != nil {
		return []models.FlashcardModel{}, err
	}

	// Check if source column exists and add it if it doesn't
	err = addSourceColumn()
	if err != nil {
		return []models.FlashcardModel{}, err
	}

	results, err := DB.Query("SELECT id, front, back, deck_id, created_at, updated_at, fsrs_stability, fsrs_difficulty, schedule_due, card_type, last_reviewed, source FROM flashcards WHERE deck_id = ? AND schedule_due <= datetime('now')", deckId)
	if err != nil {
		return []models.FlashcardModel{}, err
	}
	defer results.Close()
	cards := []models.FlashcardModel{}
	for results.Next() {
		card := models.FlashcardModel{}
		var cardType sql.NullString
		var lastReviewed sql.NullString
		var source sql.NullString

		err = results.Scan(&card.ID, &card.Front, &card.Back, &card.DeckId, &card.CreatedAt, &card.UpdatedAt, &card.FSRSStability, &card.FSRSDifficulty, &card.DueDate, &cardType, &lastReviewed, &source)
		if err != nil {
			return []models.FlashcardModel{}, err
		}

		// Set default card type if null
		if cardType.Valid {
			card.CardType = cardType.String
		} else {
			card.CardType = "standard"
		}

		// Set LastReviewed if not null
		if lastReviewed.Valid {
			card.LastReviewed = &lastReviewed.String
		}

		// Set Source if not null
		if source.Valid {
			card.Source = source.String
		} else {
			card.Source = "unspecified"
		}

		cards = append(cards, card)
	}
	return cards, nil
}

func ReviewCard(deckId int, cardId int, stability float64, difficulty float64, daysTillDue float64) error {
	if err := Init(); err != nil {
		return err
	}
	// Verify the card exists
	_, err := Card(deckId, cardId)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	nowStr := now.Format(time.RFC3339)
	var scheduledDue time.Time

	if daysTillDue <= 0 {
		// For "Again" grade, schedule for immediate review
		scheduledDue = now
	} else {
		// Convert days to duration including fractional parts
		hours := daysTillDue * 24
		minutes := (hours - float64(int(hours))) * 60
		duration := time.Duration(int(hours))*time.Hour + time.Duration(int(minutes))*time.Minute
		scheduledDue = now.Add(duration)
	}

	// Update the card with new stability, difficulty, due date, and last reviewed timestamp
	_, err = DB.Exec("UPDATE flashcards SET fsrs_stability = ?, fsrs_difficulty = ?, schedule_due = ?, last_reviewed = ?, updated_at = ? WHERE id = ? AND deck_id = ?",
		stability, difficulty, scheduledDue.Format(time.RFC3339), nowStr, nowStr, cardId, deckId)
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

// Add a function to check and add the card_type column if it doesn't exist
func addCardTypeColumn() error {
	if err := Init(); err != nil {
		return err
	}

	// Check if the column exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM pragma_table_info('flashcards') WHERE name='card_type'").Scan(&count)
	if err != nil {
		return err
	}

	// If the column doesn't exist, add it
	if count == 0 {
		_, err = DB.Exec("ALTER TABLE flashcards ADD COLUMN card_type TEXT DEFAULT 'standard'")
		if err != nil {
			return err
		}
	}
	return nil
}

// Add a function to check and add the last_reviewed column if it doesn't exist
func addLastReviewedColumn() error {
	if err := Init(); err != nil {
		return err
	}

	// Check if the column exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM pragma_table_info('flashcards') WHERE name='last_reviewed'").Scan(&count)
	if err != nil {
		return err
	}

	// If the column doesn't exist, add it
	if count == 0 {
		_, err = DB.Exec("ALTER TABLE flashcards ADD COLUMN last_reviewed DATETIME")
		if err != nil {
			return err
		}
	}
	return nil
}

// Add a function to check and add the source column if it doesn't exist
func addSourceColumn() error {
	if err := Init(); err != nil {
		return err
	}

	// Check if the column exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM pragma_table_info('flashcards') WHERE name='source'").Scan(&count)
	if err != nil {
		return err
	}

	// If the column doesn't exist, add it
	if count == 0 {
		_, err = DB.Exec("ALTER TABLE flashcards ADD COLUMN source TEXT DEFAULT 'unspecified'")
		if err != nil {
			return err
		}
	}
	return nil
}

// Add a function to check and add the rephrasing settings columns to decks
func addDeckRephraseSettingsColumns() error {
	if err := Init(); err != nil {
		return err
	}

	// Check if enable_auto_rephrase column exists
	var columnCount int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('decks') WHERE name='enable_auto_rephrase'`).Scan(&columnCount)
	if err != nil {
		return err
	}

	// Add the column if it doesn't exist
	if columnCount == 0 {
		_, err = DB.Exec(`ALTER TABLE decks ADD COLUMN enable_auto_rephrase BOOLEAN DEFAULT FALSE`)
		if err != nil {
			return err
		}
	}

	// Check if enable_initialism_swap column exists
	err = DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('decks') WHERE name='enable_initialism_swap'`).Scan(&columnCount)
	if err != nil {
		return err
	}

	// Add the column if it doesn't exist
	if columnCount == 0 {
		_, err = DB.Exec(`ALTER TABLE decks ADD COLUMN enable_initialism_swap BOOLEAN DEFAULT FALSE`)
		if err != nil {
			return err
		}
	}

	// Check if max_rephrased_cards column exists
	err = DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('decks') WHERE name='max_rephrased_cards'`).Scan(&columnCount)
	if err != nil {
		return err
	}

	// Add the column if it doesn't exist
	if columnCount == 0 {
		_, err = DB.Exec(`ALTER TABLE decks ADD COLUMN max_rephrased_cards INTEGER DEFAULT 3`)
		if err != nil {
			return err
		}
	}

	return nil
}

// SaveOpenAIKey saves the OpenAI API key to the database
func SaveOpenAIKey(apiKey string) error {
	if err := Init(); err != nil {
		return err
	}

	// Check if the key already exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM settings WHERE key = 'openai_api_key'").Scan(&count)
	if err != nil {
		return err
	}

	// If the key exists, update it, otherwise insert it
	if count > 0 {
		_, err = DB.Exec("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'openai_api_key'", apiKey)
	} else {
		_, err = DB.Exec("INSERT INTO settings (key, value, created_at, updated_at) VALUES ('openai_api_key', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", apiKey)
	}

	return err
}

// GetOpenAIKey retrieves the OpenAI API key from the database
func GetOpenAIKey() (string, error) {
	if err := Init(); err != nil {
		return "", err
	}

	var apiKey string
	err := DB.QueryRow("SELECT value FROM settings WHERE key = 'openai_api_key'").Scan(&apiKey)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil // No key found, return empty string
		}
		return "", err
	}

	return apiKey, nil
}
