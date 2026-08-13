import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../core/services/storage.service';
import { GameService } from '../../core/services/game.service';
import { GameCardComponent } from '../../shared/components/game-card.component';
import { Game } from '../../core/models/game.model';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink, CommonModule, GameCardComponent],
  template: `
<div class="container" style="padding-top: calc(var(--nav-height) + var(--space-10))">
  <h1 class="text-display" style="margin-bottom:var(--space-2)">Favorites</h1>
  <p class="text-secondary" style="margin-bottom:var(--space-8)">{{games().length}} saved games</p>
  <div class="games-grid" *ngIf="games().length; else empty">
    <app-game-card *ngFor="let g of games()" [game]="g" />
  </div>
  <ng-template #empty>
    <div class="empty-state">
      <div class="empty-icon">♡</div>
      <p class="text-heading">No favorites yet</p>
      <p class="text-secondary">Heart a game to save it here.</p>
      <a routerLink="/games" class="btn btn-primary">Browse Games</a>
    </div>
  </ng-template>
</div>
  `,
  styles: [`.games-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4)}@media(max-width:1024px){.games-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:768px){.games-grid{grid-template-columns:repeat(2,1fr)}}`]
})
export class FavoritesComponent {
  private storage = inject(StorageService);
  private gs      = inject(GameService);
  games = computed(() => this.storage.favorites().map(id => this.gs.getById(id)).filter(Boolean) as Game[]);
}
