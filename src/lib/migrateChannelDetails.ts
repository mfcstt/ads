import type { ChannelPerformanceData } from '../types';
import { VTEX_GERAL_DATA, generateEmptyChannelData } from '../types';

export function migrateChannelDetails(
  parsedDetails: Record<string, ChannelPerformanceData[]>
): Record<string, ChannelPerformanceData[]> {
  if (parsedDetails['VTEX'] || parsedDetails['VTEX Leads'] || parsedDetails['VTEX E-commerce']) {
    const vtexGeralData: ChannelPerformanceData[] = [];

    const months = new Set([
      ...(parsedDetails['VTEX']?.map(d => d.month) || []),
      ...(parsedDetails['VTEX Leads']?.map(d => d.month) || []),
      ...(parsedDetails['VTEX E-commerce']?.map(d => d.month) || []),
    ]);

    months.forEach(month => {
      const oldVtex = parsedDetails['VTEX']?.find(d => d.month === month);
      const vtexLeads = parsedDetails['VTEX Leads']?.find(d => d.month === month) || VTEX_GERAL_DATA.find(d => d.month === month);
      const vtexEcom = parsedDetails['VTEX E-commerce']?.find(d => d.month === month);

      if (oldVtex && !vtexLeads && !vtexEcom) {
        vtexGeralData.push({ ...oldVtex, category: 'VTEX Geral' } as ChannelPerformanceData & { category?: string });
      } else {
        const base = vtexEcom || oldVtex || generateEmptyChannelData().find(d => d.month === month)!;
        const leads = vtexLeads || generateEmptyChannelData().find(d => d.month === month)!;

        vtexGeralData.push({
          ...base,
          proposalsQty: leads.proposalsQty || 0,
          salesQty: leads.salesQty || 0,
          proposalsValue: leads.proposalsValue || 0,
          salesValueInstitutional: leads.salesValueInstitutional || leads.salesValue || 0,
          ecommerceOrdersQty: base.ecommerceOrdersQty || base.salesQty || 0,
          salesValueEcommerce: base.salesValueEcommerce || base.salesValue || 0,
          salesValue: (leads.salesValueInstitutional || leads.salesValue || 0) + (base.salesValueEcommerce || base.salesValue || 0),
          investment: (base.investment || 0) + (leads.investment || 0),
        });
      }
    });

    parsedDetails['VTEX Geral'] = vtexGeralData;
    delete parsedDetails['VTEX'];
    delete parsedDetails['VTEX Leads'];
    delete parsedDetails['VTEX E-commerce'];
  }

  if (parsedDetails['Shopee Ads (Matriz)']) {
    parsedDetails['Matriz (SP)'] = parsedDetails['Shopee Ads (Matriz)'];
    delete parsedDetails['Shopee Ads (Matriz)'];
  }
  if (parsedDetails['Shopee Ads (RJ)']) {
    parsedDetails['Rio de Janeiro'] = parsedDetails['Shopee Ads (RJ)'];
    delete parsedDetails['Shopee Ads (RJ)'];
  }
  if (parsedDetails['Shopee Ads (Bahia)']) {
    parsedDetails['Bahia'] = parsedDetails['Shopee Ads (Bahia)'];
    delete parsedDetails['Shopee Ads (Bahia)'];
  }

  return parsedDetails;
}
