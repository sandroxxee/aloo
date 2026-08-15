import { GoogleGenAI } from '@google/genai';
import express from 'express';
// request context removed to fix circular dependency

export async function retryWithBackoffAndModelFallback<T>(
  targetFn: (...args: any[]) => any,
  context: any,
  args: any[],
  retries = 5,
  delay = 2000,
  fallbackModelIndex = 0
): Promise<T> {
  const currentArgs = [...args];
  let originalModel: string | undefined;
  
  if (currentArgs[0] && typeof currentArgs[0] === 'object') {
    originalModel = (currentArgs[0] as any).model;
    if (!originalModel) {
      originalModel = 'gemini-1.5-flash';
      (currentArgs[0] as any).model = originalModel;
    }
  } else {
    originalModel = 'gemini-1.5-flash';
  }

  const fallbackModels = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-flash-latest',
  ].filter(m => m !== originalModel);

  if (currentArgs[0] && typeof currentArgs[0] === 'object') {
    if (fallbackModelIndex > 0 && fallbackModelIndex <= fallbackModels.length) {
      const nextModel = fallbackModels[fallbackModelIndex - 1];
      // Silenced verbose logging to prevent log flooding
      currentArgs[0] = { ...currentArgs[0], model: nextModel };
    }
  }

  try {
    const result = targetFn.apply(context, currentArgs);
    if (result && typeof result.then === 'function') {
      return await result;
    }
    return result;
  } catch (error: any) {
    const errorStr = String(error?.message || error).toLowerCase();
    
    const isRateLimit = errorStr.includes('429') || 
                        errorStr.includes('quota') || 
                        errorStr.includes('resource_exhausted') || 
                        errorStr.includes('rate limit') ||
                        errorStr.includes('too_many_requests') ||
                        error?.status === 429 ||
                        error?.statusCode === 429 ||
                        error?.httpStatus === 429;
                        
    const isModelUnavailable = errorStr.includes('404') ||
                               errorStr.includes('not found') ||
                               errorStr.includes('no longer available') ||
                               errorStr.includes('deprecated') ||
                               errorStr.includes('discontinued') ||
                               errorStr.includes('unsupported') ||
                               errorStr.includes('not supported') ||
                               errorStr.includes('invalid model') ||
                               errorStr.includes('model not found') ||
                               errorStr.includes('400') ||
                               errorStr.includes('403') ||
                               errorStr.includes('invalid argument') ||
                               errorStr.includes('bad request') ||
                               error?.status === 404 ||
                               error?.status === 400 ||
                               error?.status === 403 ||
                               error?.statusCode === 404 ||
                               error?.statusCode === 400 ||
                               error?.statusCode === 403;

    if (isRateLimit && retries > 0) {
      // Silenced verbose retry warnings to prevent log flooding
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoffAndModelFallback(
        targetFn,
        context,
        args,
        retries - 1,
        delay * 2,
        fallbackModelIndex
      );
    }

    if ((isModelUnavailable || isRateLimit) && fallbackModelIndex < fallbackModels.length) {
      const nextModelCandidate = fallbackModels[fallbackModelIndex];
      // Silenced verbose fallback warnings to prevent log flooding
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoffAndModelFallback(
        targetFn,
        context,
        args,
        retries,
        delay * 1.5,
        fallbackModelIndex + 1
      );
    }

    throw error;
  }
}

function shouldProxy(value: any): boolean {
  if (!value || typeof value !== 'object') return false;
  
  // Do not proxy common built-in classes
  if (value instanceof URL) return false;
  if (value instanceof Date) return false;
  if (value instanceof RegExp) return false;
  if (value instanceof Map) return false;
  if (value instanceof Set) return false;
  if (value instanceof Promise) return false;
  if (Array.isArray(value)) return false;
  if (ArrayBuffer.isView(value)) return false; // typed arrays, buffers
  
  // Do not proxy if constructor is a standard built-in
  const proto = Object.getPrototypeOf(value);
  if (proto) {
    const name = proto.constructor?.name;
    if (name === 'URL' || name === 'Headers' || name === 'Request' || name === 'Response' || name === 'Buffer') {
      return false;
    }
  }
  
  return true;
}

export function wrapWithRetry<T>(obj: T): T {
  if (!shouldProxy(obj)) return obj;

  return new Proxy(obj as any, {
    get(target, prop) {
      const value = Reflect.get(target, prop);
      
      if (typeof value === 'function') {
        const boundFn = value.bind(target);
        return function(this: any, ...args: any[]) {
          const isAsyncProp = [
            'generateContent', 
            'create', 
            'generateMessage', 
            'countTokens', 
            'embedContent'
          ].includes(prop as string) || (typeof prop === 'string' && (prop.startsWith('generate') || prop.startsWith('create') || prop.startsWith('analyze')));

          if (isAsyncProp) {
            return retryWithBackoffAndModelFallback(boundFn, target, args);
          } else {
            const result = boundFn(...args);
            if (result && typeof result.then === 'function') {
              return retryWithBackoffAndModelFallback(() => result, target, []);
            }
            return wrapWithRetry(result);
          }
        };
      }
      
      return wrapWithRetry(value);
    }
  }) as any;
}

export function getAiClient(customKeyOrReq?: string | express.Request): GoogleGenAI | null {
  let apiKey = process.env.GEMINI_API_KEY || '';
  
  if (typeof customKeyOrReq === 'string' && customKeyOrReq.trim()) {
    apiKey = customKeyOrReq.trim();
  } else if (customKeyOrReq && typeof customKeyOrReq === 'object' && 'headers' in customKeyOrReq) {
    const reqKey = (customKeyOrReq.headers['x-gemini-api-key'] as string) || customKeyOrReq.body?.customApiKey || customKeyOrReq.body?.apiKey;
    if (reqKey && typeof reqKey === 'string' && reqKey.trim()) {
      apiKey = reqKey.trim();
    }
  }

  if (!apiKey || apiKey.trim() === '') return null;
  return wrapWithRetry(new GoogleGenAI({ apiKey }));
}

export function generateSpintax(template: string): string {
  if (!template) return '';
  return template.replace(/\{([^{}]+)\}/g, (match, contents) => {
    const options = contents.split('|');
    return options[Math.floor(Math.random() * options.length)];
  });
}

export const ai = new Proxy({}, {
  get(_target, prop) {
    const client = getAiClient();
    if (!client) {
      return new Proxy(() => {}, {
        get(_t, method) {
          return async () => { throw new Error('GEMINI_API_KEY_MISSING'); };
        },
        apply() { return Promise.resolve({ output_text: 'Offline Mode' }); }
      });
    }
    return (client as any)[prop];
  }
}) as unknown as GoogleGenAI;
