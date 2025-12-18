import React, { useState, useEffect } from 'react';
import { AppMode, UserTier } from './types';
import InvoiceGenerator from './components/InvoiceGenerator';
import SharkChat from './components/SharkChat';
import UserProfile from './components/UserProfile';
import { FileText, MessageSquare, Zap, User, Lock, Loader2 } from 'lucide-react';

// Твой рабочий вебхук из прошлого кода
const WEBHOOK_URL = 'https://viboteam.app.n8n.cloud/webhook/vibo-init'; 

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.INVOICE);
  const [tier, setTier] = useState<UserTier>(UserTier.FREE); // По умолчанию FREE
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки

  useEffect(() => {
    const initApp = async () => {
      // 1. Получаем ID пользователя
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      let userId = 123456; // Тестовый ID (fallback)

      if (tg) {
        tg.expand(); // На весь экран
        // Настраиваем цвета шапки Telegram под наш дизайн
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#000000');
        
        if (tg.initDataUnsafe?.user) {
          userId = tg.initDataUnsafe.user.id;
        }
      }

      console.log("Vibo: Connecting for UserID:", userId);

      // 2. Стучимся в n8n за тарифом
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Vibo: Ответ сервера:", data);
          
          // Если сервер вернул тариф, ставим его. Иначе оставляем FREE.
          if (data.tier) {
            setTier(data.tier as UserTier);
          }
        }
      } catch (error) {
        console.error("Vibo: Ошибка связи с мозгом:", error);
      } finally {
        setIsLoading(false); // Загрузка завершена в любом случае
      }
    };

    initApp();
  }, []);

  // Блокировка Shark Advisor
  const isSharkLocked = tier === UserTier.FREE || tier === UserTier.SECRETARY;

  // Экран загрузки (пока ждем ответ от n8n)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-vibo-purple">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="text-gray-500 text-xs uppercase tracking-widest">Connecting to Neural Net...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-200 selection:bg-vibo-purple selection:text-white pb-24 md:pb-0">
      
      {/* ФОН */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-black">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vibo-purple/10 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vibo-green/5 blur-[120px] rounded-full"></div>
      </div>

      {/* ШАПКА */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-800 h-16 transition-all">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => setMode(AppMode.INVOICE)}>
             <div className="bg-gradient-to-tr from-vibo-purple to-blue-900 p-1.5 rounded shadow-[0_0_10px_rgba(188,19,254,0.5)]">
                <Zap size={18} className="text-white fill-white" />
             </div>
             <h1 className="text-lg font-bold tracking-tighter text-white">
               VIBO <span className="text-vibo-purple font-light hidden xs:inline">APP</span>
             </h1>
          </div>
          
          <div className={`text-[10px] font-mono px-3 py-1 rounded border uppercase tracking-widest flex items-center gap-2 ${
            tier === UserTier.CLOSER ? 'bg-vibo-green/10 text-vibo-green border-vibo-green/50' : 
            tier === UserTier.FREE ? 'bg-gray-800 text-gray-400 border-gray-700' : 
            'bg-vibo-purple/10 text-vibo-purple border-vibo-purple/50'
          }`}>
             <div className={`w-1.5 h-1.5 rounded-full ${tier === UserTier.FREE ? 'bg-gray-500' : 'bg-current animate-pulse'}`}></div>
             {tier}
          </div>
        </div>
      </header>

      {/* КОНТЕНТ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {mode === AppMode.INVOICE && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">Генератор Счетов</h2>
                <p className="text-gray-500 text-sm">Создавайте юридически чистые документы.</p>
             </div>
             {/* @ts-ignore */}
             <InvoiceGenerator /> 
          </div>
        )}

        {mode === AppMode.SHARK && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-vibo-green mb-1">Shark Advisor</h2>
                <p className="text-gray-500 text-sm">Агрессивный ментор для сделок.</p>
             </div>
             
             {isSharkLocked ? (
               <div className="flex flex-col items-center justify-center py-12 px-6 border border-gray-800 rounded-xl bg-gray-900/40 text-center backdrop-blur-sm">
                  <div className="bg-gray-800/50 p-6 rounded-full mb-6 relative">
                    <Lock size={48} className="text-gray-500" />
                    <div className="absolute top-0 right-0 p-2 bg-vibo-green rounded-full text-black">
                        <Zap size={12} fill="black" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Доступ ограничен</h3>
                  <p className="text-gray-400 mb-8 max-w-xs text-sm mx-auto">
                    Этот модуль доступен только на тарифах <b>Assistant</b> и <b>Closer</b>.
                  </p>
                  <button 
                    onClick={() => setMode(AppMode.PROFILE)}
                    className="px-8 py-3 rounded-lg font-bold uppercase bg-white text-black hover:bg-gray-200 shadow-lg transition-all text-sm tracking-wide"
                  >
                    Посмотреть тарифы
                  </button>
               </div>
             ) : (
               // @ts-ignore
               <SharkChat />
             )}
          </div>
        )}

        {mode === AppMode.PROFILE && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-white mb-6">Ваша подписка</h2>
              {/* @ts-ignore */}
              <UserProfile currentTier={tier} />
           </div>
        )}
      </main>

      {/* НИЖНЕЕ МЕНЮ (МОБИЛЬНОЕ) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-gray-800 pb-safe pt-2 px-2 flex justify-between items-center z-50 h-20 md:hidden">
         <button onClick={() => setMode(AppMode.INVOICE)} className={`flex flex-col items-center justify-center gap-1 w-1/3 h-full rounded-lg transition-colors ${mode === AppMode.INVOICE ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>
           <FileText size={24} strokeWidth={mode === AppMode.INVOICE ? 2.5 : 2} />
           <span className="text-[10px] font-bold uppercase tracking-wide">Счета</span>
         </button>

         <button onClick={() => setMode(AppMode.SHARK)} className={`flex flex-col items-center justify-center gap-1 w-1/3 h-full rounded-lg transition-colors ${mode === AppMode.SHARK ? 'text-vibo-green' : 'text-gray-600 hover:text-gray-400'}`}>
           <div className="relative">
             <MessageSquare size={24} strokeWidth={mode === AppMode.SHARK ? 2.5 : 2} />
             {isSharkLocked && <div className="absolute -top-1 -right-2 bg-gray-900 rounded-full p-[2px] border border-black"><Lock size={10} className="text-gray-400"/></div>}
           </div>
           <span className="text-[10px] font-bold uppercase tracking-wide">Advisor</span>
         </button>

         <button onClick={() => setMode(AppMode.PROFILE)} className={`flex flex-col items-center justify-center gap-1 w-1/3 h-full rounded-lg transition-colors ${mode === AppMode.PROFILE ? 'text-vibo-purple' : 'text-gray-600 hover:text-gray-400'}`}>
           <User size={24} strokeWidth={mode === AppMode.PROFILE ? 2.5 : 2} />
           <span className="text-[10px] font-bold uppercase tracking-wide">Профиль</span>
         </button>
      </nav>
    </div>
  );
};

export default App;
