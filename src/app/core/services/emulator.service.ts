import { Injectable, signal, inject } from '@angular/core';
import { InputService, NES_BUTTONS } from './input.service';

export type EmulatorState = 'idle' | 'loading' | 'running' | 'paused' | 'error';

@Injectable({ providedIn: 'root' })
export class EmulatorService {
  private input = inject(InputService);

  readonly state = signal<EmulatorState>('idle');
  readonly errorMessage = signal<string>('');

  // Performance Signals
  readonly perfFPS = signal<number>(0);
  readonly perfFrameTime = signal<number>(0);
  readonly perfEmuTime = signal<number>(0);
  readonly perfRenderTime = signal<number>(0);
  readonly perfAudioTime = signal<number>(0);
  readonly perfDropped = signal<number>(0);

  private nes: any = null;
  private animFrame: number | null = null;
  private audioCtx: AudioContext | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private _audioBuffer: number[] = [];
  private volume = 0.8;

  // Timing State
  private lastTime = 0;
  private accumulator = 0;
  private readonly FRAME_TIME = 1000 / 60; // ~16.666 ms
  private readonly MAX_CATCH_UP_FRAMES = 3;
  private frameCount = 0;
  private lastFpsTime = 0;
  private _skipRender = false;
  private _wasPlayingBeforeHide = false;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibility);
    }
  }

  async initialize(canvas: HTMLCanvasElement, vol = 0.8): Promise<void> {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize canvas
    this.volume = vol;
    canvas.width = 256;
    canvas.height = 240;
    if (this.ctx) this.imageData = this.ctx.createImageData(256, 240);
  }

  async loadRomFromUrl(url: string): Promise<void> {
    this.state.set('loading');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await this._startEmulator(await res.arrayBuffer());
    } catch (e: any) {
      this.state.set('error');
      this.errorMessage.set(e.message ?? 'Failed to load ROM');
    }
  }

  async loadRomFromBuffer(buf: ArrayBuffer): Promise<void> {
    this.state.set('loading');
    try { await this._startEmulator(buf); }
    catch (e: any) {
      this.state.set('error');
      this.errorMessage.set(e.message ?? 'Invalid ROM');
    }
  }

  private async _startEmulator(buf: ArrayBuffer): Promise<void> {
    const { NES } = await import('jsnes');
    this._setupAudio();
    this.nes = new NES({
      onFrame: (fb: Uint32Array) => this._renderFrame(fb),
      onAudioSample: (l: number, r: number) => { this._audioBuffer.push(l, r); },
    });

    const bytes = new Uint8Array(buf);
    let romStr = '';
    for (let i = 0; i < bytes.length; i++) romStr += String.fromCharCode(bytes[i]);
    this.nes.loadROM(romStr);

    this.input.attach((btn, down) => {
      if (down) this.nes?.buttonDown(1, btn);
      else      this.nes?.buttonUp(1, btn);
    });

    this._startLoop();
    this.state.set('running');
  }

  private _renderFrame(fb: Uint32Array): void {
    if (this._skipRender) return; // Skip DOM update if catching up multiple frames
    
    const tRenderStart = performance.now();
    if (!this.ctx || !this.imageData) return;
    const d = this.imageData.data;
    for (let i = 0; i < fb.length; i++) {
      const idx = i * 4;
      const px = fb[i];
      d[idx]     = (px >> 16) & 0xff;
      d[idx + 1] = (px >> 8)  & 0xff;
      d[idx + 2] =  px        & 0xff;
      d[idx + 3] = 0xff;
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    this.perfRenderTime.set(performance.now() - tRenderStart);
  }

  private _setupAudio(): void {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      return;
    }
    try {
      this.audioCtx = new AudioContext();
      this.scriptNode = this.audioCtx.createScriptProcessor(2048, 0, 2);
      this.scriptNode.onaudioprocess = (e) => {
        const tStart = performance.now();
        const L = e.outputBuffer.getChannelData(0);
        const R = e.outputBuffer.getChannelData(1);
        for (let i = 0; i < L.length; i++) {
          L[i] = (this._audioBuffer[i * 2]     ?? 0) * this.volume;
          R[i] = (this._audioBuffer[i * 2 + 1] ?? 0) * this.volume;
        }
        this._audioBuffer.splice(0, L.length * 2);
        
        // Prevent audio buffer overflow if emulation gets way ahead
        if (this._audioBuffer.length > 8192) {
          this._audioBuffer = this._audioBuffer.slice(-4096); 
        }
        
        this.perfAudioTime.set(performance.now() - tStart);
      };
      this.scriptNode.connect(this.audioCtx.destination);
    } catch {}
  }

  private _startLoop(): void {
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
    }

    this.lastTime = performance.now();
    this.accumulator = 0;
    this.frameCount = 0;
    this.lastFpsTime = this.lastTime;
    this.perfDropped.set(0);

    const loop = (timestamp: number) => {
      this.animFrame = requestAnimationFrame(loop);

      if (this.state() !== 'running') {
        this.lastTime = timestamp; // Keep time advancing while paused to prevent jump on resume
        return;
      }

      let dt = timestamp - this.lastTime;
      this.lastTime = timestamp;
      const tStart = performance.now();

      // Guard: If dt is massive (e.g. background tab), clamp to prevent death spiral
      if (dt > 1000) {
        dt = this.FRAME_TIME;
      }

      this.accumulator += dt;

      let framesToRun = 0;
      while (this.accumulator >= this.FRAME_TIME) {
        framesToRun++;
        this.accumulator -= this.FRAME_TIME;
      }

      if (framesToRun > this.MAX_CATCH_UP_FRAMES) {
        this.perfDropped.update(v => v + (framesToRun - this.MAX_CATCH_UP_FRAMES));
        framesToRun = this.MAX_CATCH_UP_FRAMES;
        this.accumulator = 0;
      }

      if (framesToRun > 0) {
        const tEmuStart = performance.now();
        try {
          for (let i = 0; i < framesToRun; i++) {
            // Only render the final frame of the batch
            this._skipRender = (i < framesToRun - 1);
            this.nes.frame();
          }
        } catch (e) {
          console.error('Emulation crash:', e);
          this.state.set('error');
        }
        this.perfEmuTime.set(performance.now() - tEmuStart);

        this.frameCount++;
        if (timestamp - this.lastFpsTime >= 1000) {
          this.perfFPS.set(this.frameCount);
          this.frameCount = 0;
          this.lastFpsTime = timestamp;
        }
      }

      this.perfFrameTime.set(performance.now() - tStart);
    };

    this.animFrame = requestAnimationFrame(loop);
  }

  private handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      if (this.state() === 'running') {
        this.pause();
        this._wasPlayingBeforeHide = true;
      }
    } else {
      if (this._wasPlayingBeforeHide) {
        this.resume();
        this._wasPlayingBeforeHide = false;
      }
    }
  };

  setVolume(v: number): void { 
    this.volume = Math.max(0, Math.min(1, v));
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
       this.audioCtx.resume();
    }
  }

  pause():  void { 
    if (this.state() === 'running') {
      this.state.set('paused'); 
      if (this.audioCtx) this.audioCtx.suspend();
    }
  }

  resume(): void { 
    if (this.state() === 'paused') {
      this.state.set('running');
      if (this.audioCtx) this.audioCtx.resume();
    }
  }

  togglePause(): void { this.state() === 'running' ? this.pause() : this.resume(); }

  reset():  void { 
    if (this.nes) { 
      this.nes.reset(); 
      this.state.set('running');
      this._audioBuffer = []; 
    } 
  }

  destroy(): void {
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibility);
    }
    this.input.detach();
    try { this.scriptNode?.disconnect(); this.audioCtx?.close(); } catch {}
    this.audioCtx = null; this.scriptNode = null;
    this.nes = null; this.canvas = null; this.ctx = null;
    this.state.set('idle'); this._audioBuffer = [];
  }
}
