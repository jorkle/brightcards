package models

import "time"

type FlashcardModel struct {
	ID             int       `json:"ID"`
	Front          string    `json:"Front"`
	Back           string    `json:"Back"`
	DeckId         int       `json:"DeckId"`
	CardType       string    `json:"CardType"`
	FSRSDifficulty float64   `json:"FSRSDifficulty"`
	FSRSStability  float64   `json:"FSRSStability"`
	DueDate        time.Time `json:"DueDate"`
	LastReviewed   *string   `json:"LastReviewed,omitempty"`
	Difficulty     *string   `json:"Difficulty,omitempty"`
	CreatedAt      string    `json:"CreatedAt"`
	UpdatedAt      string    `json:"UpdatedAt"`
}

type DeckModel struct {
	ID           int     `json:"ID"`
	Name         string  `json:"Name"`
	Description  string  `json:"Description"`
	Purpose      string  `json:"Purpose"`
	CardCount    int     `json:"CardCount"`
	LastReviewed *string `json:"LastReviewed,omitempty"`
	CreatedAt    string  `json:"CreatedAt"`
	UpdatedAt    string  `json:"UpdatedAt"`
}
