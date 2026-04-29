import React, { useState, useEffect } from "react";
import { formatCurrency, parseMonthString } from "@/src/lib/utils";
import { MonthlyData, MATRIZ_DATA, META_DATA, ChannelPerformanceData, DailyPerformanceData } from "@/src/types";
import { ArrowLeft, TrendingUp, DollarSign, Target, Activity, Plus, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar
} from "recharts";

function DetailNumberInput({ value, onChange, className, step }: { value: number, onChange: (val: number) => void, className?: string, step?: string }) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toString());
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value === 0 ? '' : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    setLocalValue(value.toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (val === '') {
      onChange(0);
    } else {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  return (
    <input
      type="number"
      step={step}
      value={isFocused ? localValue : value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
    />
  );
}

function DetailCurrencyInput({ value, onChange, className }: { value: number, onChange: (val: number) => void, className?: string }) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(formatCurrency(value));

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(formatCurrency(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value.toFixed(2).replace('.', ','));
  };

  const handleBlur = () => {
    setIsFocused(false);
    setLocalValue(formatCurrency(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);

    const rawValue = inputValue.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const parsedValue = parseFloat(rawValue);

    if (!isNaN(parsedValue)) {
      onChange(parsedValue);
    } else if (inputValue === '') {
      onChange(0);
    }
  };

  return (
    <input
      type="text"
      className={className}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}

const getDaysInMonth = (monthStr: string) => {
  const monthMap: Record<string, number> = {
    'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Maio': 4, 'Jun': 5,
    'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
  };
  const [ptBrMonth, shortYear] = monthStr.split('/');
  if (!ptBrMonth || !shortYear) return [];
  const year = 2000 + parseInt(shortYear);
  const monthIndex = monthMap[ptBrMonth];
  if (monthIndex === undefined) return [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
};

interface ChannelDetailsProps {
  onBack: () => void;
  channelName: string;
  channelData: ChannelPerformanceData[];
  onUpdateDetail: (channelName: string, month: string, field: keyof ChannelPerformanceData, value: number) => void;
  onUpdateDailyDetail?: (channelName: string, month: string, date: string, field: keyof DailyPerformanceData, value: number) => void;
  onAddMonth?: (channelName: string, monthStr: string) => void;
  onFetchDailyData?: (channelName: string, monthStr: string) => Promise<void>;
}

export function ChannelDetails({ onBack, channelName, channelData, onUpdateDetail, onUpdateDailyDetail, onAddMonth, onFetchDailyData }: ChannelDetailsProps) {
  const [newMonth, setNewMonth] = useState("");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [loadingDaily, setLoadingDaily] = useState<Set<string>>(new Set());

  const toggleMonth = async (month: string) => {
    const isExpanding = !expandedMonths.has(month);
    
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });

    // Se estiver expandindo e não tiver dados diários, busca agora
    if (isExpanding && onFetchDailyData) {
      const row = channelData.find(d => d.month === month);
      const hasDailyData = row?.dailyData && row.dailyData.length > 0;
      const isShopeeApi = channelName === 'Matriz (SP)'; // Shopee já traz no sync inicial por enquanto
      
      if (!hasDailyData && !isShopeeApi) {
        setLoadingDaily(prev => new Set(prev).add(month));
        try {
          await onFetchDailyData(channelName, month);
        } finally {
          setLoadingDaily(prev => {
            const next = new Set(prev);
            next.delete(month);
            return next;
          });
        }
      }
    }
  };

  // Reverse data for chronological charting
  const chartData = [...channelData].reverse();

  const handleAddMonth = () => {
    if (newMonth && onAddMonth) {
      // Format input like "2026-04" to "Abr/26"
      const [year, month] = newMonth.split('-');
      if (year && month) {
        const monthToPtBr: Record<string, string> = {
          '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Maio', '06': 'Jun',
          '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
        };
        const shortYear = year.slice(2);
        const ptBrMonth = monthToPtBr[month];
        if (ptBrMonth) {
          const formattedMonth = `${ptBrMonth}/${shortYear}`;
          onAddMonth(channelName, formattedMonth);
          setNewMonth("");
        }
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg text-sm">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium text-slate-900">
                {entry.name.includes('Valor') || entry.name.includes('Investimento') 
                  ? formatCurrency(entry.value)
                  : entry.name === 'ROAS'
                    ? `${entry.value}x`
                    : entry.name === 'Conversão'
                      ? `${entry.value}%`
                      : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const isVtex = channelName.toLowerCase().includes('vtex') || channelName.toLowerCase().includes('v-tex');
  const isShopee = channelName === 'Matriz (SP)' || channelName === 'Rio de Janeiro' || channelName === 'Bahia';
  const isShopeeApi = channelName === 'Matriz (SP)';

  const currentYear = channelData.length > 0 ? channelData[0].month.split('/')[1] : '';
  const ytdData = channelData.filter(d => d.month.endsWith(`/${currentYear}`));
  
  const ytdConsumed = ytdData.reduce((acc, curr) => acc + curr.investment, 0);
  const ytdSales = ytdData.reduce((acc, curr) => acc + curr.salesValue, 0);
  const ytdRoas = ytdConsumed > 0 ? (ytdSales / ytdConsumed).toFixed(2) : '0.00';
  const ytdProposals = ytdData.reduce((acc, curr) => acc + curr.proposalsQty, 0);
  const ytdSalesQty = ytdData.reduce((acc, curr) => acc + curr.salesQty, 0);
  const ytdConversion = ytdProposals > 0 ? ((ytdSalesQty / ytdProposals) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600 self-start mt-1"
            title="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <img 
              src="https://www.larplasticos.com.br/wp-content/themes/larplasticos/img/logo.png" 
              alt="Lar Plásticos" 
              className="h-8 w-auto mb-3" 
              referrerPolicy="no-referrer" 
            />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Detalhamento: {channelName}
            </h1>
            <p className="text-slate-500 mt-1">Análise de performance histórica e conversão.</p>
          </div>
        </header>

        {/* YTD Summary */}
        {currentYear && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-slate-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">YTD Consumido (20{currentYear})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-slate-700">{formatCurrency(ytdConsumed)}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">YTD Faturamento (20{currentYear})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-emerald-600">{formatCurrency(ytdSales)}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">YTD ROAS (20{currentYear})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-amber-500">{ytdRoas}x</div>
              </CardContent>
            </Card>
            {!isVtex && !isShopee && (
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">YTD Conversão (20{currentYear})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-indigo-600">{ytdConversion}%</div>
                  <p className="text-xs text-slate-500 mt-1">{ytdSalesQty} vendas / {ytdProposals} props</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Performance Geral (Vendas, Investimento, ROAS e Conversão)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `R$ ${val/1000}k`} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {isVtex ? (
                      <>
                        <Bar yAxisId="left" dataKey="salesValueInstitutional" name="Vendas Leads" stackId="a" fill="#6366f1" maxBarSize={40} />
                        <Bar yAxisId="left" dataKey="salesValueEcommerce" name="Vendas E-commerce" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </>
                    ) : (
                      <Bar yAxisId="left" dataKey="salesValue" name="Valor Vendas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    )}
                    <Line yAxisId="left" type="monotone" dataKey="investment" name="Investimento Ads" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
                    <Line yAxisId="right" type="monotone" dataKey="roas" name="ROAS" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
                    {!isVtex && !isShopee && <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="Conversão" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                {isVtex ? (
                  <>
                    <tr>
                      <th rowSpan={2} className="px-4 py-4 align-middle border-r border-slate-200">Mês/Ano</th>
                      <th colSpan={4} className="px-4 py-2 text-center border-b border-r border-slate-200 bg-indigo-50/50">VTEX Leads</th>
                      <th colSpan={2} className="px-4 py-2 text-center border-b border-r border-slate-200 bg-emerald-50/50">VTEX E-commerce (Click)</th>
                      <th colSpan={3} className="px-4 py-2 text-center border-b border-slate-200 bg-slate-100/50">Consolidado</th>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-right border-r border-slate-200 bg-indigo-50/30">Propostas (QT)</th>
                      <th className="px-4 py-2 text-right border-r border-slate-200 bg-indigo-50/30">Vendas (QT)</th>
                      <th className="px-4 py-2 text-right border-r border-slate-200 bg-indigo-50/30">Valor Propostas (R$)</th>
                      <th className="px-4 py-2 text-right border-r border-slate-200 bg-indigo-50/30">Vendas (R$)</th>
                      
                      <th className="px-4 py-2 text-right border-r border-slate-200 bg-emerald-50/30">Pedidos (QT)</th>
                      <th className="px-4 py-2 text-right border-r border-slate-200 bg-emerald-50/30">Vendas (R$)</th>
                      
                      <th className="px-4 py-2 text-right border-r border-slate-200 bg-slate-100/30">Total Vendas (R$)</th>
                      <th className="px-4 py-2 text-right border-r border-slate-200 bg-slate-100/30">Investimento Ads (R$)</th>
                      <th className="px-4 py-2 text-right bg-slate-100/30">ROAS</th>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <th className="px-4 py-4">Mês/Ano</th>
                    {isShopee ? (
                      <>
                        <th className="px-4 py-4 text-right">Impressões</th>
                        <th className="px-4 py-4 text-right">Cliques</th>
                        <th className="px-4 py-4 text-right">CTR (%)</th>
                        <th className="px-4 py-4 text-right">Vendas (R$)</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-4 text-right">Propostas (QT)</th>
                        <th className="px-4 py-4 text-right">Vendas (QT)</th>
                        <th className="px-4 py-4 text-right">Valor Propostas (R$)</th>
                        <th className="px-4 py-4 text-right">Faturamento (R$)</th>
                      </>
                    )}
                    <th className="px-4 py-4 text-right">Investimento Ads (R$)</th>
                    {!isShopee && <th className="px-4 py-4 text-right">Conversão (%)</th>}
                    <th className="px-4 py-4 text-right">ROAS</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {channelData.map((row, idx) => {
                  const rowMonthId = parseMonthString(row.month);
                  const rowYear = row.month.split('/')[1];
                  
                  const rowYtdData = channelData.filter(d => {
                    const dMonthId = parseMonthString(d.month);
                    return d.month.endsWith(`/${rowYear}`) && dMonthId && rowMonthId && dMonthId <= rowMonthId;
                  });

                  const rowYtdConsumed = rowYtdData.reduce((acc, curr) => acc + curr.investment, 0);
                  const rowYtdSales = rowYtdData.reduce((acc, curr) => acc + curr.salesValue, 0);
                  const rowYtdRoas = rowYtdConsumed > 0 ? (rowYtdSales / rowYtdConsumed).toFixed(2) : '0.00';
                  const rowYtdProposals = rowYtdData.reduce((acc, curr) => acc + curr.proposalsQty, 0);
                  const rowYtdSalesQty = rowYtdData.reduce((acc, curr) => acc + curr.salesQty, 0);
                  const rowYtdConversion = rowYtdProposals > 0 ? ((rowYtdSalesQty / rowYtdProposals) * 100).toFixed(1) : '0.0';

                  const isExpanded = expandedMonths.has(row.month);
                  const colSpan = isShopee ? 7 : (isVtex ? 10 : 8);

                  return (
                    <React.Fragment key={idx}>
                      <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-4 py-4 font-medium text-slate-700">
                          <button 
                            onClick={() => toggleMonth(row.month)}
                            className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {row.month}
                          </button>
                        </td>
                        {isShopee ? (
                        <>
                          <td className="px-4 py-4 text-right">
                            {isShopeeApi ? (
                              <span className="w-20 inline-block text-right">{row.impressions || 0}</span>
                            ) : (
                              <DetailNumberInput
                                value={row.impressions || 0}
                                onChange={(val) => onUpdateDetail(channelName, row.month, 'impressions', val)}
                                className="w-20 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0"
                              />
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {isShopeeApi ? (
                              <span className="w-20 inline-block text-right">{row.clicks || 0}</span>
                            ) : (
                              <DetailNumberInput
                                value={row.clicks || 0}
                                onChange={(val) => onUpdateDetail(channelName, row.month, 'clicks', val)}
                                className="w-20 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0"
                              />
                            )}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-indigo-600">
                            {isShopeeApi ? (
                              <span className="w-16 inline-block text-right">{row.ctr || 0}</span>
                            ) : (
                              <DetailNumberInput
                                value={row.ctr || 0}
                                step="0.01"
                                onChange={(val) => onUpdateDetail(channelName, row.month, 'ctr', val)}
                                className="w-16 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0"
                              />
                            )}
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-semibold text-emerald-600">
                            <div className="flex flex-col items-end">
                              {isShopeeApi ? (
                                <span className="w-full min-w-[100px] text-right inline-block">
                                  {formatCurrency(row.salesValue)}
                                </span>
                              ) : (
                                <DetailCurrencyInput
                                  value={row.salesValue}
                                  onChange={(val) => onUpdateDetail(channelName, row.month, 'salesValue', val)}
                                  className="w-full min-w-[100px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-0"
                                />
                              )}
                              <span className="text-[10px] text-emerald-600/60 font-medium mt-0.5">YTD: {formatCurrency(rowYtdSales)}</span>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 text-right border-r border-slate-100 bg-indigo-50/10">
                            <DetailNumberInput
                              value={row.proposalsQty}
                              onChange={(val) => onUpdateDetail(channelName, row.month, 'proposalsQty', val)}
                              className="w-16 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0"
                            />
                          </td>
                          <td className="px-4 py-4 text-right border-r border-slate-100 bg-indigo-50/10">
                            <DetailNumberInput
                              value={row.salesQty}
                              onChange={(val) => onUpdateDetail(channelName, row.month, 'salesQty', val)}
                              className="w-16 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0"
                            />
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-indigo-600 border-r border-slate-100 bg-indigo-50/10">
                            <DetailCurrencyInput
                              value={row.proposalsValue}
                              onChange={(val) => onUpdateDetail(channelName, row.month, 'proposalsValue', val)}
                              className="w-full min-w-[100px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0"
                            />
                          </td>
                          {isVtex ? (
                            <>
                              <td className="px-4 py-4 text-right font-mono font-semibold text-emerald-600 border-r border-slate-200 bg-indigo-50/10">
                                <DetailCurrencyInput
                                  value={row.salesValueInstitutional || 0}
                                  onChange={(val) => onUpdateDetail(channelName, row.month, 'salesValueInstitutional', val)}
                                  className="w-full min-w-[100px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-0"
                                />
                              </td>
                              <td className="px-4 py-4 text-right font-mono text-indigo-600 border-r border-slate-100 bg-emerald-50/10">
                                <DetailNumberInput
                                  value={row.ecommerceOrdersQty || 0}
                                  onChange={(val) => onUpdateDetail(channelName, row.month, 'ecommerceOrdersQty', val)}
                                  className="w-full min-w-[100px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0"
                                />
                              </td>
                              <td className="px-4 py-4 text-right font-mono font-semibold text-emerald-600 border-r border-slate-200 bg-emerald-50/10">
                                <DetailCurrencyInput
                                  value={row.salesValueEcommerce || 0}
                                  onChange={(val) => onUpdateDetail(channelName, row.month, 'salesValueEcommerce', val)}
                                  className="w-full min-w-[100px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-0"
                                />
                              </td>
                              <td className="px-4 py-4 text-right font-mono font-semibold text-emerald-600 border-r border-slate-100 bg-slate-50/50">
                                <div className="flex flex-col items-end">
                                  <span className="w-full min-w-[100px] text-right px-2 py-1">
                                    {formatCurrency(row.salesValue)}
                                  </span>
                                  <span className="text-[10px] text-emerald-600/60 font-medium mt-0.5">YTD: {formatCurrency(rowYtdSales)}</span>
                                </div>
                              </td>
                            </>
                          ) : (
                            <td className="px-4 py-4 text-right font-mono font-semibold text-emerald-600">
                              <div className="flex flex-col items-end">
                                 <DetailCurrencyInput
                                   value={row.salesValue}
                                   onChange={(val) => onUpdateDetail(channelName, row.month, 'salesValue', val)}
                                   className="w-full min-w-[100px] text-right bg-transparent border-b border-transparent hover:border-emerald-500 focus:ring-0"
                                 />
                                <span className="text-[10px] text-emerald-600/60 font-medium mt-0.5">YTD: {formatCurrency(rowYtdSales)}</span>
                              </div>
                            </td>
                          )}
                        </>
                      )}
                      <td className={`px-4 py-4 text-right font-mono text-purple-600 ${isVtex ? 'border-r border-slate-100 bg-slate-50/50' : ''}`}>
                        <div className="flex flex-col items-end">
                          {isVtex || isShopeeApi ? (
                            <span className="w-full min-w-[100px] text-right px-2 py-1">
                              {formatCurrency(row.investment)}
                            </span>
                          ) : (
                            <DetailCurrencyInput
                              value={row.investment}
                              onChange={(val) => onUpdateDetail(channelName, row.month, 'investment', val)}
                              className="w-full min-w-[100px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:ring-0"
                            />
                          )}
                          <span className="text-[10px] text-purple-600/60 font-medium mt-0.5">YTD: {formatCurrency(rowYtdConsumed)}</span>
                        </div>
                      </td>
                      {!isVtex && !isShopee && (
                        <td className="px-4 py-4 text-right font-bold text-slate-700">
                          <div className="flex flex-col items-end">
                            <span>{row.conversionRate}%</span>
                            <span className="text-[10px] text-slate-500 font-medium mt-0.5">YTD: {rowYtdConversion}%</span>
                          </div>
                        </td>
                      )}
                      <td className={`px-4 py-4 text-right font-bold text-amber-500 ${isVtex ? 'bg-slate-50/50' : ''}`}>
                        <div className="flex flex-col items-end">
                          <span>{row.roas}x</span>
                          <span className="text-[10px] text-amber-500/60 font-medium mt-0.5">YTD: {rowYtdRoas}x</span>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={colSpan} className="p-0 border-b border-slate-200">
                          <div className="bg-slate-50/80 p-4 shadow-inner">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-slate-700">Acompanhamento Diário - {row.month}</h4>
                              {loadingDaily.has(row.month) && (
                                <div className="flex items-center gap-2 text-xs text-indigo-600 animate-pulse">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Carregando dados da API...
                                </div>
                              )}
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 text-slate-500 font-medium uppercase tracking-wider">
                                  {isVtex ? (
                                    <>
                                      <tr>
                                        <th rowSpan={2} className="px-3 py-2 align-middle border-r border-slate-200">Data</th>
                                        <th colSpan={4} className="px-3 py-1 text-center border-b border-r border-slate-200 bg-indigo-50/50">VTEX Leads</th>
                                        <th colSpan={2} className="px-3 py-1 text-center border-b border-r border-slate-200 bg-emerald-50/50">VTEX E-commerce (Click)</th>
                                        <th colSpan={3} className="px-3 py-1 text-center border-b border-slate-200 bg-slate-200/50">Consolidado</th>
                                      </tr>
                                      <tr>
                                        <th className="px-3 py-2 text-right border-r border-slate-200 bg-indigo-50/30">Prop. (QT)</th>
                                        <th className="px-3 py-2 text-right border-r border-slate-200 bg-indigo-50/30">Vendas (QT)</th>
                                        <th className="px-3 py-2 text-right border-r border-slate-200 bg-indigo-50/30">Valor Prop. (R$)</th>
                                        <th className="px-3 py-2 text-right border-r border-slate-200 bg-indigo-50/30">Vendas (R$)</th>
                                        
                                        <th className="px-3 py-2 text-right border-r border-slate-200 bg-emerald-50/30">Pedidos (QT)</th>
                                        <th className="px-3 py-2 text-right border-r border-slate-200 bg-emerald-50/30">Vendas (R$)</th>
                                        
                                        <th className="px-3 py-2 text-right border-r border-slate-200 bg-slate-200/30">Total Vendas</th>
                                        <th className="px-3 py-2 text-right border-r border-slate-200 bg-slate-200/30">Investimento</th>
                                        <th className="px-3 py-2 text-right bg-slate-200/30">ROAS</th>
                                      </tr>
                                    </>
                                  ) : (
                                    <tr>
                                      <th className="px-3 py-2">Data</th>
                                      {isShopee ? (
                                        <>
                                          <th className="px-3 py-2 text-right">Impressões</th>
                                          <th className="px-3 py-2 text-right">Cliques</th>
                                          <th className="px-3 py-2 text-right">CTR (%)</th>
                                          <th className="px-3 py-2 text-right">Vendas (R$)</th>
                                        </>
                                      ) : (
                                        <>
                                          <th className="px-3 py-2 text-right">Propostas</th>
                                          <th className="px-3 py-2 text-right">Vendas</th>
                                          <th className="px-3 py-2 text-right">Valor Propostas</th>
                                           <th className="px-3 py-2 text-right">Faturamento</th>
                                        </>
                                      )}
                                      <th className="px-3 py-2 text-right">Investimento</th>
                                      {!isShopee && <th className="px-3 py-2 text-right">Conversão</th>}
                                      <th className="px-3 py-2 text-right">ROAS</th>
                                    </tr>
                                  )}
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {getDaysInMonth(row.month).map((dateStr) => {
                                    const dayData = row.dailyData?.find(d => d.date === dateStr) || {
                                      date: dateStr, proposalsQty: 0, salesQty: 0, proposalsValue: 0, salesValue: 0, investment: 0, conversionRate: 0, roas: 0
                                    };
                                    const displayDate = dateStr.split('-').reverse().join('/');
                                    
                                    return (
                                      <tr key={dateStr} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 py-2 font-medium text-slate-600">{displayDate}</td>
                                        {isShopee ? (
                                          <>
                                            <td className="px-3 py-2 text-right">
                                              {isShopeeApi ? (
                                                <span className="w-16 text-right inline-block text-xs">{dayData.impressions || 0}</span>
                                              ) : (
                                                <DetailNumberInput
                                                  value={dayData.impressions || 0}
                                                  onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'impressions', val)}
                                                  className="w-16 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-xs"
                                                />
                                              )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                              {isShopeeApi ? (
                                                <span className="w-16 text-right inline-block text-xs">{dayData.clicks || 0}</span>
                                              ) : (
                                                <DetailNumberInput
                                                  value={dayData.clicks || 0}
                                                  onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'clicks', val)}
                                                  className="w-16 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-xs"
                                                />
                                              )}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-indigo-600">
                                              {isShopeeApi ? (
                                                <span className="w-12 text-right inline-block text-xs">{dayData.ctr || 0}</span>
                                              ) : (
                                                <DetailNumberInput
                                                  value={dayData.ctr || 0}
                                                  step="0.01"
                                                  onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'ctr', val)}
                                                  className="w-12 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-xs"
                                                />
                                              )}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">
                                              {isShopeeApi ? (
                                                <span className="w-full min-w-[80px] text-right inline-block text-xs">{formatCurrency(dayData.salesValue)}</span>
                                              ) : (
                                                <DetailCurrencyInput
                                                  value={dayData.salesValue}
                                                  onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'salesValue', val)}
                                                  className="w-full min-w-[80px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-0 text-xs"
                                                />
                                              )}
                                            </td>
                                          </>
                                        ) : (
                                          <>
                                            <td className={`px-3 py-2 text-right ${isVtex ? 'border-r border-slate-100 bg-indigo-50/10' : ''}`}>
                                              <DetailNumberInput
                                                value={dayData.proposalsQty}
                                                onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'proposalsQty', val)}
                                                className="w-12 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-xs"
                                              />
                                            </td>
                                            <td className={`px-3 py-2 text-right ${isVtex ? 'border-r border-slate-100 bg-indigo-50/10' : ''}`}>
                                              <DetailNumberInput
                                                value={dayData.salesQty}
                                                onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'salesQty', val)}
                                                className="w-12 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-xs"
                                              />
                                            </td>
                                            <td className={`px-3 py-2 text-right font-mono text-indigo-600 ${isVtex ? 'border-r border-slate-100 bg-indigo-50/10' : ''}`}>
                                              <DetailCurrencyInput
                                                value={dayData.proposalsValue}
                                                onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'proposalsValue', val)}
                                                className="w-full min-w-[80px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-xs"
                                              />
                                            </td>
                                            {isVtex ? (
                                              <>
                                                <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600 border-r border-slate-200 bg-indigo-50/10">
                                                  <DetailCurrencyInput
                                                    value={dayData.salesValueInstitutional || 0}
                                                    onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'salesValueInstitutional', val)}
                                                    className="w-full min-w-[80px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-0 text-xs"
                                                  />
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono text-indigo-600 border-r border-slate-100 bg-emerald-50/10">
                                                  <DetailNumberInput
                                                    value={dayData.ecommerceOrdersQty || 0}
                                                    onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'ecommerceOrdersQty', val)}
                                                    className="w-full min-w-[80px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-xs"
                                                  />
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600 border-r border-slate-200 bg-emerald-50/10">
                                                  <DetailCurrencyInput
                                                    value={dayData.salesValueEcommerce || 0}
                                                    onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'salesValueEcommerce', val)}
                                                    className="w-full min-w-[80px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-0 text-xs"
                                                  />
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600 border-r border-slate-100 bg-slate-100/50">
                                                  {formatCurrency(dayData.salesValue)}
                                                </td>
                                              </>
                                            ) : (
                                              <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">
                                                <DetailCurrencyInput
                                                  value={dayData.salesValue}
                                                  onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'salesValue', val)}
                                                  className="w-full min-w-[80px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-0 text-xs"
                                                />
                                              </td>
                                            )}
                                          </>
                                        )}
                                        <td className={`px-3 py-2 text-right font-mono text-purple-600 ${isVtex ? 'border-r border-slate-100 bg-slate-100/50' : ''}`}>
                                          {isVtex || isShopeeApi ? (
                                            <span className="w-full min-w-[80px] text-right px-2 py-1 text-xs inline-block">
                                              {formatCurrency(dayData.investment)}
                                            </span>
                                          ) : (
                                            <DetailCurrencyInput
                                              value={dayData.investment}
                                              onChange={(val) => onUpdateDailyDetail?.(channelName, row.month, dateStr, 'investment', val)}
                                              className="w-full min-w-[80px] text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:ring-0 text-xs"
                                            />
                                          )}
                                        </td>
                                        {!isVtex && !isShopee && (
                                          <td className="px-3 py-2 text-right font-bold text-slate-700">
                                            {dayData.conversionRate}%
                                          </td>
                                        )}
                                        <td className={`px-3 py-2 text-right font-bold text-amber-500 ${isVtex ? 'bg-slate-100/50' : ''}`}>
                                          {dayData.roas}x
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
