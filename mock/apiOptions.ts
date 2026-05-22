import type { IncomingMessage, ServerResponse } from 'node:http';
import type { MockApiResponse } from './apiDemo';

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

const flatOptions = [
  { label: '选项一', value: 'option1' },
  { label: '选项二', value: 'option2' },
  { label: '选项三', value: 'option3' }
];

const treeOptions = [
  {
    label: '华东',
    value: 'east',
    children: [
      { label: '上海', value: 'shanghai' },
      { label: '杭州', value: 'hangzhou' }
    ]
  },
  {
    label: '华北',
    value: 'north',
    children: [
      { label: '北京', value: 'beijing' },
      { label: '天津', value: 'tianjin' }
    ]
  }
];

export function isApiOptionsPath(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  const pathname = url.split('?')[0] ?? '';

  return pathname === '/api/options/list' || pathname === '/api/options/tree';
}

/** GET /api/options/list | /api/options/tree */
export async function handleApiOptions(req: IncomingMessage, res: ServerResponse, url: string) {
  const method = (req.method ?? 'GET').toUpperCase();
  const pathname = url.split('?')[0] ?? '';
  const query = parseQuery(url);

  if (method !== 'GET') {
    sendJson(res, 405, {
      code: 405,
      message: `Method ${method} not allowed`,
      data: null
    });
    return;
  }

  if (pathname === '/api/options/tree') {
    sendJson(res, 200, {
      code: 0,
      message: 'ok',
      data: {
        tree: treeOptions,
        query,
        serverTime: new Date().toISOString()
      }
    });
    return;
  }

  sendJson(res, 200, {
    code: 0,
    message: 'ok',
    data: {
      list: flatOptions,
      query,
      serverTime: new Date().toISOString()
    }
  });
}
