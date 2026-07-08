import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { exposeApi } from './lib/api';
import { initMediaStore } from './lib/mediaStore';
import { initFavicon } from './lib/favicon';
import './styles/global.css';

// интеграционный слой доступен внешним системам сразу
exposeApi();
// оверрайды арт-редактора подтягиваются из IndexedDB в фоне
initMediaStore();
// фавиконка с крутящимся колесом
initFavicon();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
