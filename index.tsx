console.log("Vibo App: Запуск index.tsx..."); // ЭТА СТРОКА ПОМОЖЕТ НАМ УВИДЕТЬ СТАРТ

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("ОШИБКА: Не найден root элемент!");
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
