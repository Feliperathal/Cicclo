export class ApiUrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiUrlValidationError';
  }
}

export function normalizeApiUrl(value: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) throw new ApiUrlValidationError('Informe a URL do servidor.');

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    throw new ApiUrlValidationError('Informe uma URL válida, incluindo http:// ou https://.');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:')
    throw new ApiUrlValidationError('A URL deve utilizar HTTP ou HTTPS.');
  if (!parsedUrl.hostname)
    throw new ApiUrlValidationError('A URL deve possuir um endereço de servidor válido.');
  if (parsedUrl.username || parsedUrl.password)
    throw new ApiUrlValidationError('A URL não pode conter credenciais.');
  if (parsedUrl.search || parsedUrl.hash)
    throw new ApiUrlValidationError('A URL não pode conter parâmetros ou fragmentos.');
  if (parsedUrl.pathname !== '/' && parsedUrl.pathname !== '')
    throw new ApiUrlValidationError('Informe somente a raiz do servidor, sem caminhos adicionais.');

  return `${parsedUrl.protocol}//${parsedUrl.host}`;
}

export function resolveApiUrl(savedUrl: string | null, defaultUrl: string | undefined): string | null {
  for (const candidate of [savedUrl, defaultUrl]) {
    if (!candidate?.trim()) continue;
    try {
      return normalizeApiUrl(candidate);
    } catch {
      // Invalid saved/default values do not become active configuration.
    }
  }
  return null;
}
