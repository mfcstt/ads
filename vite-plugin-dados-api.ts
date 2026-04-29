import type { Plugin } from 'vite';
import { createDadosMiddleware } from './server/createDadosMiddleware';

export function dadosApiPlugin(): Plugin {
  return {
    name: 'dados-api',
    configureServer(server) {
      const root = server.config.root;
      server.middlewares.use(createDadosMiddleware(root));
    },
    configurePreviewServer(server) {
      const root = server.config.root;
      server.middlewares.use(createDadosMiddleware(root));
    },
  };
}
