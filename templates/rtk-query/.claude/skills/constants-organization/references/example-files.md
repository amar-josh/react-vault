# Constants files — templates

## `src/utils/constants/apiConstants.ts`

```ts
export const API_VERSION = '/v1';
export const API_URL = import.meta.env.VITE_API_BASE_URL;

// HTTP methods as constants — used by axiosBaseQuery method comparisons
export const GET = 'GET' as const;
export const POST = 'POST' as const;
export const PUT = 'PUT' as const;
export const PATCH = 'PATCH' as const;
export const DELETE = 'DELETE' as const;
```

## `src/utils/constants/appConstants.ts`

```ts
// Storage keys
export const LOGGED_IN_USER = 'loggedInUser';
export const SELECTED_LOCALE = 'selectedLocale';
export const THEME_PREFERENCE = 'themePreference';

// Notification types
export const SUCCESS = 'success' as const;
export const ERROR = 'error' as const;
export const INFO = 'info' as const;
export const WARNING = 'warning' as const;

// Status enums
export const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVIEW: 'review',
} as const;
export type KycStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];
```

## `src/utils/constants/urlConstants.ts`

```ts
// Group endpoints by feature. Use functions for dynamic paths.

export const AUTH_URLS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  PROFILE: '/auth/profile',
} as const;

export const KYC_URLS = {
  LIST: '/kyc',
  DETAIL: (id: string) => `/kyc/${id}`,
  SUBMIT: '/kyc/submit',
  APPROVE: (id: string) => `/kyc/${id}/approve`,
  REJECT: (id: string) => `/kyc/${id}/reject`,
} as const;

export const TRANSACTION_URLS = {
  LIST: '/transactions',
  DETAIL: (id: string) => `/transactions/${id}`,
  CREATE: '/transactions',
} as const;

// Used by request interceptor side-paths (if any)
export const VALIDATE_INVITATION = '/auth/validate-invitation';
```

## `src/utils/constants/routeConstants.ts`

```ts
export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  kyc: {
    list: '/kyc',
    detail: '/kyc/:id',
    submit: '/kyc/submit',
  },
  transactions: {
    list: '/transactions',
    detail: '/transactions/:id',
    create: '/transactions/new',
  },
  notFound: '*',
} as const;

// For useNavigate() with dynamic params, write small helpers:
export const kycDetailPath = (id: string): string => `/kyc/${id}`;
export const transactionDetailPath = (id: string): string => `/transactions/${id}`;
```

## `src/utils/constants/tagTypes.ts`

```ts
// Every RTK Query API's tagTypes array unions from here.
// One literal per feature/entity. Keep this list as the source of truth.

export const TAG_TYPES = [
  'User',
  'Kyc',
  'Transaction',
  'Loan',
  'Document',
  'AccessRights',
] as const;

export type TagType = (typeof TAG_TYPES)[number];
```

## `src/utils/constants/regexConstants.ts`

```ts
// Re-export the BFSI patterns from core so there's one source of truth.
// Add app-specific regexes below.

export { PII_PATTERNS } from '@<scope>/core/pii';

// Pull out common ones with friendlier names:
import { PII_PATTERNS } from '@<scope>/core/pii';
export const PAN_REGEX = PII_PATTERNS.pan;
export const AADHAAR_REGEX = PII_PATTERNS.aadhaar;
export const MOBILE_REGEX = PII_PATTERNS.mobileIndia;
export const IFSC_REGEX = PII_PATTERNS.ifsc;
export const PINCODE_REGEX = PII_PATTERNS.pincodeIndia;
export const EMAIL_REGEX = PII_PATTERNS.email;

// App-specific patterns:
export const REFERENCE_CODE_REGEX = /^ERR-[A-Z0-9]{4}$/;
export const TRANSACTION_ID_REGEX = /^TXN[0-9]{12}$/;
```
