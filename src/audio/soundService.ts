import Tts from 'react-native-tts';
import { GameSettings, MarkingStyle } from '../types';
import { sanitizedLogger } from '../security/sanitizedLogger';

const NUMBER_WORDS: Record<number, string> = {
  1: 'One',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
  11: 'Eleven',
  12: 'Twelve',
  13: 'Thirteen',
  14: 'Fourteen',
  15: 'Fifteen',
  16: 'Sixteen',
  17: 'Seventeen',
  18: 'Eighteen',
  19: 'Nineteen',
  20: 'Twenty',
  21: 'Twenty-one',
  22: 'Twenty-two',
  23: 'Twenty-three',
  24: 'Twenty-four',
  25: 'Twenty-five',
};

class SoundService {
  private audioCtx: any = null;

  private getAudioContext() {
    if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
      const win = (globalThis as any).window;
      const AudioCtx = win.AudioContext || win.webkitAudioContext;
      if (AudioCtx && !this.audioCtx) {
        try {
          this.audioCtx = new AudioCtx();
        } catch (e) {
          // Context creation fallback
        }
      }
    }
    return this.audioCtx;
  }

  public async speakNumber(num: number, settings: GameSettings): Promise<void> {
    if (!settings?.voiceEnabled) {
      return;
    }

    sanitizedLogger.info('[AUDIO] speakNumber', { num });
    const text = NUMBER_WORDS[num] || `${num}`;
    try {
      if (Tts && typeof Tts.stop === 'function') {
        await Tts.stop();
        Tts.speak(text);
      }
    } catch (e) {
      // TTS fallback
    }
  }

  /**
   * Short realistic pencil writing stroke sound
   */
  public playPencilMark(settings?: GameSettings): void {
    if (settings && !settings.soundEffectsEnabled) return;

    sanitizedLogger.info('[AUDIO] playPencilMark triggered');
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      // Pencil scratch: soft triangle wave pitch drop with noise modulation
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.09);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      // Audio context catch
    }
  }

  /**
   * Short smooth pen click/ink stroke sound
   */
  public playPenMark(settings?: GameSettings): void {
    if (settings && !settings.soundEffectsEnabled) return;

    sanitizedLogger.info('[AUDIO] playPenMark triggered');
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      // Audio context catch
    }
  }

  public playMarkSound(style: MarkingStyle, settings: GameSettings): void {
    sanitizedLogger.info('[AUDIO] playMarkSound', { style });
    if (style === 'pencil') {
      this.playPencilMark(settings);
    } else {
      this.playPenMark(settings);
    }
  }

  /**
   * Continuous pencil line drawing scratch sound synchronized with 450ms line animation
   */
  public playPencilLine(settings?: GameSettings): void {
    if (settings && !settings.soundEffectsEnabled) return;

    sanitizedLogger.info('[AUDIO] playPencilLine triggered');
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(280, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(360, ctx.currentTime + 0.22);
      osc1.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.45);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(180, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(240, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio catch
    }
  }

  /**
   * Smooth continuous pen line drawing sound synchronized with 450ms line animation
   */
  public playPenLine(settings?: GameSettings): void {
    if (settings && !settings.soundEffectsEnabled) return;

    sanitizedLogger.info('[AUDIO] playPenLine triggered');
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(540, ctx.currentTime + 0.22);
      osc.frequency.linearRampToValueAtTime(420, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.06);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.38);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio catch
    }
  }

  public playLineDrawingSound(style: MarkingStyle, settings?: GameSettings): void {
    sanitizedLogger.info('[AUDIO] playLineDrawingSound', { style });
    if (style === 'pencil') {
      this.playPencilLine(settings);
    } else {
      this.playPenLine(settings);
    }
  }

  public playCallChime(settings: GameSettings): void {
    if (!settings?.soundEffectsEnabled) return;

    sanitizedLogger.info('[AUDIO] playCallChime triggered');
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio catch
    }
  }

  /**
   * Nostalgic school-style happy victory cheer / fanfare
   */
  public playBingoSuccess(settings?: GameSettings): void {
    if (settings && !settings.soundEffectsEnabled) return;

    sanitizedLogger.info('[AUDIO] playBingoSuccess triggered');
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      // C5 -> E5 -> G5 -> C6 happy chord arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          ctx.currentTime + idx * 0.12 + 0.35
        );

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
      });
    } catch (e) {
      // Audio catch
    }
  }

  public playVictoryFanfare(settings: GameSettings): void {
    sanitizedLogger.info('[AUDIO] playVictoryFanfare triggered');
    this.playBingoSuccess(settings);
  }

  public playDiceRoll(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150 + Math.random() * 200, ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.04);
      }
    } catch (e) {}
  }

  public playTokenMove(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  public playCapture(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  public playLadderClimb(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      [350, 450, 550, 700].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.07);
      });
    } catch (e) {}
  }

  public playSnakeSlide(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  public playCardDraw(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {}
  }

  public playCardPlay(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch (e) {}
  }

  public playCardInvalid(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  }

  public playUnoCall(): void {
    this.playBingoSuccess();
  }

  public playPuzzleSuccess(): void {
    this.playBingoSuccess();
  }

  public playPuzzleFailure(): void {
    this.playCardInvalid();
  }
}

export const soundService = new SoundService();

