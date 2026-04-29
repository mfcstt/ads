import type { IncomingMessage, ServerResponse } from 'http';
import { readBody } from '../utils/bodyReader';

export async function handlePloomesRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';

  if ((url.startsWith('/api/ploomes/report') || url.startsWith('/api/ploomes-report')) && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { monthId, chartId, filterId, customFilters } = body;
      const userKey = process.env.PLOOMES_USER_KEY;
      if (!userKey) {
        throw new Error('PLOOMES_USER_KEY não está configurada no .env');
      }

      // Lógica de filtros original restaurada
      let filters = customFilters;
      if (filters === undefined) {
        const now = new Date();
        const currentMonthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthId = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

        if (monthId === currentMonthId || monthId === '$thismonth') {
          filters = [{ Value: '$thismonth', OperatorId: 1, PanelFilterId: filterId || 482922 }];
        } else if (monthId === lastMonthId) {
          filters = [{ Value: '$lastmonth', OperatorId: 1, PanelFilterId: filterId || 482922 }];
        } else if (monthId && monthId.includes('-')) {
          const parts = monthId.split('-');
          if (parts.length === 3) {
            // Caso seja uma data específica (YYYY-MM-DD)
            const startStr = `${monthId}T00:00:00`;
            const endStr = `${monthId}T23:59:59`;
            filters = [
              { Value: startStr, OperatorId: 4, PanelFilterId: filterId || 482922 },
              { Value: endStr, OperatorId: 6, PanelFilterId: filterId || 482922 }
            ];
          } else if (parts.length === 2) {
            // Caso seja apenas o mês (YYYY-MM)
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            if (!isNaN(year) && !isNaN(month)) {
              const lastDay = new Date(year, month, 0).getDate();
              const startStr = `${monthId}-01T00:00:00`;
              const endStr = `${monthId}-${String(lastDay).padStart(2, '0')}T00:00:00`;
              filters = [
                { Value: startStr, OperatorId: 4, PanelFilterId: filterId || 482922 },
                { Value: endStr, OperatorId: 6, PanelFilterId: filterId || 482922 }
              ];
            }
          }
        }
      }

      const ploomesUrl = "https://api2-s13-app.ploomes.com/Reports";
      const ploomesBody = {
        ChartId: chartId,
        ActivePanelsFilters: filters,
        ForceRefresh: false,
        Timezone: "America/Sao_Paulo"
      };

      console.log(`[Ploomes Sync] Month: ${monthId}, Chart: ${chartId}`);

      const response = await fetch(ploomesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Key': userKey
        },
        body: JSON.stringify(ploomesBody)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[Ploomes Proxy] Error from Ploomes:', response.status, text);
        res.statusCode = response.status;
        res.end(text);
        return true;
      }

      const data = await response.json();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    } catch (error: any) {
      console.error('[Ploomes Proxy] Internal Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    }
    return true;
  }

  return false;
}
