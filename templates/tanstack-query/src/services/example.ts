/**
 * Example service. Pattern to copy for new features:
 *
 *   1. Define IRequest / IResponse interfaces
 *   2. Export plain async functions that call GET/POST/PUT/PATCH/DELETE
 *   3. Use them inside React components via useQuery / useMutation
 *
 * Keep services in src/services/<feature>.ts or src/features/<Feature>/service.ts —
 * either works. Don't put TanStack hooks here; this layer is hook-free so
 * services are easy to unit-test.
 */
import { GET, POST } from '../api/http.js';

export interface IExampleListResponse {
  items: Array<{ id: string; name: string }>;
  total: number;
}

export interface IExampleCreateRequest {
  name: string;
}

export interface IExampleCreateResponse {
  id: string;
  name: string;
}

export const getExamples = (): Promise<IExampleListResponse> =>
  GET<IExampleListResponse>('/examples');

export const createExample = (payload: IExampleCreateRequest): Promise<IExampleCreateResponse> =>
  POST<IExampleCreateResponse, IExampleCreateRequest>('/examples', payload);
