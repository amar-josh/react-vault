/**
 * Idle timer. Calls back when no user activity for `idleMs`.
 *
 * Listens to: mousemove, keydown, touchstart, scroll, focus.
 * Use to auto-logout after inactivity (RBI Annexure I §6.2).
 */
export interface IdleTimerConfig {
  /** Milliseconds of inactivity before onIdle fires. */
  idleMs: number;
  /** Called when idle threshold is crossed. */
  onIdle: () => void;
  /** Called on activity AFTER idle (resumed). Optional. */
  onResume?: () => void;
  /** Custom events to listen to. Default is the activity set above. */
  events?: readonly string[];
}

const DEFAULT_EVENTS = ['mousemove', 'keydown', 'touchstart', 'scroll', 'focus'] as const;

export class IdleTimer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isIdle = false;
  private readonly handler: () => void;
  private readonly events: readonly string[];

  constructor(private readonly config: IdleTimerConfig) {
    this.events = config.events ?? DEFAULT_EVENTS;
    this.handler = () => this.onActivity();
  }

  start(): void {
    if (typeof window === 'undefined') return;
    for (const ev of this.events) {
      window.addEventListener(ev, this.handler, { passive: true });
    }
    this.resetTimer();
  }

  stop(): void {
    if (typeof window === 'undefined') return;
    for (const ev of this.events) {
      window.removeEventListener(ev, this.handler);
    }
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  /**
   * Manually report activity. Useful for events outside the default set
   * (e.g. API success indicating server-side activity).
   */
  reportActivity(): void {
    this.onActivity();
  }

  private onActivity(): void {
    if (this.isIdle) {
      this.isIdle = false;
      this.config.onResume?.();
    }
    this.resetTimer();
  }

  private resetTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.isIdle = true;
      this.config.onIdle();
    }, this.config.idleMs);
  }
}
