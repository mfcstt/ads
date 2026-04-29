import type { ChannelPerformanceData, MonthlyData } from '../types';
import bundled from '../../dados.json';

type BundledFile = {
  budget_data: string;
  channel_details: string;
};

const raw = bundled as BundledFile;

export function getBundledBudgetData(): MonthlyData[] | null {
  try {
    return JSON.parse(raw.budget_data) as MonthlyData[];
  } catch {
    return null;
  }
}

export function getBundledChannelDetails(): Record<string, ChannelPerformanceData[]> | null {
  try {
    return JSON.parse(raw.channel_details) as Record<string, ChannelPerformanceData[]>;
  } catch {
    return null;
  }
}
