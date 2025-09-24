import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'vnDate', standalone: true })
export class VnDatePipe implements PipeTransform {
  transform(value: string | Date | number | null | undefined, format: string = 'yyyy-MM-dd HH:mm'): string {
    if (!value) return '';
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value as Date;
    if (isNaN(d.getTime())) return String(value);

    // Use Intl to format in Vietnam timezone
    try {
      const opts: Intl.DateTimeFormatOptions = {};
      // Very simple mapping for requested format tokens
      if (format.includes('yyyy')) opts.year = 'numeric';
      if (format.includes('MM')) opts.month = '2-digit';
      if (format.includes('dd')) opts.day = '2-digit';
      if (format.includes('HH') || format.includes('hh')) opts.hour = '2-digit';
      if (format.includes('mm')) opts.minute = '2-digit';
      if (format.includes('ss')) opts.second = '2-digit';
      opts.hour12 = false;
      opts.timeZone = 'Asia/Ho_Chi_Minh';

      return new Intl.DateTimeFormat('vi-VN', opts).format(d);
    } catch (e) {
      return new Date(value).toLocaleString();
    }
  }
}
