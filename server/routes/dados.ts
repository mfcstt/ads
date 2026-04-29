import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { readBody } from '../utils/bodyReader';

const DATA_FILE = path.resolve(process.cwd(), 'dados.json');

export async function handleDadosRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';

  if (url === '/api/dados') {
    if (req.method === 'GET') {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(fileContent);
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({}));
      }
      return true;
    }

    if (req.method === 'PUT') {
      try {
        const body = await readBody(req);
        
        let budgetData = [];
        try {
          budgetData = typeof body.budget_data === 'string' ? JSON.parse(body.budget_data) : body.budget_data;
        } catch (e) {
          console.error('Failed to parse budget_data', e);
        }

        const minimalBudgetData = Array.isArray(budgetData) ? budgetData.map((month: any) => ({
          id: month.id,
          month: month.month,
          notes: month.notes,
          entries: Array.isArray(month.entries) ? month.entries.map((entry: any) => ({
            id: entry.id,
            category: entry.category,
            platform: entry.platform,
            manager: entry.manager,
            type: entry.type,
            monthlyBudget: entry.monthlyBudget || 0,
            investment: entry.investment || 0
          })) : []
        })) : [];

        const minimalData = {
          budget_data: JSON.stringify(minimalBudgetData)
        };

        fs.writeFileSync(DATA_FILE, JSON.stringify(minimalData, null, 2), 'utf-8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        console.error('Error saving data:', e);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to save data' }));
      }
      return true;
    }
  }

  return false;
}
