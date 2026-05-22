import { marked } from 'marked';

export function getDocPreviewUrl(docPath: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return `${base}docs-preview.html?doc=${encodeURIComponent(docPath)}`;
}

/** 将 docs 内相对路径解析为 docs 根目录下的规范路径 */
export function resolveDocPath(currentPath: string, href: string): string {
  if (/^https?:\/\//i.test(href) || href.startsWith('#')) {
    return href;
  }

  const base = currentPath.includes('/')
    ? currentPath.slice(0, currentPath.lastIndexOf('/') + 1)
    : '';
  const segments = (base + href).split('/');

  const out: string[] = [];
  for (const part of segments) {
    if (!part || part === '.') {
      continue;
    }
    if (part === '..') {
      out.pop();
      continue;
    }
    out.push(part);
  }

  return out.join('/');
}

export function parseMarkdownWithDocLinks(source: string, currentPath: string): string {
  const renderer = new marked.Renderer();

  renderer.link = ({ href, title, text }) => {
    if (!href) {
      return text;
    }

    if (/^https?:\/\//i.test(href) || href.startsWith('#')) {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    }

    if (href.endsWith('.md')) {
      const docPath = resolveDocPath(currentPath, href);
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${getDocPreviewUrl(docPath)}" data-doc-link="1"${titleAttr}>${text}</a>`;
    }

    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}"${titleAttr}>${text}</a>`;
  };

  return marked.parse(source, {
    gfm: true,
    breaks: true,
    renderer
  }) as string;
}
