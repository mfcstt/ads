import { useQuery } from '@tanstack/react-query';
import { AdsService } from '../services/api';

/**
 * Hook para buscar dados específicos de um mês/gráfico do Ploomes
 * O TanStack Query cuida do cache e da deduplicação automaticamente.
 */
export function usePloomesReport(monthId: string, chartId: number, filterId: number, enabled = true) {
  return useQuery({
    queryKey: ['ploomes-report', monthId, chartId, filterId],
    queryFn: () => AdsService.fetchPloomesReport({ monthId, chartId, filterId }),
    enabled: enabled && !!monthId && !!chartId,
    staleTime: 10 * 60 * 1000, // Dados considerados "frescos" por 10 minutos
  });
}

/**
 * Hook para buscar performance da Shopee
 */
export function useShopeePerformance(monthId: string, accountKey: string, enabled = true) {
  return useQuery({
    queryKey: ['shopee-performance', monthId, accountKey],
    queryFn: () => AdsService.fetchShopeePerformance(monthId, accountKey),
    enabled: enabled && !!monthId && !!accountKey,
    staleTime: 10 * 60 * 1000,
  });
}
