package main

import (
	"testing"
)

func TestDeckImpl(t *testing.T) {
	deck := &DeckImpl{}

	t.Run("Create and Get Deck", func(t *testing.T) {
		// Create a test deck
		createdDeck, err := deck.CreateDeck("Test Deck", "Test Description", "Test Purpose")
		if err != nil {
			t.Fatalf("Failed to create deck: %v", err)
		}

		// Get the created deck
		fetchedDeck, err := deck.GetDeck(createdDeck.ID)
		if err != nil {
			t.Fatalf("Failed to get deck: %v", err)
		}

		// Verify deck properties
		if fetchedDeck.Name != "Test Deck" {
			t.Errorf("Expected deck name 'Test Deck', got '%s'", fetchedDeck.Name)
		}
	})

	t.Run("Get All Decks", func(t *testing.T) {
		decks, err := deck.GetAllDecks()
		if err != nil {
			t.Fatalf("Failed to get all decks: %v", err)
		}

		if len(decks) < 1 {
			t.Error("Expected at least one deck after creation")
		}
	})

	t.Run("Update Deck", func(t *testing.T) {
		// Create a deck to update
		createdDeck, err := deck.CreateDeck("Update Test", "Original Desc", "Original Purpose")
		if err != nil {
			t.Fatalf("Failed to create deck for update test: %v", err)
		}

		// Update the deck
		updatedDeck, err := deck.UpdateDeck(createdDeck.ID, "Updated Name", "Updated Desc", "Updated Purpose")
		if err != nil {
			t.Fatalf("Failed to update deck: %v", err)
		}

		if updatedDeck.Name != "Updated Name" {
			t.Errorf("Expected updated name 'Updated Name', got '%s'", updatedDeck.Name)
		}
	})

	t.Run("Delete Deck", func(t *testing.T) {
		// Create a deck to delete
		createdDeck, err := deck.CreateDeck("Delete Test", "Delete Desc", "Delete Purpose")
		if err != nil {
			t.Fatalf("Failed to create deck for delete test: %v", err)
		}

		// Delete the deck
		err = deck.DeleteDeck(createdDeck.ID)
		if err != nil {
			t.Fatalf("Failed to delete deck: %v", err)
		}

		// Verify deck is deleted
		_, err = deck.GetDeck(createdDeck.ID)
		if err == nil {
			t.Error("Expected error when getting deleted deck")
		}
	})
}

func TestFlashcardImpl(t *testing.T) {
	flashcard := &FlashcardImpl{}
	deck := &DeckImpl{}

	// Create a test deck for flashcard tests
	testDeck, err := deck.CreateDeck("Test Deck", "For Flashcard Tests", "Testing")
	if err != nil {
		t.Fatalf("Failed to create test deck: %v", err)
	}

	t.Run("Create and Get Flashcard", func(t *testing.T) {
		// Create a test flashcard
		createdCard, err := flashcard.CreateFlashcard(testDeck.ID, "Test Front", "Test Back", "standard")
		if err != nil {
			t.Fatalf("Failed to create flashcard: %v", err)
		}

		// Get the created flashcard
		fetchedCard, err := flashcard.GetFlashcard(testDeck.ID, createdCard.ID)
		if err != nil {
			t.Fatalf("Failed to get flashcard: %v", err)
		}

		if fetchedCard.Front != "Test Front" {
			t.Errorf("Expected front 'Test Front', got '%s'", fetchedCard.Front)
		}
	})

	t.Run("Get All Flashcards", func(t *testing.T) {
		cards, err := flashcard.GetAllFlashcards(testDeck.ID)
		if err != nil {
			t.Fatalf("Failed to get all flashcards: %v", err)
		}

		if len(cards) < 1 {
			t.Error("Expected at least one flashcard after creation")
		}
	})

	t.Run("Update Flashcard", func(t *testing.T) {
		// Create a flashcard to update
		createdCard, err := flashcard.CreateFlashcard(testDeck.ID, "Original Front", "Original Back", "standard")
		if err != nil {
			t.Fatalf("Failed to create flashcard for update test: %v", err)
		}

		// Update the card
		createdCard.Front = "Updated Front"
		createdCard.Back = "Updated Back"
		updatedCard, err := flashcard.UpdateFlashcard(createdCard)
		if err != nil {
			t.Fatalf("Failed to update flashcard: %v", err)
		}

		if updatedCard.Front != "Updated Front" {
			t.Errorf("Expected updated front 'Updated Front', got '%s'", updatedCard.Front)
		}
	})

	t.Run("Review Flashcard", func(t *testing.T) {
		// Create a flashcard to review
		createdCard, err := flashcard.CreateFlashcard(testDeck.ID, "Review Front", "Review Back", "standard")
		if err != nil {
			t.Fatalf("Failed to create flashcard for review test: %v", err)
		}

		// Review the card
		err = flashcard.ReviewFlashcard(testDeck.ID, createdCard.ID, "normal")
		if err != nil {
			t.Fatalf("Failed to review flashcard: %v", err)
		}

		// Get the card to verify review
		reviewedCard, err := flashcard.GetFlashcard(testDeck.ID, createdCard.ID)
		if err != nil {
			t.Fatalf("Failed to get reviewed flashcard: %v", err)
		}

		if reviewedCard.FSRSStability == 0 {
			t.Error("Expected non-zero stability after review")
		}
	})

	t.Run("Delete Flashcard", func(t *testing.T) {
		// Create a flashcard to delete
		createdCard, err := flashcard.CreateFlashcard(testDeck.ID, "Delete Front", "Delete Back", "standard")
		if err != nil {
			t.Fatalf("Failed to create flashcard for delete test: %v", err)
		}

		// Delete the card
		_, err = flashcard.DeleteFlashcard(testDeck.ID, createdCard.ID)
		if err != nil {
			t.Fatalf("Failed to delete flashcard: %v", err)
		}

		// Verify card is deleted
		_, err = flashcard.GetFlashcard(testDeck.ID, createdCard.ID)
		if err == nil {
			t.Error("Expected error when getting deleted flashcard")
		}
	})

	// Clean up test deck
	t.Cleanup(func() {
		deck.DeleteDeck(testDeck.ID)
	})
}
