import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="container settings-page">
  <div class="settings-card">
    <h1 class="settings-title">⚙ OPTIONS</h1>

    <div class="settings-group">
      <h2 class="settings-group-title">🔊 AUDIO</h2>
      <div class="setting-row">
        <div>
          <p class="setting-label">VOLUME</p>
        </div>
        <div class="volume-control">
          <input type="range" min="0" max="100" [value]="s().volume" (input)="save({volume: +($any($event.target).value)})" />
          <span class="volume-val">{{s().volume}}%</span>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <h2 class="settings-group-title">📺 DISPLAY</h2>
      <div class="setting-row">
        <div>
          <p class="setting-label">CRT SCANLINES</p>
          <p class="setting-sub">RETRO SCANLINE EFFECT ON PLAYER</p>
        </div>
        <button class="toggle-btn" [class.on]="s().crtEffect" (click)="save({crtEffect: !s().crtEffect})">
          {{s().crtEffect ? 'ON' : 'OFF'}}
        </button>
      </div>
    </div>

    <div class="settings-group">
      <h2 class="settings-group-title">🎮 CONTROLS</h2>
      <div class="setting-row">
        <div>
          <p class="setting-label">D-PAD / MOVE</p>
        </div>
        <div class="control-val">ARROW KEYS</div>
      </div>
      <div class="setting-row">
        <div><p class="setting-label">B BUTTON</p></div>
        <div class="control-val">Z</div>
      </div>
      <div class="setting-row">
        <div><p class="setting-label">A BUTTON</p></div>
        <div class="control-val">X</div>
      </div>
      <div class="setting-row">
        <div><p class="setting-label">START</p></div>
        <div class="control-val">ENTER</div>
      </div>
      <div class="setting-row">
        <div><p class="setting-label">SELECT</p></div>
        <div class="control-val">SHIFT</div>
      </div>
    </div>

    <div class="settings-group" style="border-bottom:none">
      <h2 class="settings-group-title">★ ABOUT</h2>
      <div class="setting-row">
        <div>
          <p class="setting-label">RETROBOX v0.1.0</p>
          <p class="setting-sub">BROWSER-BASED NES GAMING</p>
          <p class="setting-sub">HOMEBREW ROMS ONLY</p>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .settings-page { padding-top: calc(var(--nav-height) + var(--space-10)); padding-bottom: var(--space-20); max-width: 680px; }
    .settings-card {
      background: var(--surface-1);
      border: 4px solid var(--cyan);
      box-shadow: 8px 8px 0px rgba(0,0,0,1);
      padding: var(--space-8);
      position: relative;
    }
    .settings-card::before {
      content: ''; position: absolute; inset: 0;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
      pointer-events: none; z-index: 0;
    }
    .settings-title {
      font-family: 'Press Start 2P', cursive;
      font-size: 1.5rem; color: var(--yellow);
      margin-bottom: var(--space-8); text-align: center;
      text-shadow: 4px 4px 0px rgba(0,0,0,1);
      position: relative; z-index: 1;
    }
    .settings-group {
      border-bottom: 2px dashed var(--surface-3);
      padding-bottom: var(--space-6); margin-bottom: var(--space-6);
      position: relative; z-index: 1;
    }
    .settings-group-title {
      font-family: 'Press Start 2P', cursive; font-size: 0.8rem;
      color: var(--cyan); margin-bottom: var(--space-6);
    }
    .setting-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: var(--space-6); margin-bottom: var(--space-4);
    }
    .setting-row:last-child { margin-bottom: 0; }
    
    .setting-label { font-family: 'VT323', monospace; font-size: 1.4rem; color: var(--white); text-transform: uppercase; }
    .setting-sub { font-family: 'VT323', monospace; font-size: 1rem; color: var(--text-secondary); }
    
    .volume-control { display: flex; align-items: center; gap: var(--space-4); min-width: 200px; }
    .volume-val { font-family: 'Press Start 2P', cursive; font-size: 0.6rem; color: var(--yellow); width: 40px; text-align: right; }
    
    .toggle-btn {
      padding: 8px 16px; border-radius: 0; border: 2px solid var(--text-secondary);
      background: var(--black); color: var(--text-secondary);
      font-family: 'Press Start 2P', cursive; font-size: 0.6rem;
      cursor: pointer; transition: all var(--dur-fast);
    }
    .toggle-btn.on { border-color: var(--green); color: var(--green); background: rgba(0,255,65,0.1); box-shadow: 2px 2px 0px var(--green); }
    
    .control-val { font-family: 'Press Start 2P', cursive; font-size: 0.6rem; color: var(--yellow); }
  `]
})
export class SettingsComponent {
  private storage = inject(StorageService);
  s = this.storage.settings;
  save(patch: any) { this.storage.saveSettings(patch); }
}
