import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'games', loadComponent: () => import('./features/games/games.component').then(m => m.GamesComponent) },
  { path: 'games/:id', loadComponent: () => import('./features/game-details/game-details.component').then(m => m.GameDetailsComponent) },
  { path: 'play/:id', loadComponent: () => import('./features/player/player.component').then(m => m.PlayerComponent) },
  { path: 'favorites', loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent) },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
  { path: '**', redirectTo: '' }
];
