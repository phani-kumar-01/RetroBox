import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { GameCardComponent } from '../../shared/components/game-card.component';
import { Game } from '../../core/models/game.model';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, FormsModule, GameCardComponent],
  templateUrl: './games.component.html',
  styleUrl: './games.component.css'
})
export class GamesComponent implements OnInit {
  private gs = inject(GameService);
  private route = inject(ActivatedRoute);

  query  = signal('');
  genre  = signal('All');
  results = signal<Game[]>([]);
  genres  = signal<string[]>([]);
  page    = signal(1);
  pageSize = 24;

  get paged() { return this.results().slice(0, this.page() * this.pageSize); }
  get hasMore() { return this.paged.length < this.results().length; }

  ngOnInit() {
    this.genres.set(['All', ...this.gs.getGenres()]);
    this.route.queryParams.subscribe(p => {
      if (p['genre']) this.genre.set(p['genre']);
      this.search();
    });
  }

  search() {
    this.page.set(1);
    this.results.set(this.gs.search(this.query(), this.genre()));
  }

  setGenre(g: string) { this.genre.set(g); this.search(); }
  loadMore() { this.page.update(p => p + 1); }
}
