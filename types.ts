
export type WordStatus = 'ondo dago' | 'gaizki dago';

export interface GameEntry {
  text: string;
  egoera: WordStatus;
}

export interface HieroglyphEntry {
  imageUrl: string;
  imageText: string;
  solution: string;
  explanation: string;
}

export type GameMode = 'words' | 'proverbs' | 'hieroglyphs';
export type AppView = 'menu' | 'game';
