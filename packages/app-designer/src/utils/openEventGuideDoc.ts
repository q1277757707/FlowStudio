/** 在新标签页打开事件使用指南 */
export function openEventGuideDoc() {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  window.open(`${base}event-guide.html`, '_blank', 'noopener,noreferrer');
}
