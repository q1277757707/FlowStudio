import type { IncomingMessage, ServerResponse } from 'node:http';

export interface MockApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');

      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

function parseQuery(url: string): Record<string, string> {
  const queryIndex = url.indexOf('?');

  if (queryIndex === -1) {
    return {};
  }

  return Object.fromEntries(new URLSearchParams(url.slice(queryIndex + 1)));
}

function sendJson(res: ServerResponse, status: number, body: MockApiResponse) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/**
 * 开发环境 Mock：GET/POST /api/demo
 */
export async function handleApiDemo(req: IncomingMessage, res: ServerResponse, url: string) {
  const method = (req.method ?? 'GET').toUpperCase();
  const query = parseQuery(url);

  try {
    if (method === 'GET') {
      sendJson(res, 200, {
        code: 0,
        message: 'ok',
        data: {
          list: [
            { id: 1, name: '演示项 A', status: 'active' },
            { id: 2, name: '演示项 B', status: 'draft' }
          ],
          query,
          serverTime: new Date().toISOString()
        }
      });
      return;
    }

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const body = await readBody(req);

      sendJson(res, 200, {
        code: 0,
        message: 'saved',
        data: {
          id: `demo_${Date.now()}`,
          received: body,
          query,
          serverTime: new Date().toISOString()
        }
      });
      return;
    }

    sendJson(res, 405, {
      code: 405,
      message: `Method ${method} not allowed`,
      data: null
    });
  } catch (error) {
    sendJson(res, 400, {
      code: 400,
      message: error instanceof Error ? error.message : 'Bad request',
      data: null
    });
  }
}

export function isApiDemoPath(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  const pathname = url.split('?')[0] ?? '';

  return pathname === '/api/demo' || pathname === '/api/demo/';
}
