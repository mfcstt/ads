import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { BudgetEntry, ChannelPerformanceData } from '../types';
import { formatCurrency } from '../lib/utils';
import { AlertCircle, CheckCircle2, TrendingUp, Info, Lightbulb, Target, BarChart3, ArrowRightLeft, Zap } from 'lucide-react';

interface DiagnosticReportProps {
  entries: BudgetEntry[];
  channelDetails: Record<string, ChannelPerformanceData[]>;
  currentMonth: string;
}

export function DiagnosticReport({ entries, channelDetails, currentMonth }: DiagnosticReportProps) {
  const totalBudget = entries.reduce((acc, curr) => acc + curr.monthlyBudget, 0);
  const totalConsumed = entries.reduce((acc, curr) => acc + curr.consumed, 0);
  const totalSales = entries.reduce((acc, curr) => acc + (curr.salesValue || 0), 0);
  const averageRoas = totalConsumed > 0 ? totalSales / totalConsumed : 0;

  const channelsWithRoas = entries.filter(e => e.consumed > 0).map(e => ({
    ...e,
    roas: (e.salesValue || 0) / e.consumed
  }));

  if (channelsWithRoas.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Relatório de Direcionamento Tático</h2>
        <Card>
          <CardContent className="p-6 text-center text-slate-500">
            Dados insuficientes para gerar o diagnóstico tático neste mês.
          </CardContent>
        </Card>
      </div>
    );
  }

  // 1. Elasticidade e Escala
  const bestRoasChannel = channelsWithRoas.reduce((prev, current) => (prev.roas > current.roas) ? prev : current);
  const worstRoasChannel = channelsWithRoas.reduce((prev, current) => (prev.roas < current.roas) ? prev : current);
  
  const budgetIncrease = totalBudget * 0.20;
  const estimatedReturnIncrease = budgetIncrease * bestRoasChannel.roas;

  // 2. Previsibilidade (Forecasting) e Volatilidade
  const volatilityData = channelsWithRoas.map(channel => {
    const history = channelDetails[channel.category] || [];
    const roasHistory = history.filter(h => h.investment > 0).map(h => h.salesValue / h.investment);
    
    let variance = 0;
    if (roasHistory.length > 1) {
      const mean = roasHistory.reduce((a, b) => a + b, 0) / roasHistory.length;
      variance = roasHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / roasHistory.length;
    }
    
    return {
      ...channel,
      variance,
      projectedSales: channel.monthlyBudget * channel.roas
    };
  });

  const mostVolatile = volatilityData.length > 1 ? volatilityData.reduce((prev, curr) => prev.variance > curr.variance ? prev : curr) : volatilityData[0];
  const mostStable = volatilityData.length > 1 ? volatilityData.reduce((prev, curr) => prev.variance < curr.variance ? prev : curr) : volatilityData[0];

  // 3. Visão Crítica de Alocação
  const budgetToMove = worstRoasChannel.monthlyBudget * 0.15;
  const gainedSales = (budgetToMove * bestRoasChannel.roas) - (budgetToMove * worstRoasChannel.roas);

  // 4. Output Executivo
  const executiveSummary = channelsWithRoas.map(c => {
    let status = 'Manter';
    let statusColor = 'text-slate-600 bg-slate-100';
    let action = 'Monitorar performance';
    let reason = 'Performance dentro da média';

    if (c.roas > averageRoas * 1.2) {
      status = 'Escalar';
      statusColor = 'text-emerald-700 bg-emerald-100';
      action = 'Aumentar verba em 15-20%';
      reason = 'Alta eficiência (ROAS acima da média)';
    } else if (c.roas < averageRoas * 0.8) {
      status = 'Otimizar/Cortar';
      statusColor = 'text-red-700 bg-red-100';
      action = 'Reduzir verba ou pausar campanhas ruins';
      reason = 'Baixa eficiência (ROAS abaixo da média)';
    }

    return { ...c, status, statusColor, action, reason };
  });

  // Insight de Ouro logic
  let goldenInsight = "A diversificação de canais está mantendo a operação saudável, mas há concentração de risco.";
  const bestConversionChannel = channelsWithRoas.map(c => {
    const details = channelDetails[c.category]?.find(d => d.month === currentMonth);
    const conversion = details && details.proposalsQty > 0 ? (details.salesQty / details.proposalsQty) * 100 : 0;
    return { name: c.category, conversion };
  }).sort((a, b) => b.conversion - a.conversion)[0];

  if (bestConversionChannel && bestConversionChannel.conversion > 0 && bestConversionChannel.name !== bestRoasChannel.category) {
    goldenInsight = `O canal "${bestConversionChannel.name}" não tem o maior ROAS, mas apresenta a maior taxa de conversão (${bestConversionChannel.conversion.toFixed(1)}%). Isso indica um público extremamente qualificado. Um pequeno aumento de verba focado em topo de funil para este canal pode gerar um salto desproporcional em vendas.`;
  } else if (worstRoasChannel.platform.toLowerCase().includes('meta') || worstRoasChannel.platform.toLowerCase().includes('facebook')) {
    goldenInsight = `Embora "${worstRoasChannel.category}" tenha o menor ROAS direto, canais sociais costumam atuar no topo do funil (descoberta). Cortar drasticamente essa verba pode encarecer o custo de aquisição (CPA) dos canais de fundo de funil (como Busca) nos próximos meses.`;
  }

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Target className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-900">Relatório de Direcionamento Tático (Controller BI)</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Análise de Elasticidade e Escala */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              1. Análise de Elasticidade e Escala
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <p className="text-sm text-slate-600">
                <strong className="text-slate-900">Ponto de Saturação:</strong> O canal <span className="font-semibold text-red-600">{worstRoasChannel.category}</span> apresenta o menor retorno marginal ({worstRoasChannel.roas.toFixed(2)}x). Aumentar verba aqui trará retornos decrescentes.
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">
                <strong className="text-slate-900">Margem de Escala:</strong> O canal <span className="font-semibold text-emerald-600">{bestRoasChannel.category}</span> é o motor de eficiência atual ({bestRoasChannel.roas.toFixed(2)}x).
              </p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-md border border-emerald-100">
              <p className="text-sm text-emerald-800">
                <strong>Simulação (+20% Verba):</strong> Se injetássemos {formatCurrency(budgetIncrease)} hoje, a alocação exata seria em <strong>{bestRoasChannel.category}</strong>. Justificativa matemática: com o ROAS atual, isso geraria um incremento estimado de <strong>{formatCurrency(estimatedReturnIncrease)}</strong> em faturamento.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Diagnóstico de Previsibilidade */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              2. Diagnóstico de Previsibilidade (Forecasting)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-semibold">Porto Seguro (Estável)</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{mostStable.category}</p>
                <p className="text-xs text-slate-600 mt-1">Baixa volatilidade histórica.</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-semibold">Maior Volatilidade</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{mostVolatile.category}</p>
                <p className="text-xs text-slate-600 mt-1">Requer monitoramento diário.</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600">
                <strong>Projeção de Fechamento:</strong> Mantendo a eficiência atual e consumindo 100% do orçamento previsto, o canal {bestRoasChannel.category} deve fechar em {formatCurrency(bestRoasChannel.monthlyBudget * bestRoasChannel.roas)}, enquanto {worstRoasChannel.category} fecharia em {formatCurrency(worstRoasChannel.monthlyBudget * worstRoasChannel.roas)}.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Visão Crítica de Alocação */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-purple-600" />
              3. Visão Crítica de Alocação (Custo de Oportunidade)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="flex-1">
                <p className="text-sm text-purple-900">
                  <strong>Movimento Tático:</strong> Mover 15% da verba ({formatCurrency(budgetToMove)}) de <strong>{worstRoasChannel.category}</strong> para <strong>{bestRoasChannel.category}</strong>.
                </p>
                <p className="text-sm text-purple-800 mt-2">
                  <strong>Impacto Financeiro:</strong> Essa realocação geraria um ganho líquido projetado de <strong>{formatCurrency(gainedSales)}</strong> em faturamento, sem aumentar o custo total da operação.
                </p>
              </div>
              <div className="hidden md:block text-purple-300">
                <ArrowRightLeft className="w-12 h-12" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Output Executivo */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-600" />
              4. Resumo de Comandos Executivos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Canal</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Motivo do Insight</th>
                    <th className="px-6 py-3">Ação Imediata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {executiveSummary.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">{item.category}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.reason}</td>
                      <td className="px-6 py-4 text-slate-900 font-medium">{item.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Insight de Ouro */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-full text-amber-600 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900 mb-2">Insight de Ouro</h3>
                <p className="text-amber-800 leading-relaxed">
                  {goldenInsight}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
