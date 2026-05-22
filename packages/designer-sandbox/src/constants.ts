/** 禁止从沙箱作用域访问的全局/敏感标识 */
export const BLOCKED_SCOPE_KEYS = new Set([
  'constructor',
  '__proto__',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'eval',
  'Function',
  'window',
  'document',
  'globalThis',
  'self',
  'top',
  'parent',
  'frames',
  'opener',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'XMLHttpRequest',
  'fetch',
  'importScripts',
  'Worker',
  'SharedWorker'
]);

export const SANDBOX_SCOPE_PARAM = '__sandbox__';
