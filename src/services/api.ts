import pLimit from 'p-limit';

// Controle de concorrência: máximo de 2 requisições simultâneas para não estourar rate limit
const limit = pLimit(2);

export interface PloomesReportParams {
  monthId: string;
  chartId: number;
  filterId: number;
  customFilters?: any[];
}

export const AdsService = {
  /**
   * Busca dados do Ploomes com controle de concorrência
   */
  async fetchPloomesReport(params: PloomesReportParams) {
    return limit(async () => {
      console.log(`[AdsService] Buscando Ploomes: ${params.monthId} (Chart: ${params.chartId})`);
      
      const response = await fetch('/api/ploomes/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ploomes API Error (${response.status}): ${errorText}`);
      }

      return response.json();
    });
  },

  /**
   * Busca dados da Shopee com controle de concorrência
   */
  async fetchShopeePerformance(monthId: string, accountKey: string) {
    return limit(async () => {
      console.log(`[AdsService] Buscando Shopee: ${monthId} (${accountKey})`);
      
      const response = await fetch('/api/shopee/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthId, accountKey }),
      });

      if (!response.ok) {
        throw new Error(`Shopee API Error (${response.status})`);
      }

      return response.json();
    });
  },

  async fetchShopeeBalance(accountKey: string) {
    const response = await fetch(`/api/shopee/balance?accountKey=${accountKey}`);
    if (!response.ok) throw new Error('Failed to fetch Shopee balance');
    return response.json();
  },

  // Nova função para buscar todos os dias de um mês de forma performática
  async fetchPloomesDailyForMonth(
    monthId: string, 
    task: { category: string, charts: any[], filterId: number },
    onProgress: (date: string, field: string, value: number) => void
  ) {
    const [year, month] = monthId.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => 
      `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    );

    // Função auxiliar para somar valores (mesma lógica do hook)
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

    // Executamos em paralelo respeitando o limite de 2 por vez (p-limit já configurado no service)
    await Promise.all(days.map(async (date) => {
      await Promise.all(task.charts.map(async (chart) => {
        try {
          const result = await this.fetchPloomesReport({
            monthId: date, // Passamos o dia específico como monthId
            chartId: chart.id,
            filterId: task.filterId
          });
          const value = sumAllValues(result);
          onProgress(date, chart.field, value);
        } catch (e) {
          console.error(`[Daily Sync] Erro no dia ${date}, campo ${chart.field}:`, e);
        }
      }));
    }));
  }
};
