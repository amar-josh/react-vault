---
name: constants-organization
description: 'Organize constants for Rails-backed React apps across centralized constant files. Covers URL endpoint constants, API method constants, route path constants, API tag type constants, validation regex constants, and app-wide constants. Use when: adding endpoints, routes, tag types, validation patterns, organizing constants, URL constants.'
---

# Constants Organization

## Overview

All constants are centralized in `src/utils/constants/` and organized by concern. This prevents magic strings, enables easy refactoring, and keeps the codebase consistent.

## Constant Files

```
src/utils/constants/
  apiConstants.ts          # HTTP methods
  urlConstant.ts           # All API endpoint URLs grouped by feature
  routeConstants.ts        # All route paths grouped by domain
  apiTagTypeConstants.ts   # RTK Query cache tag types
  validateConstant.tsx     # Regex patterns for form validation
  appConstants.ts          # App-wide constants (localStorage keys, etc.)
  dateConstants.ts         # Date format strings
```

## 1. API Method Constants (`apiConstants.ts`)

```typescript
export const GET = 'GET';
export const POST = 'POST';
export const PUT = 'PUT';
export const DELETE = 'DELETE';
export const PATCH = 'PATCH';
```

Usage in api.ts files:

```typescript
import { GET, POST, PUT, DELETE } from '@/utils/constants/apiConstants';
```

## 2. URL Endpoint Constants (`urlConstant.ts`)

Grouped by feature domain. Each group is an exported object:

```typescript
// Pattern: FEATURE_ENDPOINTS or FEATURE_URL
export const DEPARTMENTS_ENDPOINTS = {
  FETCH_DEPARTMENTS_URL: '/api/v1/departments',
  CREATE_DEPARTMENT: '/api/v1/departments',
  FETCH_DEPARTMENT_DETAIL_URL: '/api/v1/departments/:uid',
  UPDATE_DEPARTMENT: '/api/v1/departments/:uid',
  FETCH_EDU_FACULTY_COMMENCEMENT_YEAR_URL:
    '/api/v1/departments/fetch_edu_level_faculty_commencement_year',
};

export const BANK_ACCOUNT_ENDPOINTS = {
  FETCH_BANK_ACCOUNTS: '/api/v1/bank_accounts',
  ADD_BANK_ACCOUNT: '/api/v1/bank_accounts',
  FETCH_BANK_ACCOUNT_DETAILS: '/api/v1/bank_accounts/:uid',
  SELECT_LIST: '/api/v1/bank_accounts/select_list',
};

export const ACCESS_RIGHTS_API_ENDPOINTS = {
  POSITIONS: '/api/v1/positions',
  POSITION_TYPES: 'position_types',
  REORDER: 'reorder',
};

// System-level endpoints
export const SYSTEM_CONSTANTS = '/api/v1/system_constants';
export const ACCESS_LIST = '/api/v1/access_list';
export const VALIDATE_INVITATION = '/api/v1/validate_invitation';
```

### Adding New Endpoints

```typescript
// Add a new group for your feature:
export const MY_FEATURE_ENDPOINTS = {
  FETCH_LIST: '/api/v1/my_features',
  CREATE: '/api/v1/my_features',
  FETCH_DETAIL: '/api/v1/my_features/:uid',
  UPDATE: '/api/v1/my_features/:uid',
  DELETE: '/api/v1/my_features/:uid',
};
```

## 3. Route Constants (`routeConstants.ts`)

Organized by domain with nested groups:

