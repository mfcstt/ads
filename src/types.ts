export interface BudgetEntry {
  id: string;
  category: string; // e.g., MATRIZ, VTEX, RIO DE JANEIRO
  platform: 'Google Ads' | 'Meta Ads' | 'Vowt Performance' | 'Shopee';
  manager: 'Susana' | 'Vowt' | 'Interno' | 'N/A';
  type: 'Filial' | 'E-commerce' | 'Institucional';
  monthlyBudget: number;
  investment: number;
  consumed: number;
  salesValue?: number;
  notes?: string;
}

export interface MonthlyData {
  id: string;
  month: string; // e.g., "2026-01"
  entries: BudgetEntry[];
  notes?: string;
}

export interface DailyPerformanceData {
  date: string; // e.g., "2026-03-01"
  proposalsQty: number;
  salesQty: number;
  proposalsValue: number;
  salesValue: number;
  salesValueEcommerce?: number;
  salesValueInstitutional?: number;
  ecommerceOrdersQty?: number;
  investment: number;
  investmentEcommerce?: number;
  investmentInstitutional?: number;
  conversionRate: number;
  roas: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
}

export interface ChannelPerformanceData {
  month: string;
  proposalsQty: number;
  salesQty: number;
  proposalsValue: number;
  salesValue: number;
  salesValueEcommerce?: number;
  salesValueInstitutional?: number;
  ecommerceOrdersQty?: number;
  investment: number;
  investmentEcommerce?: number;
  investmentInstitutional?: number;
  conversionRate: number;
  roas: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  dailyData?: DailyPerformanceData[];
}

export const MATRIZ_DATA: ChannelPerformanceData[] = [
  { month: 'Mar/26', proposalsQty: 57, salesQty: 22, proposalsValue: 418000.00, salesValue: 130000.00, investment: 5000.00, conversionRate: 38.6, roas: 26 },
  { month: 'Fev/26', proposalsQty: 169, salesQty: 62, proposalsValue: 5357936.27, salesValue: 426779.05, investment: 20000.00, conversionRate: 36.7, roas: 21.34 },
  { month: 'Jan/26', proposalsQty: 249, salesQty: 76, proposalsValue: 4885509.07, salesValue: 400839.96, investment: 27100.00, conversionRate: 30.5, roas: 14.79 },
  { month: 'Dez/25', proposalsQty: 194, salesQty: 45, proposalsValue: 2104271.33, salesValue: 225936.25, investment: 34000.00, conversionRate: 23.2, roas: 6.65 },
  { month: 'Nov/25', proposalsQty: 205, salesQty: 70, proposalsValue: 2277033.78, salesValue: 435082.54, investment: 29000.00, conversionRate: 34.1, roas: 15 },
  { month: 'Out/25', proposalsQty: 590, salesQty: 145, proposalsValue: 5259460.01, salesValue: 771161.99, investment: 40000.00, conversionRate: 24.6, roas: 19.28 },
  { month: 'Set/25', proposalsQty: 506, salesQty: 119, proposalsValue: 6864156.71, salesValue: 828705.46, investment: 23000.00, conversionRate: 23.5, roas: 36.03 },
  { month: 'Ago/25', proposalsQty: 457, salesQty: 94, proposalsValue: 6103639.25, salesValue: 695781.55, investment: 19800.00, conversionRate: 20.6, roas: 35.14 },
  { month: 'Jul/25', proposalsQty: 475, salesQty: 92, proposalsValue: 4614813.61, salesValue: 458560.32, investment: 18500.00, conversionRate: 19.4, roas: 24.79 },
  { month: 'Jun/25', proposalsQty: 343, salesQty: 61, proposalsValue: 4520283.46, salesValue: 553360.92, investment: 22000.00, conversionRate: 17.8, roas: 25.15 },
  { month: 'Maio/25', proposalsQty: 185, salesQty: 16, proposalsValue: 2218127.63, salesValue: 34445.34, investment: 19600.00, conversionRate: 8.6, roas: 1.76 },
];

export const META_DATA: ChannelPerformanceData[] = [
  { month: 'Mar/26', proposalsQty: 15, salesQty: 3, proposalsValue: 295720.14, salesValue: 41117.44, investment: 4000.00, conversionRate: 20, roas: 10.28 },
  { month: 'Fev/26', proposalsQty: 11, salesQty: 4, proposalsValue: 125068.75, salesValue: 30873.72, investment: 4293.00, conversionRate: 36.4, roas: 7.19 },
  { month: 'Jan/26', proposalsQty: 7, salesQty: 0, proposalsValue: 96257.28, salesValue: 0.00, investment: 1985.00, conversionRate: 0, roas: 0 },
];

