import type {
  ConsumeServiceRequest,
  ConsumeServiceResponse,
  LaundryServiceResponse,
  ProblemDetails,
  WalletResponse,
} from '../types/api';

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

function getApiUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!configuredUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não foi configurada.');
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL possui um formato inválido.');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL deve utilizar HTTP ou HTTPS.');
  }

  return configuredUrl.replace(/\/+$/, '');
}

async function parseProblem(response: Response): Promise<ProblemDetails | undefined> {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
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
