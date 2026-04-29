import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Calendar, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface KPICardsProps {
  title?: string;
  totalBudget: number;
  totalConsumed: number;
  totalSalesValue: number;
  remainingBudget: number;
  percentConsumed: number;
  averageRoas: string;
  ytdTotalBudget: number;
  ytdTotalConsumed: number;
  ytdTotalSalesValue: number;
  ytdRemainingBudget: number;
  ytdAverageRoas: string;
  balanceLabel?: string;
  balanceSubLabel?: string;
}

export function KPICards({
  title,
  totalBudget,
  totalConsumed,
  totalSalesValue,
  remainingBudget,
  percentConsumed,
  averageRoas,
  ytdTotalBudget,
  ytdTotalConsumed,
  ytdTotalSalesValue,
  ytdRemainingBudget,
  ytdAverageRoas,
  balanceLabel,
  balanceSubLabel
}: KPICardsProps) {
  return (
    <div className="space-y-4">
      {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Card className="h-full flex flex-col border-l-4 border-l-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Orçamento Total
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900">{formatCurrency(totalBudget)}</div>
                <p className="text-sm text-slate-500 mt-1">Previsto para o mês</p>
              </div>
              <div className="mt-auto bg-indigo-50/50 rounded-lg p-3 flex items-center justify-between border border-indigo-100/50">
                <span className="text-xs font-semibold text-indigo-600/80 uppercase tracking-wider">Acumulado YTD</span>
                <span className="text-sm font-bold text-indigo-700">{formatCurrency(ytdTotalBudget)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full flex flex-col border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Faturamento Total
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold tracking-tight text-emerald-600">{formatCurrency(totalSalesValue)}</div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-slate-500">Realizado no mês</p>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100/80 px-2 py-0.5 rounded-full">ROAS {averageRoas}x</span>
                </div>
              </div>
              <div className="mt-auto bg-emerald-50/50 rounded-lg p-3 flex items-center justify-between border border-emerald-100/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wider">YTD</span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded-full">ROAS {ytdAverageRoas}x</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">{formatCurrency(ytdTotalSalesValue)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className={`h-full flex flex-col border-l-4 ${remainingBudget < 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Consumido
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900">{formatCurrency(totalConsumed)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${percentConsumed > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(percentConsumed, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{percentConsumed.toFixed(1)}%</span>
                </div>
              </div>
              <div className="mt-auto bg-slate-50 rounded-lg p-3 flex items-center justify-between border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Acumulado YTD</span>
                <span className="text-sm font-bold text-slate-700">{formatCurrency(ytdTotalConsumed)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full flex flex-col border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {balanceLabel || 'Saldo Restante'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <div className={`text-3xl font-bold tracking-tight ${remainingBudget < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {formatCurrency(remainingBudget)}
                </div>
                <p className="text-sm text-slate-500 mt-1">{balanceSubLabel || 'Disponível no mês'}</p>
              </div>
              <div className={`mt-auto rounded-lg p-3 flex items-center justify-between border ${ytdRemainingBudget < 0 ? 'bg-red-50/50 border-red-100/50' : 'bg-amber-50/50 border-amber-100/50'}`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${ytdRemainingBudget < 0 ? 'text-red-600/80' : 'text-amber-600/80'}`}>Saldo YTD</span>
                <span className={`text-sm font-bold ${ytdRemainingBudget < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                  {formatCurrency(ytdRemainingBudget)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
