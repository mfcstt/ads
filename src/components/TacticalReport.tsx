import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { MonthlyData, ChannelPerformanceData } from '@/src/types';
import { formatCurrency } from '@/src/lib/utils';
import { TrendingUp, AlertTriangle, Target, Zap, BarChart3, ArrowRight } from 'lucide-react';

interface TacticalReportProps {
  data: MonthlyData[];
  channelDetails: Record<string, ChannelPerformanceData[]>;
  currentMonthId: string;
}

export function TacticalReport({ data, channelDetails, currentMonthId }: TacticalReportProps) {
  const report = useMemo(() => {
    const currentMonthData = data.find(d => d.month === currentMonthId);
    if (!currentMonthData) return null;

    // 1. Análise de Elasticidade e Escala
    const channels = currentMonthData.entries.map(entry => {
      const details = channelDetails[entry.category] || [];
      const currentDetail = details.find(d => d.month === currentMonthId);
      
      const roas = currentDetail?.roas || 0;
      const investment = currentDetail?.investment || 0;
      const sales = currentDetail?.salesValue || 0;
      const conversion = currentDetail?.conversionRate || 0;

      // Calculate historical averages for volatility
      const historicalRoas = details.map(d => d.roas).filter(r => r > 0);
      const avgRoas = historicalRoas.length > 0 ? historicalRoas.reduce((a, b) => a + b, 0) / historicalRoas.length : 0;
      const volatility = historicalRoas.length > 1 
        ? Math.sqrt(historicalRoas.reduce((sq, n) => sq + Math.pow(n - avgRoas, 2), 0) / (historicalRoas.length - 1)) / avgRoas
        : 0;

      return {
        name: entry.category,
        roas,
        avgRoas,
        volatility,
        investment,
        sales,
        conversion,
        isSaturated: investment > 10000 && roas < avgRoas * 0.8, // High investment, dropping efficiency
        hasScaleMargin: investment > 0 && investment < 15000 && roas > avgRoas * 1.2 && roas > 10, // Low investment, high efficiency
      };
    }).filter(c => c.investment > 0);

    const saturated = channels.filter(c => c.isSaturated);
    const scalable = channels.filter(c => c.hasScaleMargin).sort((a, b) => b.roas - a.roas);
    
    // Best allocation target
    const topTarget = scalable.length > 0 ? scalable[0] : channels.sort((a, b) => b.roas - a.roas)[0];
    
    // 2. Diagnóstico de Previsibilidade
    const safeHarbors = channels.filter(c => c.volatility < 0.2 && c.roas > 5).sort((a, b) => a.volatility - b.volatility);
    const volatile = channels.filter(c => c.volatility > 0.5).sort((a, b) => b.volatility - a.volatility);

    // Forecasting (simple linear projection based on current ROAS)
    const totalCurrentSales = channels.reduce((acc, c) => acc + c.sales, 0);
    const totalCurrentInvestment = channels.reduce((acc, c) => acc + c.investment, 0);
    
    // 3. Visão Crítica de Alocação
    const totalBudget = currentMonthData.entries.reduce((acc, curr) => acc + curr.monthlyBudget, 0);
    const extraBudget = totalBudget * 0.20; // 20% extra
    const projectedExtraSales = topTarget ? extraBudget * topTarget.roas : 0;

    return {
      saturated,
      scalable,
      topTarget,
      safeHarbors,
      volatile,
      extraBudget,
      projectedExtraSales,
      totalCurrentSales,
      totalCurrentInvestment
    };
  }, [data, channelDetails, currentMonthId]);

  if (!report) return null;

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-6 h-6 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-900">Relatório de Direcionamento Tático (Controller BI)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Análise de Elasticidade e Escala */}
        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Elasticidade e Escala
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-emerald-500" /> Margem de Escala
              </h4>
              {report.scalable.length > 0 ? (
                <ul className="space-y-2">
                  {report.scalable.map(c => (
                    <li key={c.name} className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-medium text-slate-900">{c.name}</span>
                      <div className="text-xs text-slate-500 mt-1">
                        ROAS atual: <span className="font-semibold text-emerald-600">{c.roas.toFixed(1)}x</span> (Média: {c.avgRoas.toFixed(1)}x)
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic text-xs">Nenhum canal com margem clara de escala no momento.</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> Ponto de Saturação
              </h4>
              {report.saturated.length > 0 ? (
                <ul className="space-y-2">
                  {report.saturated.map(c => (
                    <li key={c.name} className="bg-red-50 p-2 rounded border border-red-100">
                      <span className="font-medium text-red-900">{c.name}</span>
                      <div className="text-xs text-red-700/80 mt-1">
                        ROAS caiu para {c.roas.toFixed(1)}x com alto investimento ({formatCurrency(c.investment)}).
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic text-xs">Nenhum canal saturado identificado.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Diagnóstico de Previsibilidade */}
        <Card className="border-t-4 border-t-emerald-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <Target className="w-4 h-4 text-emerald-500" />
              Previsibilidade (Forecasting)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-slate-700 mb-1">Portos Seguros (Baixa Volatilidade)</h4>
              {report.safeHarbors.length > 0 ? (
                <ul className="space-y-2">
                  {report.safeHarbors.slice(0, 3).map(c => (
                    <li key={c.name} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-medium text-slate-700">{c.name}</span>
                      <span className="text-xs font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        ROAS {c.roas.toFixed(1)}x
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic text-xs">Operação altamente instável.</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-slate-700 mb-1">Canais Voláteis (Atenção)</h4>
              {report.volatile.length > 0 ? (
                <ul className="space-y-2">
                  {report.volatile.slice(0, 3).map(c => (
                    <li key={c.name} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-medium text-slate-700">{c.name}</span>
                      <span className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Var: {(c.volatility * 100).toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic text-xs">Nenhum canal com alta volatilidade.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Visão Crítica de Alocação */}
        <Card className="border-t-4 border-t-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              Visão Crítica de Alocação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-900 mb-2">Cenário: +20% de Verba</h4>
              <p className="text-purple-800 text-xs mb-3">
                Se tivéssemos <strong>{formatCurrency(report.extraBudget)}</strong> adicionais hoje, a alocação matemática ideal seria em:
              </p>
              {report.topTarget ? (
                <div className="bg-white p-3 rounded border border-purple-200 shadow-sm">
                  <div className="font-bold text-lg text-purple-700 mb-1">{report.topTarget.name}</div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>• ROAS Atual: <strong>{report.topTarget.roas.toFixed(2)}x</strong></p>
                    <p>• Retorno Projetado: <strong>{formatCurrency(report.projectedExtraSales)}</strong></p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic text-xs">Dados insuficientes para recomendação.</p>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Justificativa:</strong> O canal apresenta a melhor relação entre consistência histórica e ROAS marginal atual, indicando que ainda não atingiu a curva de rendimentos decrescentes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
