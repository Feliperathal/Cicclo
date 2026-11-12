import { describe, expect, it } from 'vitest';

import { ApiUrlValidationError, hasApiUrlChanged, normalizeApiUrl, resolveApiUrl } from './apiUrl';

describe('normalizeApiUrl', () => {
  it.each([
    [' http://192.168.1.100:5046/ ', 'http://192.168.1.100:5046'],
    ['https://api.example.com/', 'https://api.example.com'],
  ])('normaliza uma URL válida', (input, expected) => {
    expect(normalizeApiUrl(input)).toBe(expected);
  });

  it.each([
    '',
    '192.168.1.100:5046',
    'ftp://server.example.com',
    'http://user:password@server.example.com',
    'http://server.example.com/api',
    'http://server.example.com?debug=true',
    'http://server.example.com#fragment',
    'http://server.example.com:99999',
  ])('rejeita a URL inválida %s', (input) => {
    expect(() => normalizeApiUrl(input)).toThrow(ApiUrlValidationError);
  });
});

describe('resolveApiUrl', () => {
  it('prioriza a URL salva', () => {
    expect(resolveApiUrl('http://saved.local:5046', 'http://default.local:5046')).toBe('http://saved.local:5046');
  });

  it('usa a URL padrão quando não existe URL salva', () => {
    expect(resolveApiUrl(null, 'http://default.local:5046')).toBe('http://default.local:5046');
  });

  it('retorna null quando nenhuma URL válida existe', () => {
    expect(resolveApiUrl('invalid', undefined)).toBeNull();
  });
});

describe('hasApiUrlChanged', () => {
  it('não considera barras finais e espaços como mudança de servidor', () => {
    expect(hasApiUrlChanged('http://server.local:5046', ' http://server.local:5046/ ')).toBe(false);
  });

  it('identifica uma mudança real de servidor', () => {
    expect(hasApiUrlChanged('http://server.local:5046', 'http://other.local:5046')).toBe(true);
  });
});
