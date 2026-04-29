import crypto from 'node:crypto';
import https from 'node:https';
import 'dotenv/config';

const SHOPEE_HOST = 'https://partner.shopeemobile.com';

/**
 * Agente HTTPS que ignora erros de certificado SSL.
 * Necessário para ambientes corporativos com proxy/firewall que
 * interceptam o tráfego TLS (mesmo comportamento do script de teste original).
 */
const sslAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Wrapper do fetch que utiliza o agente SSL customizado.
 * O Node 18+ fetch (undici) não aceita httpsAgent diretamente,
 * então usamos a abordagem de env var apenas durante as chamadas Shopee.
 */
async function shopeeFetch(url: string, options?: RequestInit): Promise<Response> {
  const originalTLS = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  try {
    return await fetch(url, options);
  } finally {
    // Restaura o valor original para não afetar outras requisições
    if (originalTLS === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTLS;
    }
  }
}

// ─── Token cache (in-memory, per-process) ───────────────────────────
interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix‑seconds
}

const tokenCaches: Record<string, TokenCache> = {};

export function getShopeeCredentials(accountKey: string = 'matriz') {
  const isMatriz = accountKey.toLowerCase() === 'matriz' || accountKey === 'Matriz (SP)';
  const prefix = isMatriz ? 'SHOPEE_' : `SHOPEE_${accountKey.toUpperCase().replace(/\s/g, '_')}_`;
  
  // Try to get specific, fallback to general if not available (for backward compatibility)
  const partnerId = process.env[`${prefix}PARTNER_ID`] || process.env['SHOPEE_PARTNER_ID'];
  const partnerKey = process.env[`${prefix}PARTNER_KEY`] || process.env['SHOPEE_PARTNER_KEY'];
  const shopId = process.env[`${prefix}SHOP_ID`] || process.env['SHOPEE_SHOP_ID'];
  const refreshToken = process.env[`${prefix}REFRESH_TOKEN`] || process.env['SHOPEE_REFRESH_TOKEN'];

  if (!partnerId || !partnerKey || !shopId || !refreshToken) {
    throw new Error(`Credenciais Shopee incompletas no .env para a conta: ${accountKey}`);
  }

  return { partnerId, partnerKey, shopId, refreshToken };
}

function generateSign(partnerKey: string, partnerId: string, shopId: string, path: string, timestamp: number, accessToken?: string): string {
  let baseString = `${partnerId}${path}${timestamp}`;
  if (accessToken) {
    baseString += `${accessToken}${shopId}`;
  }
  return crypto
    .createHmac('sha256', partnerKey)
    .update(baseString)
    .digest('hex');
}

// ─── Access Token Management ────────────────────────────────────────
/**
 * Obtém um access_token válido.
 * - Se o cache existe e ainda tem pelo menos 5 min de validade, retorna o cache.
 * - Caso contrário, faz refresh usando o refresh_token mais recente.
 * - A cada refresh a Shopee retorna um novo refresh_token, que é guardado no cache.
 */
