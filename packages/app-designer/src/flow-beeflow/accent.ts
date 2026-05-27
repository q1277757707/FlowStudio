/** 将节点主题色注入为 CSS 变量，供选中态 color-mix 使用 */
export function nodeAccentVars(accent: string): Record<string, string> {
  return { '--bf-node-accent': accent };
}
