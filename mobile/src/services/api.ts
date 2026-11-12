import type {
  ConsumeServiceRequest,
  ConsumeServiceResponse,
  LaundryServiceResponse,
  ProblemDetails,
  WalletResponse,
} from '../types/api';
import { getActiveApiUrl, normalizeApiUrl } from './apiConfig';

const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly problem?: ProblemDetails,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiConnectionError extends Error {
  constructor(public readonly timedOut: boolean) {
    super(timedOut ? 'Request timed out.' : 'Could not connect to the API.');
    this.name = 'ApiConnectionError';
  }
}

async function parseProblem(response: Response): Promise<ProblemDetails | undefined> {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, init?: RequestInit, baseUrl = getActiveApiUrl()): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const problem = await parseProblem(response);
      throw new ApiError(
        problem?.detail ?? problem?.title ?? 'A API retornou um erro.',
        response.status,
        problem,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const timedOut = error instanceof Error && error.name === 'AbortError';
    throw new ApiConnectionError(timedOut);
  } finally {
    clearTimeout(timeout);
  }
}

function isLaundryService(value: unknown): value is LaundryServiceResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const service = value as Partial<LaundryServiceResponse>;
  return (
    Number.isInteger(service.id) &&
    typeof service.name === 'string' &&
    service.name.length > 0 &&
    typeof service.price === 'number' &&
    Number.isFinite(service.price)
  );
}

export async function testApiConnection(candidateUrl: string): Promise<void> {
  const baseUrl = normalizeApiUrl(candidateUrl);
  const services = await request<unknown>('/api/services', undefined, baseUrl);

  if (!Array.isArray(services) || !services.every(isLaundryService)) {
    throw new Error('A resposta não corresponde à API Cicclo.');
  }
}

export function getWallet(accountId: number): Promise<WalletResponse> {
  return request<WalletResponse>(`/api/wallet/${accountId}`);
}

export function getLaundryServices(): Promise<LaundryServiceResponse[]> {
  return request<LaundryServiceResponse[]>('/api/services');
}

export function consumeLaundryService(
  requestBody: ConsumeServiceRequest,
): Promise<ConsumeServiceResponse> {
  return request<ConsumeServiceResponse>('/api/services/consume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
}
