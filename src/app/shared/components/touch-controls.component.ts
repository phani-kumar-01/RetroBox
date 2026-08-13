import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputService, NES_BUTTONS } from '../../core/services/input.service';

@Component({
  selector: 'app-touch-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
  <!-- D-Pad -->
  <div class="tc-dpad-zone">
    <div class="dpad">
      <button class="dpad-btn up"    (pointerdown)="press($event, B.UP)"    (pointerup)="release($event, B.UP)"    (pointercancel)="release($event, B.UP)" (pointerleave)="release($event, B.UP)"></button>
      <button class="dpad-btn left"  (pointerdown)="press($event, B.LEFT)"  (pointerup)="release($event, B.LEFT)"  (pointercancel)="release($event, B.LEFT)" (pointerleave)="release($event, B.LEFT)"></button>
      <button class="dpad-btn right" (pointerdown)="press($event, B.RIGHT)" (pointerup)="release($event, B.RIGHT)" (pointercancel)="release($event, B.RIGHT)" (pointerleave)="release($event, B.RIGHT)"></button>
      <button class="dpad-btn down"  (pointerdown)="press($event, B.DOWN)"  (pointerup)="release($event, B.DOWN)"  (pointercancel)="release($event, B.DOWN)" (pointerleave)="release($event, B.DOWN)"></button>
      <div class="dpad-center"></div>
    </div>
  </div>

  <!-- Center Start/Select -->
  <div class="tc-center-zone">
    <div class="center-btns">
      <button class="sys-btn" (pointerdown)="press($event, B.SELECT)" (pointerup)="release($event, B.SELECT)" (pointercancel)="release($event, B.SELECT)" (pointerleave)="release($event, B.SELECT)">
        <span>SELECT</span>
      </button>
      <button class="sys-btn" (pointerdown)="press($event, B.START)" (pointerup)="release($event, B.START)" (pointercancel)="release($event, B.START)" (pointerleave)="release($event, B.START)">
        <span>START</span>
      </button>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="tc-action-zone">
    <div class="action-btns">
      <button class="action-btn btn-b" (pointerdown)="press($event, B.B)" (pointerup)="release($event, B.B)" (pointercancel)="release($event, B.B)" (pointerleave)="release($event, B.B)">B</button>
      <button class="action-btn btn-a" (pointerdown)="press($event, B.A)" (pointerup)="release($event, B.A)" (pointercancel)="release($event, B.A)" (pointerleave)="release($event, B.A)">A</button>
    </div>
  </div>
  `,
  styleUrl: './touch-controls.component.css'
})
export class TouchControlsComponent {
  private input = inject(InputService);
  B = NES_BUTTONS;

  press(e: Event, btn: number) {
    e.preventDefault();
    this.input.touchPress(btn);
  }

  release(e: Event, btn: number) {
    e.preventDefault();
    this.input.touchRelease(btn);
  }
}
