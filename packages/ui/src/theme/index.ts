/**
 * Theme — design tokens for BFSI apps.
 *
 * v0.1: minimal token set. Tailwind config in templates references these.
 */
export const tokens = {
  // BFSI status colors — used by StatusBadge, audit indicators, etc.
  status: {
    pending: 'hsl(38 92% 50%)', // amber
    approved: 'hsl(142 71% 45%)', // green
    rejected: 'hsl(0 84% 60%)', // red
    review: 'hsl(217 91% 60%)', // blue
    expired: 'hsl(240 5% 50%)', // gray
  },
  // Audit sensitivity tiers
  sensitivity: {
    public: 'hsl(240 5% 96%)',
    internal: 'hsl(217 91% 95%)',
    confidential: 'hsl(38 92% 92%)',
    restricted: 'hsl(0 84% 95%)',
  },
} as const;
