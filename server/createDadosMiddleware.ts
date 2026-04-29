import type { IncomingMessage, ServerResponse } from 'http';
import { handleDadosRoute } from './routes/dados';
import { handleShopeeRoute } from './routes/shopee';
import { handlePloomesRoute } from './routes/ploomes';

export function createDadosMiddleware(root: string) {
  return async (req: IncomingMessage, res: ServerResponse, next: Function) => {
    if (!req.url?.startsWith('/api/')) {
      return next();
    }

    try {
      if (await handleDadosRoute(req, res)) return;
      if (await handleShopeeRoute(req, res)) return;
      if (await handlePloomesRoute(req, res)) return;
    } catch (error) {
      console.error('[Middleware Error]:', error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
      return;
    }

    next();
  };
}
