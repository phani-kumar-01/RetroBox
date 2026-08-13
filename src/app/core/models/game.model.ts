// ============================================================
// Game Model
// ============================================================

export type Genre =
  | 'Action'
  | 'Adventure'
  | 'Platformer'
  | 'Puzzle'
  | 'Racing'
  | 'Shooter'
  | 'Sports'
  | 'Strategy'
  | 'Arcade'
  | 'Fighting'
  | 'Other';

export interface Game {
  id: string;
  title: string;
  description: string;
  genre: Genre;
  releaseYear: number;
  developer: string;
  publisher: string;
  coverImage: string;        // path to image asset
  romPath: string;           // URL to .nes file
  players: number | string;  // 1, 2, 4, '1-2', etc.
  featured?: boolean;
  tags?: string[];
  license: string;
  licenseUrl?: string;
  sourceUrl?: string;
}