```typescript
// Top-level routes (absolute paths with leading /)
export const ROUTES = {
  LANDING_PAGE: '/login',
  NOT_FOUND: '/not-found',
  ACCESS_LIST: '/access-list',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  EMPLOYEES: '/employees',
  ACADEMICS: '/academics',
  STUDENTS: '/students',
  VISION_AND_MISSION: '/vision-and-mission',
};

// Nested routes (relative paths, no leading /)
// Use "/*" suffix for routes that have children
export const SETTINGS_ROUTES = {
  DEPARTMENTS: 'departments',
  BANK_ACCOUNTS: 'bank-accounts',
  ACADEMIC_YEARS_DETAILS: 'academic-years-details',
  ADMINS: 'admins',
  PROGRAMS: 'programs' + '/*', // Has child routes
  ACCESS_RIGHTS: 'access-rights/*', // Has child routes
  UNI_INSTITUTE_DETAILS: 'university-institute-details' + '/*',
};

export const EMPLOYEES_ROUTES = {
  EMPLOYEE_RECORDS: 'employee-records' + '/*',
  EMPLOYEE_SETTINGS: 'employee-settings' + '/*',
  FORM_FIELDS: 'form-fields',
  MASTER: 'master' + '/*',
  GENDER: 'gender',
  DESIGNATION: 'designation',
};

export const ACADEMICS_ROUTES = {
  COURSE_MANAGEMENT: 'course-management' + '/*',
  EVALUATION_TOOLS: 'evaluation-tools' + '/*',
  TIMETABLE: 'time-table' + '/*',
};
```

## 4. API Tag Type Constants (`apiTagTypeConstants.ts`)

```typescript
export const API_TAG_TYPES = {
  // Settings
  DEPARTMENT_LIST: 'departmentList',
  DEPARTMENT_DROPDOWN_LIST: 'departmentDropdownList',
  BANK_ACCOUNT_LIST: 'bankAccountList',
  EDUCATIONAL_UNIT_LIST: 'educationalUnitList',
  UNIVERSITY: 'university',

  // Employees
  EMPLOYEE_LIST: 'employeeList',
  GENDER_LIST: 'genderList',
  DESIGNATION_LIST: 'designationList',
  FORM_FIELDS: 'formFields',

  // Academics
  COURSE_CATEGORY_LIST: 'courseCategoryList',
  PROGRAM_LIST: 'programList',

  // Shared
  DOCUMENTS_LIST: 'documentsList',
  ACCESS_RIGHTS_LIST: 'accessRightsList',
};
```

### Adding New Tag Types

```typescript
// Add to API_TAG_TYPES:
MY_FEATURE_LIST: "myFeatureList",
MY_FEATURE_DROPDOWN: "myFeatureDropdown",
```

## 5. Validation Constants (`validateConstant.tsx`)

```typescript
// Regex patterns for form validation
export const bankNameRegx = /^[a-zA-Z\s]+$/;
export const ifscExp = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const numberExp = /^[0-9]+$/;
export const nameRegex = /^[a-zA-Z\s'-]+$/;
export const codeRegex = /^[a-zA-Z0-9_-]+$/;
export const departmentCodeRegex = /^[a-zA-Z0-9]+$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[0-9]{10}$/;
```

## 6. App Constants (`appConstants.ts`)

```typescript
export const LOGGED_IN_USER = 'loggedInUser';
export const SUCCESS = 'success';
export const ERROR = 'error';
```

## 7. Feature-Level Constants

Some features have their own `constants.ts` for action types:

```typescript
// src/features/Settings/constants.ts
export const EDIT = 'edit';
export const DELETE = 'delete';
export const MANUAL = 'manual';
export const SELECT = 'select';
export const CLOSE_PROGRAM = 'closeProgram';
export const ACADEMIC = 'academic';
export const NON_ACADEMIC = 'nonAcademic';
export const CLOSED_DEPARMENTS = 'closedDepartments';
```

## Key Rules

1. NEVER use magic strings in api.ts, containers, or components - always import from constants
2. URL endpoints are grouped by feature as exported objects
3. Route constants use relative paths for nested routes, absolute for top-level
4. Tag types use camelCase strings, constant names use SCREAMING_SNAKE
5. Regex patterns live in `validateConstant.tsx`, not inline in validation schemas
6. Feature-specific constants (action types) live in the feature's own `constants.ts`
7. When adding a new feature, update: `urlConstant.ts`, `apiTagTypeConstants.ts`, and `routeConstants.ts`
