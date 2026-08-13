import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameService } from '../../core/services/game.service';
import { StorageService } from '../../core/services/storage.service';
import { GameCardComponent } from '../../shared/components/game-card.component';
import { Game } from '../../core/models/game.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, GameCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private gs = inject(GameService);
  private storage = inject(StorageService);

  featured = signal<Game | null>(null);
  popular  = signal<Game[]>([]);
  recent   = signal<Game[]>([]);
  genres   = signal<string[]>([]);

  ngOnInit() {
    const all = this.gs.getAll();
    const feat = this.gs.getFeatured();
    this.featured.set(feat[Math.floor(Math.random() * feat.length)] ?? all[0]);
    this.popular.set(all.slice(0, 8));
    this.genres.set(this.gs.getGenres().slice(0, 8));

    const recentIds = this.storage.recentlyPlayed();
    const recentGames = recentIds.map(id => this.gs.getById(id)).filter(Boolean) as Game[];
    this.recent.set(recentGames.slice(0, 6));
  }
}
