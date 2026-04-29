import type { BudgetEntry, MonthlyData } from '../types';

export function migrateBudgetData(parsedData: MonthlyData[]): MonthlyData[] {
  const migrated = parsedData.map(month => {
    const newEntries: BudgetEntry[] = [];
    let vtexGeralEntry: BudgetEntry | null = null;
    let hasShopeeMatriz = false;
    let hasShopeeRJ = false;
    let hasShopeeBahia = false;

    month.entries.forEach(entry => {
      if (entry.category === 'VTEX' || entry.category === 'VTEX Leads' || entry.category === 'VTEX E-commerce') {
        if (!vtexGeralEntry) {
          vtexGeralEntry = {
            ...entry,
            id: entry.id.replace(/[ab]$/, ''),
            category: 'VTEX Geral',
            type: 'E-commerce',
          };
        } else {
          vtexGeralEntry.monthlyBudget += entry.monthlyBudget || 0;
          vtexGeralEntry.investment += entry.investment || 0;
          vtexGeralEntry.consumed += entry.consumed || 0;
          vtexGeralEntry.salesValue = (vtexGeralEntry.salesValue || 0) + (entry.salesValue || 0);
        }
      } else {
        if (entry.category === 'Shopee Ads (Matriz)' || entry.category === 'Matriz (SP)') {
          entry.category = 'Matriz (SP)';
          entry.platform = 'Shopee';
          hasShopeeMatriz = true;
        }
        if (entry.category === 'Shopee Ads (RJ)' || entry.category === 'Rio de Janeiro') {
          entry.category = 'Rio de Janeiro';
          entry.platform = 'Shopee';
          hasShopeeRJ = true;
        }
        if (entry.category === 'Shopee Ads (Bahia)' || entry.category === 'Bahia') {
          entry.category = 'Bahia';
          entry.platform = 'Shopee';
          hasShopeeBahia = true;
        }
        if ((entry.platform as string) === 'Outros') {
          entry.platform = 'Shopee';
        }
        newEntries.push(entry);
      }
    });

    if (vtexGeralEntry) {
      newEntries.push(vtexGeralEntry);
    }

    if (!hasShopeeMatriz) {
      newEntries.push({
        id: 'shopee-matriz-' + month.id,
        category: 'Matriz (SP)',
        platform: 'Shopee',
        manager: 'Interno',
        type: 'E-commerce',
        monthlyBudget: 0,
        investment: 0,
        consumed: 0,
      });
    }
    if (!hasShopeeRJ) {
      newEntries.push({
        id: 'shopee-rj-' + month.id,
        category: 'Rio de Janeiro',
        platform: 'Shopee',
        manager: 'Interno',
        type: 'E-commerce',
        monthlyBudget: 0,
        investment: 0,
        consumed: 0,
      });
    }
    if (!hasShopeeBahia) {
      newEntries.push({
        id: 'shopee-bahia-' + month.id,
        category: 'Bahia',
        platform: 'Shopee',
        manager: 'Interno',
        type: 'E-commerce',
        monthlyBudget: 0,
        investment: 0,
        consumed: 0,
      });
    }

    return { ...month, entries: newEntries };
  });

  return migrated;
}
