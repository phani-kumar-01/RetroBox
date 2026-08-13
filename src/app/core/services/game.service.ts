import { Injectable, signal, computed } from '@angular/core';
import { Game, Genre } from '../models/game.model';
import { GAMES, FEATURED_GAMES } from '../data/games.data';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _all = GAMES;

  getAll(): Game[]                        { return this._all; }
  getById(id: string): Game | undefined   { return this._all.find(g => g.id === id); }
  getFeatured(): Game[]                   { return FEATURED_GAMES; }

  search(query: string, genre?: string): Game[] {
    const q = query.toLowerCase().trim();
    return this._all.filter(g => {
      const matchQ = !q || g.title.toLowerCase().includes(q) || g.developer.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
      const matchG = !genre || genre === 'All' || g.genre === genre;
      return matchQ && matchG;
    });
  }

  getByGenre(genre: Genre): Game[]       { return this._all.filter(g => g.genre === genre); }
  getGenres(): string[]                  { return [...new Set(this._all.map(g => g.genre))].sort(); }
  getRandom(count = 4): Game[]           { return [...this._all].sort(() => Math.random() - 0.5).slice(0, count); }
}