export async function getValidAccessToken(accountKey: string = 'matriz'): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const cache = tokenCaches[accountKey];

  // Return cached token if still valid (with 5 min buffer)
  if (cache && cache.expiresAt > now + 300) {
    return cache.accessToken;
  }

  const { partnerId, partnerKey, shopId, refreshToken: envRefreshToken } = getShopeeCredentials(accountKey);
  const refreshToken = cache?.refreshToken || envRefreshToken;

  const path = '/api/v2/auth/access_token/get';
  const timestamp = now;
  const sign = generateSign(partnerKey, partnerId, shopId, path, timestamp);

  const url = `${SHOPEE_HOST}${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;

  console.log(`[Shopee] Refreshing access token for account: ${accountKey}...`);

  const res = await shopeeFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: refreshToken,
      partner_id: parseInt(partnerId),
      shop_id: parseInt(shopId),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Shopee] Token refresh failed for ${accountKey}:`, text);
    throw new Error(`Shopee token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json() as any;

  if (data.error) {
    console.error(`[Shopee] Token refresh API error for ${accountKey}:`, data);
    throw new Error(`Shopee token refresh error: ${data.error} - ${data.message || ''}`);
  }

  // Cache the new tokens
  tokenCaches[accountKey] = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: now + (data.expire_in || 14400), // default 4 hours
  };

  console.log(`[Shopee] Token refreshed successfully for ${accountKey}. Expires in ${data.expire_in || 14400}s`);
  return tokenCaches[accountKey].accessToken;
}

// ─── Ads Daily Performance ──────────────────────────────────────────
/**
 * Busca a performance diária de CPC ads para o período informado.
 * startDate / endDate no formato "DD-MM-YYYY" (exigido pela API Shopee).
 */
export async function getAdsDailyPerformance(startDate: string, endDate: string, accountKey: string = 'matriz'): Promise<{
  expense: number;
  gmv: number;
  impressions: number;
  clicks: number;
  orders: number;
  ctr: number;
  roas: number;
  dailyData: any[];
}> {
  const accessToken = await getValidAccessToken(accountKey);
  const { partnerId, partnerKey, shopId } = getShopeeCredentials(accountKey);

  const path = '/api/v2/ads/get_all_cpc_ads_daily_performance';
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateSign(partnerKey, partnerId, shopId, path, timestamp, accessToken);

  const params = new URLSearchParams({
    partner_id: partnerId,
    timestamp: String(timestamp),
    access_token: accessToken,
    shop_id: shopId,
    sign,
    start_date: startDate,
    end_date: endDate,
  });

  console.log(`[Shopee] Fetching CPC performance: ${startDate} → ${endDate}`);

  const res = await shopeeFetch(`${SHOPEE_HOST}${path}?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    console.error('[Shopee] Ads performance request failed:', text);
    throw new Error(`Shopee ads performance failed (${res.status})`);
  }

  const data = await res.json() as any;

  if (data.error) {
    console.error('[Shopee] Ads performance API error:', data);
    throw new Error(`Shopee ads error: ${data.error} - ${data.message || ''}`);
  }

  const dailyData: any[] = data.response || [];

  if (dailyData.length === 0) {
    return { expense: 0, gmv: 0, impressions: 0, clicks: 0, orders: 0, ctr: 0, roas: 0, dailyData: [] };
  }

  const processedDailyData = dailyData.map(day => {
    // Tenta converter timestamp para YYYY-MM-DD
    let formattedDate = "";
    if (day.timestamp) {
      const dateObj = new Date(day.timestamp * 1000);
      formattedDate = dateObj.toISOString().split('T')[0];
    } else if (day.date) {
      if (day.date.includes("-") && day.date.split("-")[0].length === 2) {
        const [d, m, y] = day.date.split("-");
        formattedDate = `${y}-${m}-${d}`;
      } else {
        formattedDate = day.date;
      }
    } else {
      // Fallback pra criar uma data a partir de startDate se nada existir, 
      // mas confiaremos no timestamp/date da API primariamente.
      formattedDate = "";
    }
    
    const imp = day.impression || 0;
    const clk = day.clicks || 0;
    const exp = day.expense || 0;
    const sales = day.broad_gmv || 0;
    const cRate = imp > 0 ? Number(((clk / imp) * 100).toFixed(2)) : 0;
    const dRoas = exp > 0 ? Number((sales / exp).toFixed(2)) : 0;

    return {
      date: formattedDate,
      impressions: imp,
      clicks: clk,
      expense: exp,
      gmv: sales,
      orders: day.broad_order || 0,
      ctr: cRate,
      roas: dRoas
    };
  });

  const totals = dailyData.reduce(
    (acc, day) => {
      acc.impressions += day.impression || 0;
      acc.clicks += day.clicks || 0;
      acc.expense += day.expense || 0;
      acc.gmv += day.broad_gmv || 0;
      acc.orders += day.broad_order || 0;
      return acc;
    },
    { impressions: 0, clicks: 0, expense: 0, gmv: 0, orders: 0 },
  );

  const ctr = totals.impressions > 0 ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0;
  const roas = totals.expense > 0 ? Number((totals.gmv / totals.expense).toFixed(2)) : 0;

  console.log(`[Shopee] Performance result — Expense: ${totals.expense}, GMV: ${totals.gmv}, Impressions: ${totals.impressions}, Clicks: ${totals.clicks}, CTR: ${ctr}%, ROAS: ${roas}`);

  return { ...totals, ctr, roas, dailyData: processedDailyData };
}

// ─── Account Balance ────────────────────────────────────────────────
export async function getAccountBalance(accountKey: string = 'matriz'): Promise<number> {
  const accessToken = await getValidAccessToken(accountKey);
  const { partnerId, partnerKey, shopId } = getShopeeCredentials(accountKey);

  const path = '/api/v2/ads/get_total_balance';
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateSign(partnerKey, partnerId, shopId, path, timestamp, accessToken);

  const params = new URLSearchParams({
    partner_id: partnerId,
    timestamp: String(timestamp),
    access_token: accessToken,
    shop_id: shopId,
    sign,
  });

  console.log(`[Shopee] Fetching account balance for ${accountKey}...`);

  const res = await shopeeFetch(`${SHOPEE_HOST}${path}?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Shopee] Balance request failed for ${accountKey}:`, text);
    throw new Error(`Shopee balance request failed (${res.status})`);
  }

  const data = await res.json() as any;

  if (data.error) {
    console.error(`[Shopee] Balance API error for ${accountKey}:`, data);
    throw new Error(`Shopee balance error: ${data.error}`);
  }

  const balance = data.response?.total_balance || 0;
  console.log(`[Shopee] Account balance for ${accountKey}: R$ ${balance}`);
  return balance;
}
