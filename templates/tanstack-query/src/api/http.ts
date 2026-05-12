/**
 * Typed HTTP helpers for TanStack Query feature services.
 *
 * Usage:
 *   import { GET, POST, PUT, PATCH, DELETE } from '@/api/http';
 *
 *   interface ILoginRequest { email: string; password: string; }
 *   interface ILoginResponse { token: string; userId: string; }
 *
 *   export const loginService = (payload: ILoginRequest) =>
 *     POST<ILoginResponse, ILoginRequest>('/auth/login', payload);
 *
 * Pair with useMutation / useQuery:
 *   const m = useMutation({ mutationFn: loginService });
 *   const q = useQuery({ queryKey: ['kyc', id], queryFn: () => getKyc(id) });
 */
import type { AxiosRequestConfig } from 'axios';
import axiosInstance from './axiosInstance.js';

export async function GET<TResponse, TParams = void>(
  url: string,
  params?: TParams,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const { data } = await axiosInstance.get<TResponse>(url, { ...config, params });
  return data;
}

export async function POST<TResponse, TRequest = void>(
  url: string,
  payload?: TRequest,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const { data } = await axiosInstance.post<TResponse>(url, payload, config);
  return data;
}

export async function PUT<TResponse, TRequest = void>(
  url: string,
  payload?: TRequest,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const { data } = await axiosInstance.put<TResponse>(url, payload, config);
  return data;
}

export async function PATCH<TResponse, TRequest = void>(
  url: string,
  payload?: TRequest,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const { data } = await axiosInstance.patch<TResponse>(url, payload, config);
  return data;
}

export async function DELETE<TResponse = void>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const { data } = await axiosInstance.delete<TResponse>(url, config);
  return data;
}
