export const API_BASE = 'http://localhost:5282';

export function apiUrl(path: string) {
  // ensure leading slash
  if (!path.startsWith('/')) path = '/' + path;
  return API_BASE + path;
}
