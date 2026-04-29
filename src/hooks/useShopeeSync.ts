import React, { useEffect, useRef } from 'react';
import type { MonthlyData, ChannelPerformanceData } from '../types';
import { parseMonthString } from '../lib/utils';

export function useShopeeSync(
  loadStatus: string,
  data: MonthlyData[],
  setData: React.Dispatch<React.SetStateAction<MonthlyData[]>>,
  setChannelDetails: React.Dispatch<React.SetStateAction<Record<string, ChannelPerformanceData[]>>>,
  shopeeBalance: number | null,
  setShopeeBalance: React.Dispatch<React.SetStateAction<number | null>>,
  shopeeSpent: number | null,
  setShopeeSpent: React.Dispatch<React.SetStateAction<number | null>>,
  formatToDetailMonth: (monthStr: string) => string | null
) {
  const shopeeDataFetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (loadStatus !== 'ready' || !data.length) return;

    const fetchShopeeData = async () => {
      try {
        // Busca o saldo sempre que o sincronizador rodar (mais robusto)
        try {
          console.log('[Shopee Sync] Buscando saldo atual...');
          const balRes = await fetch('/api/shopee/balance?accountKey=matriz');
          if (balRes.ok) {
            const balData = await balRes.json();
            console.log('[Shopee Sync] Saldo recebido:', balData.total_balance);
            setShopeeBalance(balData.total_balance ?? 0);
          } else {
            console.error('[Shopee Sync] Erro na resposta do saldo:', balRes.status);
          }
        } catch (e) {
          console.error('[Shopee Sync] Erro ao buscar saldo:', e);
        }

        const now = new Date();
        const currentMonthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        // Sincronizamos apenas meses passados e o atual
        const monthsToProcess = data.filter(m => m.month <= currentMonthId);

        const shopeeAccounts = [
          { category: 'Matriz (SP)', accountKey: 'matriz' }
        ];

        for (const monthData of monthsToProcess) {
          const fetchedKey = `${monthData.month}-synced`;
          if (shopeeDataFetched.current.has(fetchedKey)) continue;

          let anyAccountSynced = false;

          for (const account of shopeeAccounts) {
            const hasAccountEntry = monthData.entries.some(
              e => e.platform === 'Shopee' && e.category === account.category
            );
            
            if (!hasAccountEntry) continue;

            try {
              const perfRes = await fetch('/api/shopee/performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  monthId: monthData.month,
                  accountKey: account.accountKey
                }),
              });

              if (!perfRes.ok) continue;

              const perf = await perfRes.json();

              if (perf.expense !== undefined) {
                anyAccountSynced = true;
                
                // Se for o mês atual, atualiza o estado global de gasto para o card
                if (monthData.month === currentMonthId) {
                  setShopeeSpent(prev => (prev || 0) + perf.expense);
                }

                setData(prev => prev.map(m => {
                  if (m.month !== monthData.month) return m;
                  return {
                    ...m,
                    entries: m.entries.map(entry => {
                      if (entry.platform === 'Shopee' && entry.category === account.category) {
                        return { ...entry, consumed: perf.expense, salesValue: perf.gmv };
                      }
                      return entry;
                    }),
                  };
                }));

                const ptBrMonth = formatToDetailMonth(monthData.month);
                if (ptBrMonth) {
                  setChannelDetails(prev => {
                    const key = Object.keys(prev).find(k => k.toUpperCase() === account.category.toUpperCase()) || account.category;
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

                    const row = { 
                      ...updated[idx], 
                      investment: perf.expense, 
                      salesValue: perf.gmv,
                      impressions: perf.impressions,
                      clicks: perf.clicks,
                      ctr: perf.ctr
                    };
                    row.roas = row.investment > 0 ? Number((row.salesValue / row.investment).toFixed(2)) : 0;

                    if (perf.dailyData && Array.isArray(perf.dailyData)) {
                      row.dailyData = perf.dailyData.map((d: any) => ({
                        date: d.date,
                        impressions: d.impressions,
                        clicks: d.clicks,
                        ctr: d.ctr,
                        investment: d.expense,
                        salesValue: d.gmv,
                        roas: d.roas,
                        proposalsQty: 0,
                        salesQty: 0,
                        proposalsValue: 0,
                        conversionRate: 0
                      }));
                    }

                    updated[idx] = row;
                    return { ...prev, [key]: updated };
                  });
                }
              }
            } catch (e) {
              console.error(`[Shopee Sync] Erro ${monthData.month} (${account.category}):`, e);
            }
          }

          if (anyAccountSynced) {
            shopeeDataFetched.current.add(fetchedKey);
          }
        }
      } catch (err) {
        console.error('[Shopee Sync] Erro geral:', err);
      }
    };

    fetchShopeeData();
  }, [loadStatus, data.length]); 
}
