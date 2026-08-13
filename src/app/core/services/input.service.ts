import { Injectable, signal } from '@angular/core';

export const NES_BUTTONS = { A: 0, B: 1, SELECT: 2, START: 3, UP: 4, DOWN: 5, LEFT: 6, RIGHT: 7 } as const;
export type NesButton = typeof NES_BUTTONS[keyof typeof NES_BUTTONS];

type ButtonState = Record<number, boolean>;

@Injectable({ providedIn: 'root' })
export class InputService {
  private state: ButtonState = {};
  private nesCallback: ((btn: number, down: boolean) => void) | null = null;
  private keyMap: Record<string, number> = {
    ArrowUp:    NES_BUTTONS.UP,    ArrowDown:  NES_BUTTONS.DOWN,
    ArrowLeft:  NES_BUTTONS.LEFT,  ArrowRight: NES_BUTTONS.RIGHT,
    Space:      NES_BUTTONS.A,     z:          NES_BUTTONS.B,
    Z:          NES_BUTTONS.B,     x:          NES_BUTTONS.A,
    X:          NES_BUTTONS.A,     Enter:      NES_BUTTONS.START,
    ShiftLeft:  NES_BUTTONS.SELECT,ShiftRight: NES_BUTTONS.SELECT,
  };

  private _keydown = (e: KeyboardEvent) => {
    const btn = this.keyMap[e.code] ?? this.keyMap[e.key];
    if (btn !== undefined) { e.preventDefault(); this._press(btn); }
  };
  private _keyup = (e: KeyboardEvent) => {
    const btn = this.keyMap[e.code] ?? this.keyMap[e.key];
    if (btn !== undefined) this._release(btn);
  };

  // Gamepad polling
  private _gpFrame: number | null = null;
  readonly gamepadConnected = signal(false);

  attach(cb: (btn: number, down: boolean) => void): void {
    this.nesCallback = cb;
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);
    window.addEventListener('gamepadconnected', this._gpConnected);
    window.addEventListener('gamepaddisconnected', this._gpDisconnected);
  }

  detach(): void {
    this.nesCallback = null;
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    window.removeEventListener('gamepadconnected', this._gpConnected);
    window.removeEventListener('gamepaddisconnected', this._gpDisconnected);
    if (this._gpFrame) cancelAnimationFrame(this._gpFrame);
    this.state = {};
  }

  /** Called from TouchControls */
  touchPress(btn: number): void   { this._press(btn); }
  touchRelease(btn: number): void { this._release(btn); }

  private _press(btn: number): void {
    if (this.state[btn]) return;
    this.state[btn] = true;
    this.nesCallback?.(btn, true);
  }
  private _release(btn: number): void {
    if (!this.state[btn]) return;
    this.state[btn] = false;
    this.nesCallback?.(btn, false);
  }

  // ── Gamepad ──
  private _gpConnected = () => {
    this.gamepadConnected.set(true);
    this._pollGamepad();
  };
  private _gpDisconnected = () => {
    this.gamepadConnected.set(false);
    if (this._gpFrame) cancelAnimationFrame(this._gpFrame);
  };

  private _gpMap = [
    NES_BUTTONS.A, NES_BUTTONS.B, null, null,
    null, null, null, null,
    NES_BUTTONS.SELECT, NES_BUTTONS.START
  ];
  private _gpAxisMap = [NES_BUTTONS.LEFT, NES_BUTTONS.RIGHT, NES_BUTTONS.UP, NES_BUTTONS.DOWN];

  private _pollGamepad = () => {
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (!pad) continue;
      pad.buttons.forEach((btn, i) => {
        const nesBtn = this._gpMap[i];
        if (nesBtn === null || nesBtn === undefined) return;
        btn.pressed ? this._press(nesBtn) : this._release(nesBtn);
      });
      // D-pad via axes
      const [ax, ay] = [pad.axes[0] ?? 0, pad.axes[1] ?? 0];
      ax < -0.5 ? this._press(NES_BUTTONS.LEFT)  : this._release(NES_BUTTONS.LEFT);
      ax >  0.5 ? this._press(NES_BUTTONS.RIGHT) : this._release(NES_BUTTONS.RIGHT);
      ay < -0.5 ? this._press(NES_BUTTONS.UP)    : this._release(NES_BUTTONS.UP);
      ay >  0.5 ? this._press(NES_BUTTONS.DOWN)  : this._release(NES_BUTTONS.DOWN);
      // Hat switch buttons 12-15
      pad.buttons[12]?.pressed ? this._press(NES_BUTTONS.UP)    : this._release(NES_BUTTONS.UP);
      pad.buttons[13]?.pressed ? this._press(NES_BUTTONS.DOWN)  : this._release(NES_BUTTONS.DOWN);
      pad.buttons[14]?.pressed ? this._press(NES_BUTTONS.LEFT)  : this._release(NES_BUTTONS.LEFT);
      pad.buttons[15]?.pressed ? this._press(NES_BUTTONS.RIGHT) : this._release(NES_BUTTONS.RIGHT);
    }
    this._gpFrame = requestAnimationFrame(this._pollGamepad);
  };
}
