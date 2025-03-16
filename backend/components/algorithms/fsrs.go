package algorithms

import (
	"fmt"
	"math"

	"github.com/jorkle/brightcards/backend/components/api"
)

const (
	GradeAgain = 1 // 'Again'
	GradeHard  = 2 // 'Hard'
	GradeGood  = 3 // 'Good'
	GradeEasy  = 4 // 'Easy'
)

func DoInitialGrading(flashcard api.FlashcardModel, grade int) {
	stability, difficulty := NextReviewFirst(grade)
	flashcard.FSRSStability = stability
	flashcard.FSRSStability = difficulty
	flashcard.DueDate = stability
}

func DoSubsequentGrading(flashcard *api.FlashcardModel, grade int) {
	oldDifficulty := flashcard.FSRSDifficulty
	oldStability := flashcard.FSRSStability
	timing, difficulty, stability := NextReviewSubsequent(grade, oldDifficulty, oldStability)
	flashcard.FSRSStability = stability
	flashcard.FSRSDifficulty = difficulty
	flashcard.DueDate = timing
}

func NextReviewFirst(grade int) (float64, float64) {
	w := []float64{
		0.4, 0.6, 2.4, 5.8, 4.93,
		0.94, 0.86, 0.01, 1.49, 0.14,
		0.94, 2.18, 0.05, 0.34, 1.26,
		0.29, 2.61,
	}
	// For FSRS v5, typical formula: D₀(G) = w4 − e^(w5 * (G−1)) + 1
	// in our parameter array, let’s assume:
	//   w4 = w[3], w5 = w[4]
	w4 := w[3] // 5.8
	w5 := w[4] // 4.93

	D0 := InitialDifficultyAfterFirstRating(grade, w4, w5)

	// We’ll define a *simple* initial stability S based on rating:
	var S float64
	switch grade {
	case GradeAgain:
		// “Again” => a small stability
		S = 0.5
	case GradeHard:
		// “Hard” => slightly bigger
		S = 1.0
	case GradeGood:
		// “Good” => a moderate initial stability
		S = 2.0
	case GradeEasy:
		// “Easy” => even larger
		S = 3.0
	}

	// This is a *simplified* approach. Strict FSRS might do more steps,
	// but we’ll return S as the next review interval in days.
	fmt.Printf("Initial difficulty D0(G=%d)=%.3f, chosen S=%.3f\\n", grade, D0, S)
	return S, D0
}

// NextReviewSubsequent calculates the next-review interval after a subsequent review,
// and also returns updated difficulty & stability. We combine a few FSRS-like steps:
//  1. Linear-damping for difficulty
//  2. Mean reversion of difficulty
//  3. Stability update
//  4. Next interval = new stability (simplified assumption).
func NextReviewSubsequent(grade int, oldDifficulty, oldStability float64) (
	nextInterval, newDifficulty, newStability float64,
) {
	w := []float64{
		0.4, 0.6, 2.4, 5.8, 4.93,
		0.94, 0.86, 0.01, 1.49, 0.14,
		0.94, 2.18, 0.05, 0.34, 1.26,
		0.29, 2.61,
	}
	// -------------------------
	// 1) Linear Damping for Difficulty
	//    ΔD(G) = - w6 * (G - 3)
	//    D' = D + ΔD * 10^(-D^9)
	w6 := w[5] // 0.94
	dPrime := oldDifficulty
	{
		deltaD := -w6 * (float64(grade) - 3.0)
		dPrime = dPrime + deltaD*math.Pow(10, -math.Pow(dPrime, 9))
	}

	// -------------------------
	// 2) Mean Reversion
	//    D'' = w7 * D0(4) + (1 - w7) * D'
	w7 := w[6] // 0.86
	// let’s assume D0(4) uses w4=w[3] and w5=w[4] again:
	w4 := w[3] // 5.8
	w5 := w[4] // 4.93
	d0For4 := w4 - math.Exp(w5*float64(4-1)) + 1

	newDifficulty = w7*d0For4 + (1.0-w7)*dPrime

	// -------------------------
	// 3) Stability Update (example approach)
	//    In some FSRS steps, you might do:
	//    newStability = oldStability * e^( w17 * ( (G-3) + someOffset ) )
	//    We’ll assume w17 = w[16] (2.61) and we pick an offset or parameter.
	w17 := w[16]
	offset := 0.5 // or another param if you have w18
	newStability = oldStability * math.Exp(w17*((float64(grade)-3.0)+offset))

	// -------------------------
	// 4) Next Interval (simplified assumption) = newStability
	//    Real FSRS might use R(t,S)=0.9 or other logic.
	nextInterval = newStability

	return nextInterval, newDifficulty, newStability
}

func InitialDifficultyAfterFirstRating(G int, w4, w5 float64) float64 {
	// Translate directly:
	//   D0(G) = w4 - e^(w5 * (G-1)) + 1
	// We use math.Exp to compute e^(expression).
	return w4 - math.Exp(w5*float64(G-1)) + 1
}
