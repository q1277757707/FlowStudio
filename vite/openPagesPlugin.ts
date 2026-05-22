import { exec } from 'node:child_process';
import type { Plugin } from 'vite';

function openInBrowser(url: string) {
  const platform = process.platform;
  const command =
    platform === 'win32'
      ? `start "" "${url}"`
      : platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(command, (error) => {
    if (error) {
      console.warn(`[flowstudio] 无法自动打开浏览器: ${url}`);
    }
  });
}

/** 开发服务器就绪后额外打开指定路径（与 server.open 配合，用于多标签页） */
export function openPagesOnStart(paths: string[]): Plugin {
  return {
    name: 'flowstudio-open-pages',
    apply: 'serve',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const base = server.resolvedUrls?.local[0];
        if (!base) {
          return;
        }

        for (const path of paths) {
          const normalized = path.startsWith('/') ? path : `/${path}`;
          openInBrowser(`${base}${normalized}`);
        }
      });
    }
  };
}
