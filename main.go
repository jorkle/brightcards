package main

import (
	"embed"

	"github.com/jorkle/brightcards/backend/components/api"
	"github.com/jorkle/brightcards/backend/components/models"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()
	flashcard := api.FlashcardImpl{}
	cardModel := models.FlashcardModel{}
	deckModel := models.DeckModel{}
	deck := api.DeckImpl{}
	// Create application with options
	err := wails.Run(&options.App{
		Title:  "bcards",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
			flashcard,
			cardModel,
			deckModel,
			deck,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
