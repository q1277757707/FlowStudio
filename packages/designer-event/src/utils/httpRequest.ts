import axios from 'axios';
import type { RequestOptions } from '../types';

/** 基于 axios 的统一 HTTP 请求（事件动作、选项接口等共用） */
export async function httpRequest(options: RequestOptions): Promise<unknown> {
  const method = (options.method ?? 'GET').toUpperCase();
  const isQueryMethod = method === 'GET' || method === 'HEAD';

  const response = await axios.request({
    url: options.url,
    method,
    params: isQueryMethod ? options.params : undefined,
    data: isQueryMethod ? undefined : (options.params ?? {}),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  return response.data;
}
