import type { IncomingMessage, ServerResponse } from 'http';
import { getAdsDailyPerformance, getAccountBalance } from '../shopeeService';
import { readBody } from '../utils/bodyReader';

export async function handleShopeeRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';

  if (url.startsWith('/api/shopee/performance') && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { monthId, accountKey = 'matriz' } = body;

      if (!monthId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'monthId é obrigatório' }));
        return true;
      }

      const [year, month] = monthId.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();

      // Force timezone to match Brazil (Shopee BR) so UTC servers don't cross midnight early
      const nowStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
      const now = new Date(nowStr);
      
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // If requested month is in the future, return early with zeroed data
      // to avoid Shopee 'date_in_future' error.
      if (year > currentYear || (year === currentYear && month > currentMonth)) {
        const emptyResult = { expense: 0, gmv: 0, impressions: 0, clicks: 0, orders: 0, ctr: 0, roas: 0, dailyData: [] };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(emptyResult));
        return true;
      }

      let effectiveLastDay = lastDay;
      if (year === currentYear && month === currentMonth) {
        // Para o mês atual, limitar até o dia de ontem (now.getDate() - 1) ou hoje (now.getDate())
        // Usar now.getDate() - 1 é mais seguro para evitar delay de timezone na Shopee.
        effectiveLastDay = Math.min(lastDay, Math.max(1, now.getDate()));
      }

      console.log(`[Shopee Route Debug] monthId: ${monthId}, lastDay: ${lastDay}, now.getDate(): ${now.getDate()}, effectiveLastDay: ${effectiveLastDay}`);

      let result: any;
      
      if (lastDay > 30) {
        const startDate1 = `01-${String(month).padStart(2, '0')}-${year}`;
        const end1 = Math.min(15, effectiveLastDay);
        const endDate1 = `${String(end1).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
        const res1 = await getAdsDailyPerformance(startDate1, endDate1, accountKey);
        
        let res2 = { expense: 0, gmv: 0, impressions: 0, clicks: 0, orders: 0, ctr: 0, roas: 0, dailyData: [] };
        if (effectiveLastDay > 15) {
          const startDate2 = `16-${String(month).padStart(2, '0')}-${year}`;
          const endDate2 = `${String(effectiveLastDay).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
          res2 = await getAdsDailyPerformance(startDate2, endDate2, accountKey);
        }

        result = {
          expense: res1.expense + res2.expense,
          gmv: res1.gmv + res2.gmv,
          impressions: res1.impressions + res2.impressions,
          clicks: res1.clicks + res2.clicks,
          orders: res1.orders + res2.orders,
          ctr: 0,
          roas: 0,
          dailyData: [...res1.dailyData, ...(res2.dailyData || [])]
        };
        result.ctr = result.impressions > 0 ? Number(((result.clicks / result.impressions) * 100).toFixed(2)) : 0;
        result.roas = result.expense > 0 ? Number((result.gmv / result.expense).toFixed(2)) : 0;
      } else {
        const startDate = `01-${String(month).padStart(2, '0')}-${year}`;
        const endDate = `${String(effectiveLastDay).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
        result = await getAdsDailyPerformance(startDate, endDate, accountKey);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (e: any) {
      console.error(`[Shopee Performance Error]:`, e);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
    }
    return true;
  }

  if (url.startsWith('/api/shopee/balance') && req.method === 'GET') {
    try {
      // Allow passing accountKey via query string
      const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
      const accountKey = urlObj.searchParams.get('accountKey') || 'matriz';

      const balance = await getAccountBalance(accountKey);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ total_balance: balance }));
    } catch (e: any) {
      console.error('[Shopee Balance Error]:', e);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
    }
    return true;
  }

  return false;
}
