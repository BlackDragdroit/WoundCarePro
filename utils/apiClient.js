import { fetch as tauriFetch, ResponseType, Body } from '@tauri-apps/api/http';
import { isTauriEnv } from './updateChecker';

/**
 * Universal API fetch helper.
 * When running inside Tauri on Desktop, uses Tauri's native Rust HTTP client
 * which bypasses browser Mixed Content (HTTPS -> HTTP), Private Network Access (PNA) restrictions,
 * and CORS blocks when communicating with local Synology NAS or server.
 * In a standard web browser (e.g. dev server), falls back to window.fetch.
 */
export const apiFetch = async (url, options = {}) => {
  if (isTauriEnv()) {
    try {
      let bodyOption = undefined;
      if (options.body) {
        if (typeof options.body === 'string') {
          try {
            bodyOption = Body.json(JSON.parse(options.body));
          } catch {
            bodyOption = Body.text(options.body);
          }
        } else {
          bodyOption = Body.json(options.body);
        }
      }

      const res = await tauriFetch(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: bodyOption,
        responseType: ResponseType.JSON,
        timeout: 15,
      });

      return {
        ok: res.ok,
        status: res.status,
        headers: res.headers,
        json: async () => res.data,
        text: async () => (typeof res.data === 'string' ? res.data : JSON.stringify(res.data)),
      };
    } catch (err) {
      console.warn("Tauri native fetch error, attempting window.fetch fallback:", err);
      return window.fetch(url, options);
    }
  }

  return window.fetch(url, options);
};
