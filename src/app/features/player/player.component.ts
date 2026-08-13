import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmulatorService } from '../../core/services/emulator.service';
import { GameService } from '../../core/services/game.service';
import { StorageService } from '../../core/services/storage.service';
import { Game } from '../../core/models/game.model';
import { TouchControlsComponent } from '../../shared/components/touch-controls.component';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, TouchControlsComponent],
  templateUrl: './player.component.html',
  styleUrl: './player.component.css'
})
export class PlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('playerShell') playerShellRef!: ElementRef<HTMLElement>;

  private route    = inject(ActivatedRoute);
  private gs       = inject(GameService);
  private storage  = inject(StorageService);
  readonly emu     = inject(EmulatorService);

  game         = signal<Game | null>(null);
  isLocal      = signal(false);
  volume       = signal(80);
  showCrt      = signal(false);
  gameId       = '';
  
  isFullscreen = signal(false);
  toolbarFaded = signal(false);
  showPerf     = signal(false); // Debug HUD toggle
  
  private fadeTimer: any;
  private resizeObserver!: ResizeObserver;

  ngOnInit() {
    this.gameId = this.route.snapshot.params['id'];
    this.isLocal.set(this.gameId === 'local');

    if (!this.isLocal()) {
      const g = this.gs.getById(this.gameId);
      this.game.set(g ?? null);
      if (g) this.storage.addRecentlyPlayed(g.id);
    }
  }

  ngAfterViewInit() {
    if (!this.isLocal() && this.game()) {
      this.startGame();
    }

    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => this.recalculatePlayerLayout());
    });
    
    if (this.playerShellRef) {
      this.resizeObserver.observe(this.playerShellRef.nativeElement);
    }
    
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    
    this.resetToolbarTimer();
  }

  ngOnDestroy() { 
    this.emu.destroy(); 
    if (this.resizeObserver) this.resizeObserver.disconnect();
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    clearTimeout(this.fadeTimer);
  }

  async startGame() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    await this.emu.initialize(canvas, this.volume() / 100);
    await this.emu.loadRomFromUrl(this.game()!.romPath);
    setTimeout(() => this.recalculatePlayerLayout(), 0);
  }

  async loadLocalRom(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.nes')) {
      alert('Please select a valid .nes ROM file.');
      return;
    }
    const buf = await file.arrayBuffer();
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    await this.emu.initialize(canvas, this.volume() / 100);
    await this.emu.loadRomFromBuffer(buf);
    setTimeout(() => this.recalculatePlayerLayout(), 0);
  }

  togglePause()     { this.emu.togglePause(); }
  reset()           { this.emu.reset(); }
  setVolume(v: number) { this.volume.set(v); this.emu.setVolume(v / 100); }

  async toggleFullscreen() {
    const shell = this.playerShellRef?.nativeElement;
    if (!shell) return;
    
    if (!document.fullscreenElement) {
      try {
        await shell.requestFullscreen();
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      await document.exitFullscreen();
    }
  }

  private onFullscreenChange = () => {
    this.isFullscreen.set(!!document.fullscreenElement);
    requestAnimationFrame(() => this.recalculatePlayerLayout());
  };

  @HostListener('window:orientationchange')
  onOrientationChange() {
    requestAnimationFrame(() => this.recalculatePlayerLayout());
  }

  recalculatePlayerLayout() {
    const shell = this.playerShellRef?.nativeElement;
    if (!shell) return;
    
    const shellWidth = shell.clientWidth;
    const shellHeight = shell.clientHeight;
    
    const toolbar = shell.querySelector('.player-toolbar') as HTMLElement;
    const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
    
    // Check if we are showing mobile touch controls (by checking pointer media query)
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    
    let availableWidth = shellWidth;
    let availableHeight = shellHeight - toolbarHeight;
    
    if (isMobile) {
      if (isLandscape) {
        const leftZone = shell.querySelector('.tc-dpad-zone') as HTMLElement;
        const rightZone = shell.querySelector('.tc-action-zone') as HTMLElement;
        const bottomZone = shell.querySelector('.tc-center-zone') as HTMLElement;
        
        const leftW = leftZone ? leftZone.offsetWidth : 0;
        const rightW = rightZone ? rightZone.offsetWidth : 0;
        const bottomH = bottomZone ? bottomZone.offsetHeight : 0;
        
        availableWidth = shellWidth - leftW - rightW;
        availableHeight = shellHeight - toolbarHeight - bottomH;
      } else {
        const controlsWrap = shell.querySelector('.touch-controls-layout') as HTMLElement;
        const controlsHeight = controlsWrap ? controlsWrap.offsetHeight : 0;
        availableHeight = shellHeight - toolbarHeight - controlsHeight;
      }
    }
    
    // Safety boundaries
    availableWidth = Math.max(availableWidth, 100);
    availableHeight = Math.max(availableHeight, 100);
    
    // Calculate largest 4:3 fit
    let gameWidth = availableWidth;
    let gameHeight = availableWidth * (3 / 4);
    
    if (gameHeight > availableHeight) {
      gameHeight = availableHeight;
      gameWidth = availableHeight * (4 / 3);
    }
    
    shell.style.setProperty('--game-width', Math.floor(gameWidth) + 'px');
    shell.style.setProperty('--game-height', Math.floor(gameHeight) + 'px');
  }

  @HostListener('window:pointermove')
  @HostListener('window:touchstart')
  @HostListener('window:keydown')
  resetToolbarTimer() {
    this.toolbarFaded.set(false);
    clearTimeout(this.fadeTimer);
    if (this.isFullscreen()) {
      this.fadeTimer = setTimeout(() => {
        this.toolbarFaded.set(true);
      }, 3000);
    }
  }

  get pauseLabel() { return this.emu.state() === 'paused' ? '▶ Resume' : '⏸ Pause'; }
  
  togglePerf() {
    this.showPerf.set(!this.showPerf());
  }
}
