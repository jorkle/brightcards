package api

type Deck interface {
	Get(deckId int) (deck DeckModel, err error)
	GetAll() (decks []DeckModel, err error)
	Create(name string, description string, purpose string) (deck DeckModel, err error)
	Update(deckId int, name string, description string, purpose string) (deck DeckModel, err error)
	Delete(deckId int) (err error)
	Export(deckId int, format string) (string, err error)
}
