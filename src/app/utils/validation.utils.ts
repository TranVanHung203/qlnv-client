export interface ParsedValidationResult {
  fields: Record<string, string[]>;
  summary: string[];
}

const FIELD_MAP: Record<string, string> = {
  Email: 'email',
  Username: 'username',
  FullName: 'fullName',
  Password: 'password',
  Role: 'role',
};

export function parseValidationErrors(resp: any): ParsedValidationResult | null {
  if (!resp) return null;
  const body = resp.error ?? resp;
  if (body && body.errors && typeof body.errors === 'object') {
    const fields: Record<string, string[]> = {};
    const summary: string[] = [];
    for (const k of Object.keys(body.errors)) {
      const v = body.errors[k];
      const messages = Array.isArray(v) ? v.map(String) : [String(v)];
      // map server field name to client field key
      const mapped = FIELD_MAP[k] ?? k.charAt(0).toLowerCase() + k.slice(1);
      fields[mapped] = messages;
      summary.push(...messages);
    }
    return { fields, summary };
  }
  return null;
}
