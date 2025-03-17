package algorithms

import (
	"math"
	"time"

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
	0.40255,  // w[0]
	1.18385,  // w[1]
	3.173,    // w[2]
	15.69105, // w[3]
	7.1949,   // w[4]  - D_0(1), initial difficulty when first rating is Again
	0.5345,   // w[5]  - Used in D_0(G) formula
	1.4604,   // w[6]  - Used in Linear Damping formula
	0.0046,   // w[7]  - Mean reversion weight
	1.54575,  // w[8]  - Used in stability after recall formula
	0.1192,   // w[9]  - Used in stability after recall formula
	1.01925,  // w[10] - Used in stability after recall formula
	1.9395,   // w[11] - Used in stability after forgetting formula
	0.11,     // w[12] - Used in stability after forgetting formula
	0.29605,  // w[13] - Used in stability after forgetting formula
	2.2698,   // w[14] - Used in stability after forgetting formula
	0.2315,   // w[15] - Not used in v5 formula
	2.9898,   // w[16] - Not used in v5 formula
	0.51655,  // w[17] - Used in same-day review formula
	0.6621,   // w[18] - Used in same-day review formula
}

// Constants for retrievability calculation (from FSRS-4.5)
const (
	DECAY  = -0.5
	FACTOR = 19.0 / 81.0
)

// InitialStability calculates the initial stability after the first rating
func initialStability(rating int) float64 {
	switch rating {
	case GradeAgain:
		return defaultParams[0]
	case GradeHard:
		return defaultParams[1]
	case GradeGood:
		return defaultParams[2]
	case GradeEasy:
		return defaultParams[3]
	default:
		return defaultParams[2] // Default to Good if invalid rating
	}
}

// InitialDifficulty calculates the initial difficulty after the first rating
// D_0(G) = w_4 - e^(w_5 * (G - 1)) + 1
func initialDifficulty(rating int) float64 {
	w4 := defaultParams[4]
	w5 := defaultParams[5]
	g := float64(rating)

	d0 := w4 - math.Exp(w5*(g-1)) + 1

	// Clamp difficulty between 1 and 10
	return math.Max(1.0, math.Min(10.0, d0))
}

// CalculateRetrievability calculates probability of recall after elapsed time
// R(t,S) = (1 + FACTOR * t/S)^DECAY
func calculateRetrievability(elapsedDays, stability float64) float64 {
	if stability <= 0 {
		return 0 // Avoid division by zero
	}
	return math.Pow(1.0+FACTOR*elapsedDays/stability, DECAY)
}

// CalculateInterval calculates the next interval in days
// I(r,S) = S/FACTOR * (r^(1/DECAY) - 1)
func calculateInterval(stability float64, requestedRetention float64) float64 {
	// Default retention is 0.9 if not specified
	if requestedRetention <= 0 {
		requestedRetention = 0.9
	}

	interval := stability / FACTOR * (math.Pow(requestedRetention, 1/DECAY) - 1)
	return math.Max(1.0, math.Round(interval))
}

// UpdateDifficulty updates the card's difficulty using the FSRS v5 formula
// Linear Damping: ∆D(G) = -w_6 * (G - 3)
// D' = D + ∆D * (10 - D)/9
// Mean reversion: D” = w_7 * D_0(4) + (1 - w_7) * D'
func updateDifficulty(difficulty float64, rating int) float64 {
	w6 := defaultParams[6]
	w7 := defaultParams[7]
	g := float64(rating)

	// Calculate target for mean reversion (D_0(4))
	meanReversionTarget := initialDifficulty(GradeEasy)

	// Linear damping
	deltaD := -w6 * (g - 3.0)
	dPrime := difficulty + deltaD*(10.0-difficulty)/9.0

	// Mean reversion
	newDifficulty := w7*meanReversionTarget + (1.0-w7)*dPrime

	// Clamp between 1 and 10
	return math.Max(1.0, math.Min(10.0, newDifficulty))
}