export const VTEX_GERAL_DATA: ChannelPerformanceData[] = [
  { month: 'Mar/26', proposalsQty: 2, salesQty: 4, proposalsValue: 2711.00, salesValue: 25114.13, salesValueInstitutional: 8326.00, salesValueEcommerce: 16788.13, ecommerceOrdersQty: 0, investment: 3000, investmentInstitutional: 1500, investmentEcommerce: 1500, conversionRate: 200, roas: 8.37 },
  { month: 'Fev/26', proposalsQty: 14, salesQty: 3, proposalsValue: 23709.00, salesValue: 17265.48, salesValueInstitutional: 0.00, salesValueEcommerce: 17265.48, ecommerceOrdersQty: 0, investment: 3000, investmentInstitutional: 1500, investmentEcommerce: 1500, conversionRate: 21.4, roas: 5.75 },
  { month: 'Jan/26', proposalsQty: 2, salesQty: 1, proposalsValue: 4680.82, salesValue: 14588.06, salesValueInstitutional: 2303.92, salesValueEcommerce: 12284.14, ecommerceOrdersQty: 0, investment: 4000, investmentInstitutional: 2000, investmentEcommerce: 2000, conversionRate: 50, roas: 3.64 }
];

export const SHOPEE_MATRIZ_DATA: ChannelPerformanceData[] = [
  { month: 'Mar/26', proposalsQty: 0, salesQty: 0, proposalsValue: 0, salesValue: 0, investment: 0, conversionRate: 0, roas: 0 },
  { month: 'Fev/26', proposalsQty: 0, salesQty: 0, proposalsValue: 0, salesValue: 0, investment: 0, conversionRate: 0, roas: 0 },
  { month: 'Jan/26', proposalsQty: 0, salesQty: 0, proposalsValue: 0, salesValue: 0, investment: 0, conversionRate: 0, roas: 0 },
];

export const SHOPEE_RJ_DATA: ChannelPerformanceData[] = [
  { month: 'Mar/26', proposalsQty: 0, salesQty: 0, proposalsValue: 0, salesValue: 0, investment: 0, conversionRate: 0, roas: 0 },
  { month: 'Fev/26', proposalsQty: 0, salesQty: 0, proposalsValue: 0, salesValue: 0, investment: 0, conversionRate: 0, roas: 0 },
  { month: 'Jan/26', proposalsQty: 0, salesQty: 0, proposalsValue: 0, salesValue: 0, investment: 0, conversionRate: 0, roas: 0 },
];

export const SHOPEE_BAHIA_DATA: ChannelPerformanceData[] = [
  { month: 'Mar/26', proposalsQty: 0, salesQty: 0, proposalsValue: 0, salesValue: 0, investment: 0, conversionRate: 0, roas: 0 },
  { month: 'Fev/26', proposalsQty: 0, salesQty: 0, proposalsValue: 0, salesValue: 0, investment: 0, conversionRate: 0, roas: 0 },
  { month: 'Jan/26', proposalsQty: 0, salesQty: 0, proposalsValue: 0, salesValue: 0, investment: 0, conversionRate: 0, roas: 0 },
];

export function generateEmptyChannelData(): ChannelPerformanceData[] {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = String(now.getFullYear()).slice(2);
  
  const months = [];
  for (let i = currentMonth; i >= 1; i--) {
    const ptMonth = monthToPtBr[String(i).padStart(2, '0')];
    months.push(`${ptMonth}/${currentYear}`);
  }
  
  // Também adicionamos os meses do ano passado se necessário, 
  // mas por enquanto vamos garantir o ano atual completo
  return months.map(month => ({
    month,
    proposalsQty: 0,
    salesQty: 0,
    proposalsValue: 0,
    salesValue: 0,
    investment: 0,
    conversionRate: 0,
    roas: 0
  }));
}

export const monthToPtBr: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Maio', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
};

export function getInvestmentFromDetails(category: string, monthStr: string): number | null {
  const [year, month] = monthStr.split('-');
  const shortYear = year.slice(2);
  const ptBrMonth = monthToPtBr[month];
  const lookupKey = `${ptBrMonth}/${shortYear}`;

  let dataToSearch: ChannelPerformanceData[] = [];
  if (category === 'MATRIZ') dataToSearch = MATRIZ_DATA;
  else if (category === 'META (Geral)') dataToSearch = META_DATA;
  else if (category === 'VTEX Geral') dataToSearch = VTEX_GERAL_DATA;
  else if (category === 'Matriz (SP)') dataToSearch = SHOPEE_MATRIZ_DATA;
  else if (category === 'Rio de Janeiro') dataToSearch = SHOPEE_RJ_DATA;
  else if (category === 'Bahia') dataToSearch = SHOPEE_BAHIA_DATA;
  else dataToSearch = generateEmptyChannelData();

  const found = dataToSearch.find(d => d.month === lookupKey);
  return found ? found.investment : null;
}

