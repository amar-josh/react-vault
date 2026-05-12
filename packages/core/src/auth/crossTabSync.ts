/**
 * Cross-tab logout sync via BroadcastChannel.
 *
 * Use case: user logs out in one tab → all other tabs follow.
 * Falls back gracefully when BroadcastChannel is unavailable.
 */
const CHANNEL_NAME = 'bfsi-auth';

export type AuthBroadcast =
  | { type: 'logout'; reason: 'user' | 'idle' | 'expired' | 'forced' }
  | { type: 'login' };

export class CrossTabSync {
  private channel: BroadcastChannel | null = null;

  constructor(
    private readonly onMessage: (msg: AuthBroadcast) => void,
  ) {}

  start(): void {
    if (typeof BroadcastChannel === 'undefined') return;
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.addEventListener('message', (ev: MessageEvent<AuthBroadcast>) => {
      this.onMessage(ev.data);
    });
  }

  stop(): void {
    this.channel?.close();
    this.channel = null;
  }

  broadcast(msg: AuthBroadcast): void {
    this.channel?.postMessage(msg);
  }
}
