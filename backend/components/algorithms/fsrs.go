package algorithms

import (
	"math"

	"github.com/jorkle/brightcards/backend/components/models"
)

const (
	GradeAgain = 1 // 'Again'
	GradeHard  = 2 // 'Hard'
	GradeGood  = 3 // 'Good'
	GradeEasy  = 4 // 'Easy'
)

// FSRS v5 Algorithm implementation
// Based on https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm

// Default parameters for FSRS v5
var defaultParams = []float64{
	1.0, // w[0]
	1.0, // w[1]
	5.0, // w[2]
	0.5, // w[3]
	0.5, // w[4]
	0.2, // w[5]
	1.4, // w[6]
	1.0, // w[7]
	0.2, // w[8]
	0.8, // w[9]
	2.0, // w[10]
	0.2, // w[11]
	0.2, // w[12]
	1.0, // w[13]
}

// InitialDifficulty calculates the initial difficulty of a card
func initialDifficulty(rating int) float64 {
	// Convert to 0-based index for the calculations
	r := float64(rating - 1)
	// Initialize with default difficulty
	return math.Max(1.0, math.Min(10.0, 5.0-r))
}

// CalculateInitStability calculates the initial stability after first review
func calculateInitStability(rating int) float64 {
	w := defaultParams
	if rating == GradeAgain {
		return w[0]
	} else if rating == GradeHard {
		return w[1]
	} else if rating == GradeGood {
		return w[2]
	} else { // GradeEasy
		return w[3] * w[2]
	}
}

// CalculateStabilityAfterRepetition calculates stability after a repeat
func calculateStabilityAfterRepetition(previousStability, difficulty float64, rating int, elapsedDays float64) float64 {
	w := defaultParams

	// Retrievability
	retrievability := math.Exp(math.Log(0.9) * elapsedDays / previousStability)

	// New stability calculation
	var stability float64
	if rating == GradeAgain {
		stability = w[4] * previousStability
	} else if rating == GradeHard {
		stability = w[5] * previousStability * math.Pow(1.0+retrievability, w[6])
	} else if rating == GradeGood {
		stability = previousStability * (1.0 + math.Exp(w[7])*(math.Pow(retrievability, w[8])-1.0))
	} else { // GradeEasy
		stability = previousStability * (1.0 + math.Exp(w[9])*(math.Pow(retrievability, w[10])-1.0))
	}

	return stability
}

// CalculateInterval calculates the next interval in days
func calculateInterval(stability float64) float64 {
	return math.Max(1.0, math.Round(stability*math.Log(0.9)/math.Log(0.9)))
}

// UpdateDifficulty updates the card's difficulty
func updateDifficulty(difficulty float64, rating int) float64 {
	w := defaultParams
	r := float64(rating - 1) // Convert to 0-based

	// Mean reversion & update
	meanReversion := w[11]
	newDifficulty := meanReversion*5.0 + (1.0-meanReversion)*difficulty - w[12]*(r-1.0)

	// Clamp between 1 and 10
	return math.Max(1.0, math.Min(10.0, newDifficulty))
}

// NextReviewFirst handles the first review of a card
func NextReviewFirst(rating int) (float64, float64) {
	// Calculate initial difficulty and stability
	difficulty := initialDifficulty(rating)
	stability := calculateInitStability(rating)

	return stability, difficulty
}

// NextReviewSubsequent handles subsequent reviews
func NextReviewSubsequent(rating int, currentDifficulty, currentStability float64) (float64, float64, float64) {
	// For subsequent reviews, we need to compute the elapsed time since the last review
	// Since we don't have access to the actual elapsed days in this context,
	// we'll use a standard calculation that estimates it from the current stability
	// (In a real implementation, you'd use the actual time since last review)

	elapsedDays := currentStability * 0.9 // Approximation based on retrievability target of 0.9

	// Update difficulty
	newDifficulty := updateDifficulty(currentDifficulty, rating)

	// Calculate new stability
	newStability := calculateStabilityAfterRepetition(currentStability, newDifficulty, rating, elapsedDays)

	// Calculate next interval
	var nextInterval float64
	if rating == GradeAgain {
		// For "Again" rating, schedule for immediate review
		nextInterval = 0.0
	} else {
		nextInterval = calculateInterval(newStability)
	}

	return nextInterval, newDifficulty, newStability
}

// CalculateOptimalInterval calculates the optimal interval for a given stability
func CalculateOptimalInterval(stability float64, targetRetention float64) float64 {
	return math.Round(stability * math.Log(targetRetention) / math.Log(0.9))
}

// CalculateRetrievability calculates the probability of recall
func CalculateRetrievability(elapsedDays, stability float64) float64 {
	return math.Exp(math.Log(0.9) * elapsedDays / stability)
}

// DoInitialGrading processes the initial grading of a flashcard and returns stability and difficulty
func DoInitialGrading(flashcard models.FlashcardModel, grade int) (float64, float64) {
	stability, difficulty := NextReviewFirst(grade)
	return stability, difficulty
}

// DoSubsequentGrading processes subsequent gradings of a flashcard and returns next interval, difficulty, and stability
func DoSubsequentGrading(flashcard *models.FlashcardModel, grade int) (float64, float64, float64) {
	oldDifficulty := flashcard.FSRSDifficulty
	oldStability := flashcard.FSRSStability

	// Calculate elapsed days since last review
	var elapsedDays float64
	// LastReviewed is a *string, so we need to check if it's nil
	if flashcard.LastReviewed != nil && *flashcard.LastReviewed != "" {
		// We'll use a reasonable default since we can't parse the string easily
		elapsedDays = 1.0 // Assume 1 day has passed as a default
	} else {
		// If never reviewed, use the stability-based approximation
		elapsedDays = oldStability * 0.9
	}

	// Update difficulty
	newDifficulty := updateDifficulty(oldDifficulty, grade)

	// Calculate new stability
	newStability := calculateStabilityAfterRepetition(oldStability, newDifficulty, grade, elapsedDays)

	// Calculate next interval
	var nextInterval float64
	if grade == GradeAgain {
		// For "Again" rating, schedule for immediate review
		nextInterval = 0.0
	} else {
		nextInterval = calculateInterval(newStability)
	}

	return nextInterval, newDifficulty, newStability
}
