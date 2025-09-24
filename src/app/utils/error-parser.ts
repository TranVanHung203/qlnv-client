export function parseApiError(err: any): string {
  if (!err) return 'Có lỗi xảy ra';
  // If HttpErrorResponse from Angular: err.error contains server body
  const body = err.error ?? err;
  // If validation structure
  if (body && typeof body === 'object') {
    if (body.errors && typeof body.errors === 'object') {
      // collect first messages
      const parts: string[] = [];
      for (const key of Object.keys(body.errors)) {
        const v = body.errors[key];
        if (Array.isArray(v) && v.length) parts.push(`${key}: ${v.join('; ')}`);
      }
      if (parts.length) return parts.join(' | ');
    }
    if (body.title) return body.title;
    if (body.message) return body.message;
  }
  // If body is a string (raw server message), try to map common .NET messages to friendly text
  if (typeof body === 'string') {
    const s = body as string;
    // common required field message
    if (s.includes('The dto field is required') || /required/i.test(s)) {
      return 'Thiếu dữ liệu bắt buộc. Vui lòng kiểm tra các trường bắt buộc.';
    }
    if (s.includes('could not be converted to System.DateTime') || s.includes('ngayVaoLam')) {
      return 'Trường "Ngày vào làm" không hợp lệ. Vui lòng nhập ngày theo định dạng hợp lệ.';
    }
    // strip long diagnostic info (Path/LineNumber) for cleaner display
    const idx = s.indexOf('Path:');
    if (idx > 0) return s.substring(0, idx).trim();
    return s;
  }
  // fallback to status/text
  if (err.status && err.statusText) return `${err.status} ${err.statusText}`;
  return 'Yêu cầu thất bại';
}
