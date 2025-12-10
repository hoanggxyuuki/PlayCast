
import { SleepTimer } from '../types';

export class SleepTimerService {
  private static timerId: NodeJS.Timeout | null = null;
  private static timer: SleepTimer | null = null;
  private static onTimerEndCallback: (() => void) | null = null;


  static start(duration: number, onTimerEnd: () => void): void {

    this.cancel();

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    this.timer = {
      isActive: true,
      duration,
      startTime,
      endTime,
    };

    this.onTimerEndCallback = onTimerEnd;


    this.timerId = setTimeout(() => {
      console.log('Sleep timer ended');
      this.onTimerEndCallback?.();
      this.cancel();
    }, duration * 60 * 1000);

    console.log(`Sleep timer started: ${duration} minutes`);
  }


  static cancel(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.timer = null;
    this.onTimerEndCallback = null;
    console.log('Sleep timer cancelled');
  }


  static getTimer(): SleepTimer | null {
    return this.timer;
  }


  static isActive(): boolean {
    return this.timer?.isActive ?? false;
  }


  static getRemainingMinutes(): number {
    if (!this.timer || !this.timer.isActive) {
      return 0;
    }

    const now = new Date();
    const remaining = this.timer.endTime.getTime() - now.getTime();
    return Math.max(0, Math.ceil(remaining / 60000));
  }


  static getRemainingFormatted(): string {
    if (!this.timer || !this.timer.isActive) {
      return '00:00';
    }

    const now = new Date();
    const remaining = this.timer.endTime.getTime() - now.getTime();

    if (remaining <= 0) {
      return '00:00';
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }


  static extend(additionalMinutes: number): void {
    if (!this.timer || !this.timer.isActive) {
      console.warn('No active timer to extend');
      return;
    }


    if (this.timerId) {
      clearTimeout(this.timerId);
    }


    const newEndTime = new Date(this.timer.endTime.getTime() + additionalMinutes * 60 * 1000);
    this.timer.endTime = newEndTime;
    this.timer.duration += additionalMinutes;


    const remainingMs = newEndTime.getTime() - new Date().getTime();
    this.timerId = setTimeout(() => {
      console.log('Sleep timer ended');
      this.onTimerEndCallback?.();
      this.cancel();
    }, remainingMs);

    console.log(`Sleep timer extended by ${additionalMinutes} minutes`);
  }


  static getPredefinedDurations(): Array<{ label: string; minutes: number }> {
    return [
      { label: '15 minutes', minutes: 15 },
      { label: '30 minutes', minutes: 30 },
      { label: '45 minutes', minutes: 45 },
      { label: '1 hour', minutes: 60 },
      { label: '1.5 hours', minutes: 90 },
      { label: '2 hours', minutes: 120 },
    ];
  }
}
