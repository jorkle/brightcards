import { Deck, Flashcard, ExportFormat } from './models';
declare global {
  interface Window {
    // Deck operations
    GetDeck: (id: number) => Promise<Deck>;
    ListDecks: () => Promise<Deck[]>;
    CreateDeck: (name: string, description: string, purpose: string) => Promise<Deck>;
    UpdateDeck: (id: number, name: string, description: string, purpose: string) => Promise<Deck>;
    DeleteDeck: (id: number) => Promise<void>;
    ExportDeck: (id: number, format: ExportFormat) => Promise<string>;

    // Flashcard operations
    GetCard: (deckId: number, cardId: number) => Promise<Flashcard>;
    ListCards: (deckId: number) => Promise<Flashcard[]>;
    ListDueCards: (deckId: number) => Promise<Flashcard[]>;
    CreateCard: (deckId: number, front: string, back: string) => Promise<Flashcard>;
    UpdateCard: (card: Flashcard) => Promise<Flashcard>;
    DeleteCard: (deckId: number, cardId: number) => Promise<void>;
  }
}

// Deck operations
export const getDeck = async (id: number): Promise<Deck> => {
  return await window.GetDeck(id);
};

export const listDecks = async (): Promise<Deck[]> => {
  return await window.ListDecks();
};

export const createDeck = async (name: string, description: string, purpose: string): Promise<Deck> => {
  return await window.CreateDeck(name, description, purpose);
};

export const updateDeck = async (id: number, name: string, description: string, purpose: string): Promise<Deck> => {
  return await window.UpdateDeck(id, name, description, purpose);
};

export const deleteDeck = async (id: number): Promise<void> => {
  return await window.DeleteDeck(id);
};

export const exportDeck = async (id: number, format: ExportFormat): Promise<string> => {
  return await window.ExportDeck(id, format);
};

// Flashcard operations
export const getCard = async (deckId: number, cardId: number): Promise<Flashcard> => {
  return await window.GetCard(deckId, cardId);
};

export const listCards = async (deckId: number): Promise<Flashcard[]> => {
  return await window.ListCards(deckId);
};

export const listDueCards = async (deckId: number): Promise<Flashcard[]> => {
  return await window.ListDueCards(deckId);
};

export const createCard = async (deckId: number, front: string, back: string): Promise<Flashcard> => {
  return await window.CreateCard(deckId, front, back);
};

export const updateCard = async (card: Flashcard): Promise<Flashcard> => {
  return await window.UpdateCard(card);
};

export const deleteCard = async (deckId: number, cardId: number): Promise<void> => {
  return await window.DeleteCard(deckId, cardId);
};
