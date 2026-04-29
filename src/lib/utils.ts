import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const monthToPtBr: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Maio', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
};

export const ptBrToMonth: Record<string, string> = {
  'Jan': '01', 'Fev': '02', 'Mar': '03', 'Abr': '04', 'Maio': '05', 'Jun': '06',
  'Jul': '07', 'Ago': '08', 'Set': '09', 'Out': '10', 'Nov': '11', 'Dez': '12'
};

export function parseMonthString(monthStr: string): string | null {
  const [m, y] = monthStr.split('/');
  const monthNum = ptBrToMonth[m];
  if (!monthNum) return null;
  return `20${y}-${monthNum}`;
}

export function formatToDetailMonth(monthStr: string): string | null {
  const [year, month] = monthStr.split('-');
  if (!year || !month) return null;
  const shortYear = year.slice(2);
  const ptBrMonth = monthToPtBr[month];
  if (!ptBrMonth) return null;
  return `${ptBrMonth}/${shortYear}`;
}
