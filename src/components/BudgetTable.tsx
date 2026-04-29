import { formatCurrency } from "@/src/lib/utils";
import { BudgetEntry, ChannelPerformanceData, monthToPtBr } from "@/src/types";
// import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Layers, User, ShoppingCart, MapPin, Trash2, Plus, ExternalLink } from "lucide-react";
import React, { Fragment, useState, useEffect } from "react";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

function CurrencyInput({ value, onChange, className }: CurrencyInputProps) {
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
      onClick={(e) => e.stopPropagation()}
    />
  );
}

interface BudgetTableProps {
  month: string;
  entries: BudgetEntry[];
  ytdData: Record<string, { consumed: number, salesValue: number }>;
  onUpdateEntry: (id: string, field: keyof BudgetEntry, value: number | string) => void;
  onRowClick?: (category: string) => void;
  onDeleteEntry?: (id: string) => void;
  onAddEntry?: (platform: 'Google Ads' | 'Meta Ads' | 'Vowt Performance' | 'Shopee') => void;
  defaultPlatform?: 'Google Ads' | 'Meta Ads' | 'Vowt Performance' | 'Shopee';
  channelDetails?: Record<string, ChannelPerformanceData[]>;
}

export function BudgetTable({
  month,
  entries,
  ytdData,
  onUpdateEntry,
  onRowClick,
  onDeleteEntry,
  onAddEntry,
  defaultPlatform = 'Google Ads',
  channelDetails
}: BudgetTableProps) {
  const totalBudget = entries.reduce((acc, curr) => acc + curr.monthlyBudget, 0);
  const totalInvestment = entries.reduce((acc, curr) => acc + curr.investment, 0);
  const totalConsumed = entries.reduce((acc, curr) => acc + curr.consumed, 0);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth() + 1;
  const [entryYear, entryMonth] = month.split('-').map(Number);
  const isPastMonth = currentYear > entryYear || (currentYear === entryYear && currentMonthNum > entryMonth);

  // Group entries by Platform
  const groups = entries.reduce((acc, entry) => {
    const groupName = entry.platform === 'Google Ads' ? 'Google Ads (Susana)' : entry.platform;
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(entry);
    return acc;
  }, {} as Record<string, BudgetEntry[]>);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-4 py-3">Canal / Região</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Orçamento Mensal</th>
              <th className="px-4 py-3 text-right">Investimento Planejado</th>
              <th className="px-4 py-3 text-right">Consumido Real</th>
              <th className="px-4 py-3 text-right">Faturamento</th>
              <th className="px-4 py-3 text-right">ROAS</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.entries(groups).map(([groupName, groupEntries]) => {
              if (groupEntries.length === 0) return null;

              const groupBudget = groupEntries.reduce((acc, curr) => acc + curr.monthlyBudget, 0);
              const groupConsumed = groupEntries.reduce((acc, curr) => acc + curr.consumed, 0);

              return (
                <Fragment key={groupName}>
                  {/* Group Header */}
                  <tr className="bg-slate-50/80">
                    <td colSpan={9} className="px-4 py-2 font-semibold text-slate-700 border-t border-slate-200 first:border-t-0">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          {groupName}
                        </span>
                        <span className="text-xs font-normal text-slate-500">
                          Total Grupo: {formatCurrency(groupConsumed)} / {formatCurrency(groupBudget)}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Group Rows */}
                  {groupEntries.map((entry) => {
                    const isOverBudget = entry.consumed > entry.monthlyBudget;
                    const isNearBudget = !isPastMonth && entry.consumed > entry.monthlyBudget * 0.9 && entry.consumed < entry.investment;
                    const roas = entry.consumed > 0 ? ((entry.salesValue || 0) / entry.consumed).toFixed(2) : '0.00';
                    const isShopeeApi = entry.category === 'Matriz (SP)';

                    const ytd = ytdData[entry.category] || { consumed: 0, salesValue: 0 };
                    const ytdRoas = ytd.consumed > 0 ? (ytd.salesValue / ytd.consumed).toFixed(2) : '0.00';

                    let vtexLeadsSales = 0;
                    let vtexEcommerceSales = 0;
                    if (entry.category === 'VTEX Geral') {
                      const [year, monthNum] = month.split('-');
                      const shortYear = year.slice(2);
                      const ptBrMonth = monthToPtBr[monthNum];
                      const lookupKey = `${ptBrMonth}/${shortYear}`;

                      const vtexData = channelDetails?.['VTEX Geral']?.find(d => d.month === lookupKey);
                      if (vtexData) {
                        vtexLeadsSales = vtexData.salesValueInstitutional || 0;
                        vtexEcommerceSales = vtexData.salesValueEcommerce || 0;
                      }
                    }

                    return (
                      <Fragment key={entry.id}>
                        <tr
                          onClick={() => onRowClick && onRowClick(entry.category)}
                          className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${isOverBudget
                            ? 'bg-red-50/50 hover:bg-red-50'
                            : isNearBudget
                              ? 'bg-amber-50/50 hover:bg-amber-50'
                              : 'hover:bg-slate-50/50'
                            }`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-900 pl-8">
                            <div className="flex flex-col gap-1">
                              {entry.platform === 'Shopee' ? (
                                <>
                                  <input
                                    type="text"
                                    value={entry.category}
                                    onChange={(e) => onUpdateEntry(entry.id, 'category', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors font-medium"
                                    placeholder="Nome do Canal"
                                  />
                                  <select
                                    value={entry.platform}
                                    onChange={(e) => onUpdateEntry(entry.id, 'platform', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors text-xs text-slate-500 w-fit"
                                  >
                                    <option value="Google Ads">Google Ads</option>
                                    <option value="Meta Ads">Meta Ads</option>
                                    <option value="Vowt Performance">Vowt Performance</option>
                                    <option value="Shopee">Shopee</option>
                                  </select>
                                </>
                              ) : (
                                <>
                                  <span className="font-medium">{entry.category}</span>
                                  <span className="text-xs text-slate-500">{entry.platform}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            <div className="flex items-center gap-1.5">
                              {entry.type === 'Filial' && <MapPin className="w-3 h-3" />}
                              {entry.type === 'E-commerce' && <ShoppingCart className="w-3 h-3" />}
                              {entry.type === 'Institucional' && <User className="w-3 h-3" />}
                              {entry.platform === 'Shopee' ? (
                                <select
                                  value={entry.type}
                                  onChange={(e) => onUpdateEntry(entry.id, 'type', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors text-sm"
                                >
                                  <option value="Filial">Filial</option>
                                  <option value="E-commerce">E-commerce</option>
                                  <option value="Institucional">Institucional</option>
                                </select>
                              ) : (
                                <span className="text-sm">{entry.type}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            <CurrencyInput
                              className="w-28 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors"
                              value={entry.monthlyBudget}
                              onChange={(val) => onUpdateEntry(entry.id, 'monthlyBudget', val)}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            <CurrencyInput
                              className="w-28 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors"
                              value={entry.investment}
                              onChange={(val) => onUpdateEntry(entry.id, 'investment', val)}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            <div className="flex flex-col items-end">
                              {isShopeeApi ? (
                                <span className={`w-28 text-right py-1 px-2 ${isOverBudget ? 'text-red-600 font-bold' : isNearBudget ? 'text-amber-600 font-bold' : ''
                                  }`}>
                                  {formatCurrency(entry.consumed)}
                                </span>
                              ) : entry.platform === 'Shopee' ? (
                                <CurrencyInput
                                  className={`w-28 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors ${isOverBudget ? 'text-red-600 font-bold' : isNearBudget ? 'text-amber-600 font-bold' : ''
                                    }`}
                                  value={entry.consumed}
                                  onChange={(val) => onUpdateEntry(entry.id, 'consumed', val)}
                                />
                              ) : (
                                <span className={`w-28 text-right py-1 px-2 ${isOverBudget ? 'text-red-600 font-bold' : isNearBudget ? 'text-amber-600 font-bold' : ''
                                  }`}>
                                  {formatCurrency(entry.consumed)}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium mt-0.5">YTD: {formatCurrency(ytd.consumed)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-600">
                            <div className="flex flex-col items-end">
                              {isShopeeApi ? (
                                <span className="w-28 text-right py-1 px-2">
                                  {formatCurrency(entry.salesValue || 0)}
                                </span>
                              ) : entry.platform === 'Shopee' ? (
                                <CurrencyInput
                                  className="w-28 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none transition-colors"
                                  value={entry.salesValue || 0}
                                  onChange={(val) => onUpdateEntry(entry.id, 'salesValue', val)}
                                />
                              ) : (
                                <span className="w-28 text-right py-1 px-2">
                                  {formatCurrency(entry.salesValue || 0)}
                                </span>
                              )}
                              <span className="text-[10px] text-emerald-600/60 font-medium mt-0.5">YTD: {formatCurrency(ytd.salesValue)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-500">
                            <div className="flex flex-col items-end">
                              <span>{roas}x</span>
                              <span className="text-[10px] text-amber-500/60 font-medium mt-0.5">YTD: {ytdRoas}x</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 flex justify-center">
                            {isOverBudget ? (
                              <div className="flex items-center text-red-500 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Excedido
                              </div>
                            ) : isNearBudget ? (
                              <div className="flex items-center text-amber-500 text-xs font-medium bg-amber-50 px-2 py-1 rounded-full">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Atenção
                              </div>
                            ) : (
                              <div className="flex items-center text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                OK
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {onRowClick && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onRowClick(entry.category); }}
                                  className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                                  title="Ver Detalhes"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              )}
                              {onDeleteEntry && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDeleteEntry(entry.id); }}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                  title="Remover Canal"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {entry.category === 'VTEX Geral' && (
                          <>
                            <tr className="bg-slate-50/50 text-xs text-slate-500 border-t border-slate-100">
                              <td className="px-4 py-2 pl-12 font-medium border-l-[3px] border-indigo-200">
                                ↳ VTEX Leads
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3 h-3" />
                                  Institucional
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-slate-400">-</td>
                              <td className="px-4 py-2 text-right font-mono text-slate-400">-</td>
                              <td className="px-4 py-2 text-right font-mono text-slate-400">-</td>
                              <td className="px-4 py-2 text-right font-mono text-emerald-600/80 font-medium">
                                {formatCurrency(vtexLeadsSales)}
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-slate-400">-</td>
                              <td className="px-4 py-2 text-center text-slate-400">-</td>
                              <td className="px-4 py-2 text-center"></td>
                            </tr>
                            <tr className="bg-slate-50/50 text-xs text-slate-500 border-t border-slate-100">
                              <td className="px-4 py-2 pl-12 font-medium border-l-[3px] border-indigo-200">
                                ↳ VTEX Ecommerce
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1.5">
                                  <ShoppingCart className="w-3 h-3" />
                                  E-commerce
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-slate-400">-</td>
                              <td className="px-4 py-2 text-right font-mono text-slate-400">-</td>
                              <td className="px-4 py-2 text-right font-mono text-slate-400">-</td>
                              <td className="px-4 py-2 text-right font-mono text-emerald-600/80 font-medium">
                                {formatCurrency(vtexEcommerceSales)}
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-slate-400">-</td>
                              <td className="px-4 py-2 text-center text-slate-400">-</td>
                              <td className="px-4 py-2 text-center"></td>
                            </tr>
                          </>
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              );
            })}
            <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-200">
              <td className="px-4 py-4" colSpan={2}>TOTAL GERAL</td>
              <td className="px-4 py-4 text-right font-mono">{formatCurrency(totalBudget)}</td>
              <td className="px-4 py-4 text-right font-mono">{formatCurrency(totalInvestment)}</td>
              <td className="px-4 py-4 text-right font-mono">
                <div className="flex flex-col items-end">
                  <span>{formatCurrency(totalConsumed)}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">YTD: {formatCurrency(entries.reduce((acc, curr) => acc + (ytdData[curr.category]?.consumed || 0), 0))}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-right font-mono text-emerald-600">
                <div className="flex flex-col items-end">
                  <span>{formatCurrency(entries.reduce((acc, curr) => acc + (curr.salesValue || 0), 0))}</span>
                  <span className="text-[10px] text-emerald-600/60 font-medium mt-0.5">YTD: {formatCurrency(entries.reduce((acc, curr) => acc + (ytdData[curr.category]?.salesValue || 0), 0))}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-right font-mono text-amber-500">
                <div className="flex flex-col items-end">
                  <span>{totalConsumed > 0 ? (entries.reduce((acc, curr) => acc + (curr.salesValue || 0), 0) / totalConsumed).toFixed(2) : '0.00'}x</span>
                  <span className="text-[10px] text-amber-500/60 font-medium mt-0.5">
                    YTD: {entries.reduce((acc, curr) => acc + (ytdData[curr.category]?.consumed || 0), 0) > 0
                      ? (entries.reduce((acc, curr) => acc + (ytdData[curr.category]?.salesValue || 0), 0) / entries.reduce((acc, curr) => acc + (ytdData[curr.category]?.consumed || 0), 0)).toFixed(2)
                      : '0.00'}x
                  </span>
                </div>
              </td>
              <td className="px-4 py-4"></td>
              <td className="px-4 py-4"></td>
            </tr>
          </tbody>
        </table>
      </div>
      {onAddEntry && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => onAddEntry(defaultPlatform)}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Canal
          </button>
        </div>
      )}
    </div>
  );
}
