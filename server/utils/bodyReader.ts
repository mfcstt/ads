import type { IncomingMessage } from 'http';

export function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}
