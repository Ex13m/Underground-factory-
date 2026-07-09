import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { version } from './package.json';

/** version.json в корне сборки — маяк для авто-обновления открытых вкладок */
function versionBeacon(): Plugin {
  return {
    name: 'uf-version-beacon',
    closeBundle() {
      writeFileSync(
        resolve(__dirname, 'dist/version.json'),
        JSON.stringify({ version, builtAt: new Date().toISOString() }),
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), versionBeacon()],
  server: { port: 5173, host: true },
  define: {
    // версия сайта (из package.json) и дата сборки — выводятся в футере
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
});
