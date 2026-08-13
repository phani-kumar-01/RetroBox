import { Component, Input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Game } from '../../core/models/game.model';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
<div class="game-card" [class.featured]="featured">
  <a [routerLink]="['/games', game.id]" class="card-img-wrap">
    <img [src]="game.coverImage" [alt]="game.title" loading="lazy" class="card-img"
         (error)="imgError($event)" />
    <div class="card-overlay">
      <a [routerLink]="['/play', game.id]" class="btn btn-primary play-btn" (click)="$event.stopPropagation()">▶ PLAY</a>
    </div>
  </a>
  <div class="card-body">
    <div class="card-meta">
      <span class="genre-tag">{{game.genre}}</span>
      <span class="text-muted text-xs">{{game.releaseYear}}</span>
    </div>
    <a [routerLink]="['/games', game.id]" class="card-title">{{game.title}}</a>
    <div class="card-footer">
      <span class="text-muted text-xs developer-name">{{game.developer}}</span>
      <button class="fav-btn" (click)="toggleFav()" [attr.aria-label]="isFav() ? 'Remove from favorites' : 'Add to favorites'">
        <span [class.active]="isFav()">{{isFav() ? '♥' : '♡'}}</span>
      </button>
    </div>
  </div>
</div>
  `,
  styleUrl: './game-card.component.css'
})
export class GameCardComponent {
  @Input({ required: true }) game!: Game;
  @Input() featured = false;

  private storage = inject(StorageService);
  isFav = computed(() => this.storage.isFavorite(this.game.id));

  toggleFav() { this.storage.toggleFavorite(this.game.id); }
  imgError(e: Event) { (e.target as HTMLImageElement).src = 'assets/no-cover.svg'; }
}
