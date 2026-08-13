import { Injectable, signal } from '@angular/core';

export interface AppSettings {
  theme: 'dark' | 'light';
  volume: number;
  crtEffect: boolean;
  scanlines: boolean;
}

const DEFAULTS: AppSettings = { theme: 'dark', volume: 80, crtEffect: false, scanlines: false };
const KEYS = { settings: 'rb_settings', favorites: 'rb_favorites', recent: 'rb_recent' };

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly settings = signal<AppSettings>(this._loadSettings());
  readonly favorites = signal<string[]>(this._load(KEYS.favorites) ?? []);
  readonly recentlyPlayed = signal<string[]>(this._load(KEYS.recent) ?? []);

  private _load(key: string): any {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
  }
  private _save(key: string, val: any): void {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
  private _loadSettings(): AppSettings {
    return { ...DEFAULTS, ...(this._load(KEYS.settings) ?? {}) };
  }

  saveSettings(s: Partial<AppSettings>): void {
    const next = { ...this.settings(), ...s };
    this.settings.set(next);
    this._save(KEYS.settings, next);
  }

  isFavorite(id: string): boolean { return this.favorites().includes(id); }

  toggleFavorite(id: string): boolean {
    const cur = this.favorites();
    const next = cur.includes(id) ? cur.filter(f => f !== id) : [id, ...cur];
    this.favorites.set(next);
    this._save(KEYS.favorites, next);
    return !cur.includes(id);
  }

  addRecentlyPlayed(id: string): void {
    const cur = this.recentlyPlayed().filter(r => r !== id);
    const next = [id, ...cur].slice(0, 12);
    this.recentlyPlayed.set(next);
    this._save(KEYS.recent, next);
  }
}
