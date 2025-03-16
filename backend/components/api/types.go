package api

type FlashcardModel struct {
	ID             int
	Front          string
	Back           string
	DeckId         string
	FSRSDifficulty float64
	FSRSStability  float64
	DueDate        float64
	LastReviewed   *string
	Difficulty     *string
	CreatedAt      string
	UpdatedAt      string
}

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
