import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Lang, LocalText } from './types';
import { useUI } from '../store/ui';

import common from '../i18n/common';
import home from '../i18n/home';
import catalog from '../i18n/catalog';
import product from '../i18n/product';
import cart from '../i18n/cart';
import account from '../i18n/account';
import admin from '../i18n/admin';
import bot from '../i18n/bot';
import hints from '../i18n/hints';
import artEditor from '../i18n/artEditor';
import radio from '../i18n/radio';
import content from '../i18n/content';

const namespaces = [common, home, catalog, product, cart, account, admin, bot, hints, artEditor, radio, content];

const dict: Record<Lang, Record<string, string>> = { ru: {}, en: {} };
for (const ns of namespaces) {
  Object.assign(dict.ru, ns.ru);
  Object.assign(dict.en, ns.en);
}

interface I18n {
  lang: Lang;
  /** t('catalog.title') or t('cart.items', { n: 3 }) with {n} placeholders */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** pick a bilingual value from data: lt(product.name) */
  lt: (text: LocalText) => string;
}

const Ctx = createContext<I18n>({ lang: 'ru', t: (k) => k, lt: (x) => x.ru });

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useUI((s) => s.lang);
  const value = useMemo<I18n>(() => ({
    lang,
    t: (key, vars) => {
      let s = dict[lang][key] ?? dict.ru[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    },
    lt: (text) => text[lang] ?? text.ru,
  }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
