import React, { useEffect, useRef } from 'react';
import type { MonthlyData, ChannelPerformanceData } from '../types';
import { AdsService } from '../services/api';
import { PLOOMES_TASKS } from '../config/ploomesTasks';
import { parseMonthString } from '../lib/utils';

export function usePloomesSync(
  loadStatus: string,
  data: MonthlyData[],
  setData: React.Dispatch<React.SetStateAction<MonthlyData[]>>,
  setChannelDetails: React.Dispatch<React.SetStateAction<Record<string, ChannelPerformanceData[]>>>,
  formatToDetailMonth: (monthStr: string) => string | null
) {
  const isSyncing = useRef(false);
  const syncedMonths = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (loadStatus !== 'ready' || !data.length || isSyncing.current) {
      return;
    }

    const runSync = async () => {
      isSyncing.current = true;
      
      try {
        const sumAllValues = (obj: any): number => {
          if (!obj) return 0;
          if (Array.isArray(obj)) return obj.reduce((acc: number, item: any) => acc + sumAllValues(item), 0);
          if (typeof obj !== 'object') return 0;
          if (Array.isArray(obj.Results) && obj.Results.length > 0) return obj.Results.reduce((acc: number, item: any) => acc + sumAllValues(item), 0);
          if (obj.AggregationValue !== undefined && obj.AggregationValue !== null) {
            return Number(obj.AggregationValue) || 0;
          }
          return Object.keys(obj).reduce((acc, key) => key !== 'Errors' ? acc + sumAllValues(obj[key]) : acc, 0);
        };

        const now = new Date();
        const currentMonthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const monthsToProcess = data.filter(m => m.month <= currentMonthId);

        for (const monthData of monthsToProcess) {
          const syncKey = `${monthData.month}`;
          if (monthData.month < currentMonthId && syncedMonths.current.has(syncKey)) continue;

          console.log(`[Ploomes Sync] Processando ${monthData.month}...`);

          for (const task of PLOOMES_TASKS) {
            for (const chart of task.charts) {
              try {
                const result = await AdsService.fetchPloomesReport({
                  monthId: monthData.month,
                  chartId: chart.id,
                  filterId: task.filterId
                });

                const value = sumAllValues(result);
                
                if (chart.field === 'salesValue') {
                  setData(prev => prev.map(m => {
                    if (m.month !== monthData.month) return m;
                    const entries = [...m.entries];
                    const idx = entries.findIndex(e => e.category.toUpperCase().includes(task.category.toUpperCase()));
                    if (idx === -1) return m;
                    entries[idx] = { ...entries[idx], salesValue: value };
                    return { ...m, entries };
                  }));
                }

                const ptBrMonth = formatToDetailMonth(monthData.month);
                if (ptBrMonth) {
                  setChannelDetails(prev => {
                    const key = Object.keys(prev).find(k => k.toUpperCase() === task.category.toUpperCase()) || task.category;
                    const channel = prev[key] || [];
                    let idx = channel.findIndex(d => d.month === ptBrMonth);
                    
                    const updated = [...channel];
                    
                    if (idx === -1) {
                      const newRow: ChannelPerformanceData = {
                        month: ptBrMonth,
                        proposalsQty: 0,
                        salesQty: 0,
                        proposalsValue: 0,
                        salesValue: 0,
                        investment: 0,
                        conversionRate: 0,
                        roas: 0
                      };
                      updated.push(newRow);
                      updated.sort((a, b) => {
                         const ma = parseMonthString(a.month) || '';
                         const mb = parseMonthString(b.month) || '';
                         return mb.localeCompare(ma);
                      });
                      idx = updated.findIndex(d => d.month === ptBrMonth);
                    }
                    
                    updated[idx] = { ...updated[idx], [chart.field]: value };
                    
                    const row = updated[idx];
                    if (chart.field === 'salesValue' || chart.field === 'investment') {
                      row.roas = row.investment > 0 ? Number((row.salesValue / row.investment).toFixed(2)) : 0;
                    }
                    if (chart.field === 'salesQty' || chart.field === 'proposalsQty') {
                      row.conversionRate = row.proposalsQty > 0 ? Number(((row.salesQty / row.proposalsQty) * 100).toFixed(1)) : 0;
                    }

                    return { ...prev, [key]: updated };
                  });
                }
              } catch (e) {
                console.error(`[Ploomes Sync] Erro em ${task.category} ${chart.field}:`, e);
              }
            }
          }
          syncedMonths.current.add(syncKey);
        }
      } finally {
        isSyncing.current = false;
      }
    };

    runSync();
    const interval = setInterval(runSync, 600000); // 10 min
    return () => clearInterval(interval);
  }, [loadStatus, data.length]);
}
