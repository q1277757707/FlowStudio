import type { Plugin } from 'vite';
import { handleApiDemo, isApiDemoPath } from './apiDemo';

/**
 * 仅在 `vite dev` 下生效的 API Mock 中间件。
 */
export function viteApiMockPlugin(): Plugin {
  return {
    name: 'lc-api-mock',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!isApiDemoPath(req.url)) {
          next();
          return;
        }

        await handleApiDemo(req, res, req.url ?? '/api/demo');
      });
    }
  };
}