export function getSalesValueFromDetails(category: string, monthStr: string): number | null {
  const [year, month] = monthStr.split('-');
  const shortYear = year.slice(2);
  const ptBrMonth = monthToPtBr[month];
  const lookupKey = `${ptBrMonth}/${shortYear}`;

  let dataToSearch: ChannelPerformanceData[] = [];
  if (category === 'MATRIZ') dataToSearch = MATRIZ_DATA;
  else if (category === 'META (Geral)') dataToSearch = META_DATA;
  else if (category === 'VTEX Geral') dataToSearch = VTEX_GERAL_DATA;
  else if (category === 'Matriz (SP)') dataToSearch = SHOPEE_MATRIZ_DATA;
  else if (category === 'Rio de Janeiro') dataToSearch = SHOPEE_RJ_DATA;
  else if (category === 'Bahia') dataToSearch = SHOPEE_BAHIA_DATA;
  else dataToSearch = generateEmptyChannelData();

  const found = dataToSearch.find(d => d.month === lookupKey);
  return found ? found.salesValue : null;
}

const RAW_INITIAL_DATA: MonthlyData[] = [
  {
    id: "jan-2026",
    month: "2026-01",
    notes: "- A verba da Bahia e da Meta foi distribuída entre Matriz e VTEX.\n- Bahia tinha saldo no Google do mês anterior.\n- Meta ainda está em formatação dos anúncios, portanto não gastou toda a verba mensal.",
    entries: [
      // Google Ads (Susana)
      { 
        id: "1", 
        category: "MATRIZ", 
        platform: "Google Ads",
        manager: "Susana",
        type: "Filial",
        monthlyBudget: 20000, 
        investment: 26000, 
        consumed: 27100 
      },
      { 
        id: "2", 
        category: "VTEX Geral", 
        platform: "Google Ads",
        manager: "Susana",
        type: "E-commerce",
        monthlyBudget: 3000, 
        investment: 4000, 
        consumed: 5000 
      },
      { 
        id: "3", 
        category: "RIO DE JANEIRO", 
        platform: "Google Ads",
        manager: "Susana",
        type: "Filial",
        monthlyBudget: 3000, 
        investment: 3000, 
        consumed: 3000 
      },
      { 
        id: "4", 
        category: "BAHIA", 
        platform: "Google Ads",
        manager: "Susana",
        type: "Filial",
        monthlyBudget: 5000, 
        investment: 1000, 
        consumed: 3940 
      },
      // Vowt
      { 
        id: "5", 
        category: "STORE", 
        platform: "Vowt Performance",
        manager: "Vowt",
        type: "E-commerce",
        monthlyBudget: 5000, 
        investment: 6276.51, 
        consumed: 6276.51 
      },
      // Meta
      { 
        id: "6", 
        category: "META (Geral)", 
        platform: "Meta Ads",
        manager: "Interno",
        type: "Institucional",
        monthlyBudget: 6500, 
        investment: 1895.36, 
        consumed: 1895.36 
      },
      // Shopee
      {
        id: "7",
        category: "Matriz (SP)",
        platform: "Shopee",
        manager: "Interno",
        type: "E-commerce",
        monthlyBudget: 0,
        investment: 0,
        consumed: 0
      },
      {
        id: "8",
        category: "Rio de Janeiro",
        platform: "Shopee",
        manager: "Interno",
        type: "E-commerce",
        monthlyBudget: 0,
        investment: 0,
        consumed: 0
      },
      {
        id: "9",
        category: "Bahia",
        platform: "Shopee",
        manager: "Interno",
        type: "E-commerce",
        monthlyBudget: 0,
        investment: 0,
        consumed: 0
      }
    ]
  },
  {
    id: "feb-2026",
    month: "2026-02",
    entries: [
      { 
        id: "1", 
        category: "MATRIZ", 
        platform: "Google Ads",
        manager: "Susana",
        type: "Filial",
        monthlyBudget: 20000, 
        investment: 20000, 
        consumed: 19775.89 
      },
      { 
        id: "2", 
        category: "VTEX Geral", 
        platform: "Google Ads",
        manager: "Susana",
        type: "E-commerce",
        monthlyBudget: 3000, 
        investment: 3000, 
        consumed: 3000 
      },
      { 
        id: "3", 
        category: "RIO DE JANEIRO", 
        platform: "Google Ads",
        manager: "Susana",
        type: "Filial",
        monthlyBudget: 3000, 
        investment: 3000, 
        consumed: 1842.89 
      },
      { 
        id: "4", 
        category: "BAHIA", 
        platform: "Google Ads",
        manager: "Susana",
        type: "Filial",
        monthlyBudget: 5000, 
        investment: 5000, 
        consumed: 5000 
      },
      { 
        id: "5", 
        category: "STORE", 
        platform: "Vowt Performance",
        manager: "Vowt",
        type: "E-commerce",
        monthlyBudget: 5000, 
        investment: 5000, 
        consumed: 2600 
      },
      { 
        id: "6", 
        category: "META (Geral)", 
        platform: "Meta Ads",
        manager: "Interno",
        type: "Institucional",
        monthlyBudget: 6500, 
        investment: 3000, 
        consumed: 4293.7 
      },
      // Shopee
      {
        id: "7",
        category: "Matriz (SP)",
        platform: "Shopee",
        manager: "Interno",
        type: "E-commerce",
        monthlyBudget: 0,
        investment: 0,
        consumed: 0
      },
      {
        id: "8",
        category: "RIO DE JANEIRO",
        platform: "Shopee",
        manager: "Interno",
        type: "E-commerce",
        monthlyBudget: 0,
        investment: 0,
        consumed: 0
      },
      {
        id: "9",
        category: "BAHIA",
        platform: "Shopee",
        manager: "Interno",
        type: "E-commerce",
        monthlyBudget: 0,
        investment: 0,
        consumed: 0
      }
    ]
  },
  ...Array.from({ length: 10 }, (_, i) => {
    const monthNum = i + 3;
    const monthStr = monthNum.toString().padStart(2, '0');
    return {
      id: `2026-${monthStr}`,
      month: `2026-${monthStr}`,
      entries: [
        { 
          id: "1", 
          category: "MATRIZ", 
          platform: "Google Ads",
          manager: "Susana",
          type: "Filial",
          monthlyBudget: 20000, 
          investment: 20000, 
          consumed: 0 
        },
        { 
          id: "2", 
          category: "VTEX GERAL", 
          platform: "Google Ads",
          manager: "Susana",
          type: "E-commerce",
          monthlyBudget: 3000, 
          investment: 3000, 
          consumed: 0 
        },
        { 
          id: "3", 
          category: "RIO DE JANEIRO", 
          platform: "Google Ads",
          manager: "Susana",
          type: "Filial",
          monthlyBudget: 3000, 
          investment: 3000, 
          consumed: 0 
        },
        { 
          id: "4", 
          category: "BAHIA", 
          platform: "Google Ads",
          manager: "Susana",
          type: "Filial",
          monthlyBudget: 5000, 
          investment: 5000, 
          consumed: 0 
        },
        { 
          id: "5", 
          category: "STORE", 
          platform: "Vowt Performance",
          manager: "Vowt",
          type: "E-commerce",
          monthlyBudget: 5000, 
          investment: 5000, 
          consumed: 0 
        },
        { 
          id: "6", 
          category: "META (GERAL)", 
          platform: "Meta Ads",
          manager: "Interno",
          type: "Institucional",
          monthlyBudget: 6500, 
          investment: 3000, 
          consumed: 0 
        },
        // Shopee
        {
          id: "7",
          category: "Matriz (SP)",
          platform: "Shopee",
          manager: "Interno",
          type: "E-commerce",
          monthlyBudget: 0,
          investment: 0,
          consumed: 0
        },
        {
          id: "8",
          category: "Rio de Janeiro",
          platform: "Shopee",
          manager: "Interno",
          type: "E-commerce",
          monthlyBudget: 0,
          investment: 0,
          consumed: 0
        },
        {
          id: "9",
          category: "Bahia",
          platform: "Shopee",
          manager: "Interno",
          type: "E-commerce",
          monthlyBudget: 0,
          investment: 0,
          consumed: 0
        }
      ]
    } as MonthlyData;
  })
];

export const INITIAL_DATA: MonthlyData[] = RAW_INITIAL_DATA.map(monthData => ({
  ...monthData,
  entries: monthData.entries.map(entry => {
    const detailInvestment = getInvestmentFromDetails(entry.category, monthData.month);
    const detailSalesValue = getSalesValueFromDetails(entry.category, monthData.month);
    return {
      ...entry,
      consumed: detailInvestment !== null ? detailInvestment : entry.consumed,
      salesValue: detailSalesValue !== null ? detailSalesValue : 0
    };
  })
}));
