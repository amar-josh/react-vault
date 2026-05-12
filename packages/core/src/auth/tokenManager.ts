/**
 * Token manager with refresh race protection.
 *
 * Key invariants:
 *   - Tokens live in MEMORY, not localStorage (which is XSS-readable)
 *   - One refresh in-flight at a time, others await it
 *   - Refresh failure clears tokens and fires `onLoggedOut`
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Unix ms when accessToken expires. Use to proactively refresh. */
  accessExpiresAt: number;
}

export interface TokenManagerConfig {
  /** Function that exchanges a refresh token for a new TokenPair. */
  refresh: (refreshToken: string) => Promise<TokenPair>;
  /** Called when tokens become unavailable (refresh failed). */
  onLoggedOut?: () => void;
  /** Proactively refresh when accessToken expires within this many ms. Default 30s. */
  proactiveRefreshLeadMs?: number;
}

export class TokenManager {
  private tokens: TokenPair | null = null;
  private refreshPromise: Promise<TokenPair> | null = null;

  constructor(private readonly config: TokenManagerConfig) {}

  setTokens(pair: TokenPair): void {
    this.tokens = pair;
  }

  clear(): void {
    this.tokens = null;
    this.config.onLoggedOut?.();
  }

  hasTokens(): boolean {
    return this.tokens !== null;
  }

  /**
   * Get a valid access token. Triggers refresh if expired or near-expiry.
   * Returns null if not logged in.
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) return null;
    const leadMs = this.config.proactiveRefreshLeadMs ?? 30_000;
    if (this.tokens.accessExpiresAt - Date.now() <= leadMs) {
      const refreshed = await this.refreshOnce();
      return refreshed?.accessToken ?? null;
    }
    return this.tokens.accessToken;
  }

  /**
   * Synchronous access token getter for interceptor usage. May return an
   * expired token if no refresh has been triggered yet; the 401 handler
   * will catch and retry.
   */
  getAccessTokenSync(): string | null {
    return this.tokens?.accessToken ?? null;
  }

  /**
   * Force a refresh now. Subsequent calls share the same in-flight promise.
   */
  async refreshOnce(): Promise<TokenPair | null> {
    if (this.refreshPromise) {
      return this.refreshPromise.catch(() => null);
    }
    if (!this.tokens) return null;
    const refreshToken = this.tokens.refreshToken;
    this.refreshPromise = (async () => {
      try {
        const fresh = await this.config.refresh(refreshToken);
        this.tokens = fresh;
        return fresh;
      } catch (err) {
        this.clear();
        throw err;
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise.catch(() => null);
  }
}
