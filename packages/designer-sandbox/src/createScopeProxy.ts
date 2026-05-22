import { BLOCKED_SCOPE_KEYS } from './constants';
import type { SandboxScope } from './types';

function isBlockedKey(key: string | symbol): boolean {
  if (typeof key !== 'string') {
    return true;
  }

  return BLOCKED_SCOPE_KEYS.has(key);
}

/**
 * 使用 Proxy 构造 with 语句的隔离作用域。
 * has 返回 true，避免 with 向外层作用域查找未声明变量。
 */
export function createScopeProxy(scope: SandboxScope): SandboxScope {
  return new Proxy(scope, {
    has() {
      return true;
    },

    get(target, key, receiver) {
      if (key === Symbol.unscopables) {
        return undefined;
      }

      if (isBlockedKey(key)) {
        return undefined;
      }

      if (typeof key === 'string' && Object.prototype.hasOwnProperty.call(target, key)) {
        return Reflect.get(target, key, receiver);
      }

      return undefined;
    },

    set(target, key, value, receiver) {
      if (typeof key !== 'string' || isBlockedKey(key)) {
        return false;
      }

      return Reflect.set(target, key, value, receiver);
    },

    deleteProperty(target, key) {
      if (typeof key !== 'string' || isBlockedKey(key)) {
        return false;
      }

      return Reflect.deleteProperty(target, key);
    },

    getOwnPropertyDescriptor(target, key) {
      if (typeof key !== 'string' || isBlockedKey(key)) {
        return undefined;
      }

      if (Object.prototype.hasOwnProperty.call(target, key)) {
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value: target[key]
        };
      }

      return {
        configurable: true,
        enumerable: true,
        writable: true,
        value: undefined
      };
    }
  });
}
