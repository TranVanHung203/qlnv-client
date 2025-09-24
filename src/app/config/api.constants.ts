export const API_BASE = 'https://localhost:7094';

export function apiUrl(path: string) {
  // ensure leading slash
  if (!path.startsWith('/')) path = '/' + path;
  return API_BASE + path;
}
