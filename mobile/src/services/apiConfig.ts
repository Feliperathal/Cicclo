import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeApiUrl, resolveApiUrl } from './apiUrl';

export { ApiUrlValidationError, normalizeApiUrl } from './apiUrl';

const API_URL_STORAGE_KEY = '@cicclo/api-url';

let activeApiUrl: string | null = null;

export interface ApiConfigLoadResult {
  url: string | null;
  warning: string | null;
}

function getDefaultApiUrl(): string | null {
  return resolveApiUrl(null, process.env.EXPO_PUBLIC_API_URL);
}

export async function loadApiConfig(): Promise<ApiConfigLoadResult> {
  let savedUrl: string | null = null;
  let warning: string | null = null;

  try {
    savedUrl = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
  } catch {
    warning = 'Não foi possível carregar a configuração salva. Usando a configuração padrão, quando disponível.';
  }

  if (savedUrl) {
    try {
      activeApiUrl = normalizeApiUrl(savedUrl);
      return { url: activeApiUrl, warning };
    } catch {
      warning = 'A configuração salva era inválida. Informe novamente o endereço do servidor.';
    }
  }

  activeApiUrl = getDefaultApiUrl();
  return { url: activeApiUrl, warning };
}

export async function saveApiUrl(value: string): Promise<string> {
  const normalizedUrl = normalizeApiUrl(value);
  await AsyncStorage.setItem(API_URL_STORAGE_KEY, normalizedUrl);
  activeApiUrl = normalizedUrl;
  return normalizedUrl;
}

export function getActiveApiUrl(): string {
  if (!activeApiUrl) {
    throw new Error('A URL da API ainda não foi configurada.');
  }

  return activeApiUrl;
}