// CalculateStabilityAfterRecall calculates stability after a successful review
// S'_r(S,D,R,G) = S * (1 + exp(w_8) * (exp(w_9 * (1-R)) - 1) * (exp(w_10 * (D-5)) - 1) * exp(w_11 * (G-3)))
func calculateStabilityAfterRecall(stability, difficulty, retrievability float64, rating int) float64 {
	w8 := defaultParams[8]
	w9 := defaultParams[9]
	w10 := defaultParams[10]
	g := float64(rating)

	// FSRS v4 formula as specified in documentation
	newStability := stability

	// Different formulas based on rating
	if rating == GradeAgain {
		// Again rating - this should not happen in successful recall, but included for completeness
		return stability * 0.5 // Typically stability is reduced for "again" ratings
	} else if rating == GradeHard {
		// Hard rating - use retrievability-adjusted formula
		newStability = stability * (1.0 + math.Exp(w8)*(math.Exp(w9*(1.0-retrievability))-1.0)*math.Exp(w10*(g-3.0)))
	} else if rating == GradeGood {
		// Good rating - standard formula
		newStability = stability * (1.0 + math.Exp(w8)*(math.Exp(w9*(1.0-retrievability))-1.0))
	} else { // GradeEasy
		// Easy rating - increased stability gain
		newStability = stability * (1.0 + math.Exp(w8)*(math.Exp(w9*(1.0-retrievability))-1.0)*math.Exp(w10))
	}

	return newStability
}

// CalculateStabilityAfterForgetting calculates stability after a failed review
// S'_f(D,S,R) = w_11 * D^(-w_12) * ((S+1)^(w_13) - 1) * e^(w_14 * (1-R))
func calculateStabilityAfterForgetting(stability, difficulty, retrievability float64) float64 {
	w11 := defaultParams[11]
	w12 := defaultParams[12]
	w13 := defaultParams[13]
	w14 := defaultParams[14]

	// Calculate new stability after forgetting
	newStability := w11 *
		math.Pow(difficulty, -w12) *
		(math.Pow(stability+1.0, w13) - 1.0) *
		math.Exp(w14*(1.0-retrievability))

	return math.Max(1.0, newStability)
}

// CalculateStabilityAfterSameDayReview calculates stability after a same-day review
// S'(S,G) = S * e^(w_17 * (G - 3 + w_18))
func calculateStabilityAfterSameDayReview(stability float64, rating int) float64 {
	w17 := defaultParams[17]
	w18 := defaultParams[18]
	g := float64(rating)

	newStability := stability * math.Exp(w17*(g-3.0+w18))
	return math.Max(1.0, newStability)
}

// NextReviewFirst handles the first review of a card
func NextReviewFirst(rating int) (float64, float64) {
	// Calculate initial difficulty and stability
	difficulty := initialDifficulty(rating)
	stability := initialStability(rating)

	return stability, difficulty
}

// NextReviewSubsequent handles subsequent reviews
func NextReviewSubsequent(rating int, currentDifficulty, currentStability float64, elapsedDays float64) (float64, float64, float64) {
	// If this is a same-day review (elapsedDays < 1), use the same-day formula
	if elapsedDays < 1.0 {
		newStability := calculateStabilityAfterSameDayReview(currentStability, rating)
		return calculateInterval(newStability, 0.9), currentDifficulty, newStability
	}

	// Calculate retrievability based on elapsed time and current stability
	retrievability := calculateRetrievability(elapsedDays, currentStability)

	// Update difficulty
	newDifficulty := updateDifficulty(currentDifficulty, rating)

	// Calculate new stability
	var newStability float64
	if rating == GradeAgain {
		// For "Again" rating, use the forgetting formula
		newStability = calculateStabilityAfterForgetting(currentStability, newDifficulty, retrievability)
	} else {
		// For other ratings, use the recall formula
		newStability = calculateStabilityAfterRecall(currentStability, newDifficulty, retrievability, rating)
	}

	// Calculate next interval
	var nextInterval float64
	if rating == GradeAgain {
		// For "Again" rating, schedule for immediate review
		nextInterval = 0.0
	} else {
		// For other ratings, calculate the interval based on the new stability
		nextInterval = calculateInterval(newStability, 0.9)
	}

	return nextInterval, newDifficulty, newStability
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
		// Parse the time string to calculate actual elapsed days
		lastReviewed, err := time.Parse(time.RFC3339, *flashcard.LastReviewed)
		if err == nil {
			elapsedDays = time.Since(lastReviewed).Hours() / 24.0
		} else {
			// If parsing fails, use a reasonable default
			elapsedDays = 1.0
		}
	} else {
		// If never reviewed, use the stability-based approximation
		elapsedDays = oldStability * 0.9
	}

	// Call the core algorithm function with the elapsed days
	return NextReviewSubsequent(grade, oldDifficulty, oldStability, elapsedDays)
}
