/**
 * Tiny event bus for cross-widget signals (bot, hints, FX).
 * Owned by the foundation.
 *
 * Known events:
 *  - 'page:change'      { path }
 *  - 'product:view'     { productId }
 *  - 'product:linger'   { productId }        // user stared at a product for a while
 *  - 'cart:add'         { productId }
 *  - 'cart:abandon'     { total }            // has items, tries to leave
 *  - 'exit:intent'      {}                   // mouse leaves the viewport top
 *  - 'checkout:success' { orderId, total }
 *  - 'promo:grant'      { code, pct }        // bot dropped a promo code
 *  - 'auth:open'        {}                   // open the sign-in modal
 *  - 'auth:signed-in'   { user }
 *  - 'garage:add'       { car }
 */

type Handler = (payload?: any) => void;

const handlers = new Map<string, Set<Handler>>();

export const bus = {
  on(event: string, fn: Handler): () => void {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(fn);
    return () => handlers.get(event)?.delete(fn);
  },
  emit(event: string, payload?: any) {
    handlers.get(event)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error(`[bus] handler for "${event}" failed`, e);
      }
    });
  },
};
