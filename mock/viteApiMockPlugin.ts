import type { Plugin } from 'vite';
import { handleApiDemo, isApiDemoPath } from './apiDemo';
import { handleApiOptions, isApiOptionsPath } from './apiOptions';

/**
 * 仅在 `vite dev` 下生效的 API Mock 中间件。
 */
export function viteApiMockPlugin(): Plugin {
  return {
    name: 'lc-api-mock',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';

        if (isApiOptionsPath(url)) {
          await handleApiOptions(req, res, url);
          return;
        }

        if (!isApiDemoPath(url)) {
          next();
          return;
        }

        await handleApiDemo(req, res, url);
      });
    }
  };
}
