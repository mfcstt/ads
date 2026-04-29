import type { MonthlyData } from '../types';

export function getCurrentMonthIdForData(data: MonthlyData[]): string {
  if (data.length === 0) return '';
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let candidate: string;
  if (year === 2026) {
    if (month === 0) candidate = 'jan-2026';
    else if (month === 1) candidate = 'feb-2026';
    else candidate = `${year}-${(month + 1).toString().padStart(2, '0')}`;
  } else {
    candidate = data[0].id;
  }
  if (data.some(d => d.id === candidate)) return candidate;
  return data[0].id;
}
