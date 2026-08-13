import { Component, OnInit, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
<header class="navbar" [class.scrolled]="scrolled()">
  <div class="container nav-inner">
    <a routerLink="/" class="nav-logo">
      <span class="logo-icon">▣</span>
      <span class="logo-text">RetroBox</span>
    </a>
    <nav class="nav-links" [class.open]="menuOpen()">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="menuOpen.set(false)">Home</a>
      <a routerLink="/games" routerLinkActive="active" (click)="menuOpen.set(false)">Games</a>
      <a routerLink="/favorites" routerLinkActive="active" (click)="menuOpen.set(false)">Favorites</a>
      <a routerLink="/settings" routerLinkActive="active" (click)="menuOpen.set(false)">Settings</a>
    </nav>
    <button class="burger" (click)="menuOpen.set(!menuOpen())" [attr.aria-label]="menuOpen() ? 'Close menu' : 'Open menu'">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
<div class="page-wrapper">
  <router-outlet />
</div>
<footer class="site-footer">
  <div class="container footer-inner">
    <span class="footer-logo">▣ RetroBox</span>
    <span class="text-muted" style="font-size:.8rem">Browser-based retro gaming · Homebrew ROMs only</span>
    <span class="text-muted" style="font-size:.8rem">© 2026 RetroBox</span>
  </div>
</footer>
  `,
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  scrolled = signal(false);
  menuOpen = signal(false);

  ngOnInit() {}

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 20); }
}
