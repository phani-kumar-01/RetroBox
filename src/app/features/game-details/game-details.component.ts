import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameService } from '../../core/services/game.service';
import { StorageService } from '../../core/services/storage.service';
import { Game } from '../../core/models/game.model';
import { GameCardComponent } from '../../shared/components/game-card.component';

@Component({
  selector: 'app-game-details',
  standalone: true,
  imports: [RouterLink, CommonModule, GameCardComponent],
  templateUrl: './game-details.component.html',
  styleUrl: './game-details.component.css'
})
export class GameDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private gs = inject(GameService);
  private storage = inject(StorageService);

  game   = signal<Game | null>(null);
  related = signal<Game[]>([]);
  notFound = signal(false);

  isFav = () => this.game() ? this.storage.isFavorite(this.game()!.id) : false;

  toggleFav() {
    if (this.game()) this.storage.toggleFavorite(this.game()!.id);
  }

  ngOnInit() {
    this.route.params.subscribe(p => {
      const g = this.gs.getById(p['id']);
      if (!g) { this.notFound.set(true); return; }
      this.game.set(g);
      this.related.set(this.gs.getByGenre(g.genre).filter(x => x.id !== g.id).slice(0, 4));
    });
  }
}
