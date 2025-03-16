// Shared interfaces between Go and TypeScript
export interface Flashcard {
  id: number;
  front: string;
  back: string;
  deckId: number;
  dueDate: string;
  lastReviewed?: string;
  difficulty?: 'Easy' | 'Normal' | 'Hard' | 'Again';
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: number;
  name: string;
  description: string;
  purpose: string;
  cardCount: number;
  lastReviewed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportFormat {
  type: 'anki' | 'csv' | 'json';
  filename: string;
}

// Review grades matching the backend constants
export enum ReviewGrade {
  Again = 'Again',
  Hard = 'Hard',
  Normal = 'Normal',
  Easy = 'Easy'
} 