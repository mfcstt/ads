import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

import { handlePloomesRoute } from './routes/ploomes';
import { handleShopeeRoute } from './routes/shopee';

const app = express();
app.use(express.json({ limit: '50mb' }));

// Middleware para as novas rotas modulares
app.all('/api/ploomes*', async (req, res) => {
  const handled = await handlePloomesRoute(req, res);
  if (!handled) res.status(404).json({ error: 'Rota Ploomes não encontrada' });
});

app.all('/api/shopee*', async (req, res) => {
  const handled = await handleShopeeRoute(req, res);
  if (!handled) res.status(404).json({ error: 'Rota Shopee não encontrada' });
});

// Mantemos as rotas de dados legadas por enquanto
app.get('/api/dados', (_req, res) => {
  const file = path.join(root, 'dados.json');
  fs.readFile(file, 'utf-8', (err, data) => {
    if (err) {
      res.status(404).json({ error: 'dados.json não encontrado' });
      return;
    }
    res.type('application/json').send(data);
  });
});

app.put('/api/dados', (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body.budget_data !== 'string' || typeof body.channel_details !== 'string') {
      res.status(400).json({ error: 'Formato: { budget_data: string, channel_details: string }' });
      return;
    }
    JSON.parse(body.budget_data);
    JSON.parse(body.channel_details);
    const file = path.join(root, 'dados.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(body), 'utf-8');
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

const dist = path.join(root, 'dist');
app.use(express.static(dist));

app.get('*', (_req, res) => {
  const index = path.join(dist, 'index.html');
  if (!fs.existsSync(index)) {
    res.status(503).send('Execute npm run build antes de npm start.');
    return;
  }
  res.sendFile(index);
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor: http://localhost:${PORT} (API + arquivos estáticos)`);
});
