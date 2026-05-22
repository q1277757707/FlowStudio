const EVENT_USER_GUIDE_DOC = 'event-user-guide.md';

/** 文档预览页地址，如 /docs-preview.html?doc=event-user-guide.md */
export function getDocPreviewUrl(docPath: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return `${base}docs-preview.html?doc=${encodeURIComponent(docPath)}`;
}

/** 在新标签页打开事件使用指南 */
export function openEventGuideDoc() {
  window.open(getDocPreviewUrl(EVENT_USER_GUIDE_DOC), '_blank', 'noopener,noreferrer');
}
