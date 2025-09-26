export const API_BASE = 'http://192.168.1.140';

export function apiUrl(path: string) {
  // ensure leading slash
  if (!path.startsWith('/')) path = '/' + path;
  return API_BASE + path;
}
