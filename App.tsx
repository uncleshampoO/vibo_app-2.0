import React, { useState, useEffect } from 'react';
import { AppMode, UserTier } from './types';
import InvoiceGenerator from './components/InvoiceGenerator';
import SharkChat from './components/SharkChat';
import UserProfile from './components/UserProfile';
import { FileText, MessageSquare, Zap, User, Lock, Loader2 } from 'lucide-react';

// 👇 ТВОЙ WEBHOOK URL (Оставляем твой правильный)
const WEBHOOK_URL = 'https://viboteam.app.n8n.cloud/webhook/vibo-init';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.INVOICE);
  const [tier, setTier] = useState<UserTier>(UserTier.FREE); 
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const initApp = async () => {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      let userId = 123456; 

      if (tg) {
        tg.expand();
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#000000');
        if (tg.initDataUnsafe?.user) {
          userId = tg.initDataUnsafe.user.id;
        }
      }

      console.log("Vibo: Connecting UserID:", userId);

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.tier) {
            setTier(data.tier as UserTier);
          }
        }
      } catch (error) {
        console.error("Vibo Error:", error);
      } finally {
        setIsLoading(false); 
      }
    };

    initApp();
  }, []);

  const isSharkLocked = tier === UserTier.FREE || tier === UserTier.SECRETARY;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-vibo-purple">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="text-gray-500 text-xs uppercase tracking-widest">LOADING VIBO OS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-200 bg-black pb-24 md:pb-0">
      
      {/* ФОН */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-900/10 blur-[120px] rounded-full"></div>
      </div>

      {/* ШАПКА (HEADER) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-800 h-16 transition-all">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Логотип */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode(AppMode.INVOICE)}>
             <div className="bg-gradient-to-tr from-purple-600 to-blue-900 p-1.5 rounded shadow-[0_0_10px_rgba(188,19,254,0.5)]">
                <Zap size={18} className="text-white fill-white" />
             </div>
             <h1 className="text-lg font-bold tracking-tighter text-white">
               VIBO <span className="text-purple-500 font-light hidden xs:inline">APP</span>
             </h1>
          </div>

          {/* 🖥️ НОВОЕ: МЕНЮ ДЛЯ КОМПЬЮТЕРА (Вот чего не хватало!) */}
          <nav className="hidden md:flex bg-gray-900/50 p-1 rounded-lg border border-gray-800 absolute left-1/2 transform -translate-x-1/2">
             <button onClick={() => setMode(AppMode.INVOICE)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === AppMode.INVOICE ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
               Счета
             </button>
             <button onClick={() => setMode(AppMode.SHARK)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === AppMode.SHARK ? 'bg-green-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>
               Shark Advisor
             </button>
             <button onClick={() => setMode(AppMode.PROFILE)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === AppMode.PROFILE ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
               Профиль
             </button>
          </nav>
          
          {/* Статус Тарифа */}
          <div className={`text-[10px] font-mono px-3 py-1 rounded border uppercase tracking-widest flex items-center gap-2 ${
            tier === UserTier.CLOSER ? 'bg-green-900/20 text-green-400 border-green-500/30' : 
            'bg-gray-800 text-gray-400 border-gray-700'
          }`}>
             <div className={`w-1.5 h-1.5 rounded-full ${tier === UserTier.FREE ? 'bg-gray-500' : 'bg-current animate-pulse'}`}></div>
             {tier}
          </div>
        </div>
      </header>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        
        {mode === AppMode.INVOICE && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* @ts-ignore */}
             <InvoiceGenerator /> 
          </div>
        )}

        {mode === AppMode.SHARK && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {isSharkLocked ? (
               <div className="flex flex-col items-center justify-center py-12 px-6 border border-gray-800 rounded-xl bg-gray-900/40 text-center mt-10">
                  <Lock size={48} className="text-gray-500 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Доступ закрыт</h3>
                  <p className="text-gray-400 mb-6 text-sm">Advisor доступен только для Клоузеров.</p>
                  <button onClick={() => setMode(AppMode.PROFILE)} className="px-6 py-2 bg-white text-black rounded font-bold uppercase hover:bg-gray-200">
                    Открыть доступ
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
              {/* @ts-ignore */}
              <UserProfile currentTier={tier} />
           </div>
        )}
      </main>

      {/* 📱 МЕНЮ ДЛЯ ТЕЛЕФОНА (Остается как было) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-gray-800 pb-safe pt-2 px-2 flex justify-between items-center z-50 h-20 md:hidden">
         <button onClick={() => setMode(AppMode.INVOICE)} className={`flex flex-col items-center justify-center gap-1 w-1/3 h-full ${mode === AppMode.INVOICE ? 'text-white' : 'text-gray-600'}`}>
           <FileText size={24} strokeWidth={mode === AppMode.INVOICE ? 2.5 : 2} />
           <span className="text-[10px] font-bold uppercase">Счета</span>
         </button>

         <button onClick={() => setMode(AppMode.SHARK)} className={`flex flex-col items-center justify-center gap-1 w-1/3 h-full ${mode === AppMode.SHARK ? 'text-green-400' : 'text-gray-600'}`}>
           <MessageSquare size={24} strokeWidth={mode === AppMode.SHARK ? 2.5 : 2} />
           <span className="text-[10px] font-bold uppercase">Advisor</span>
         </button>

         <button onClick={() => setMode(AppMode.PROFILE)} className={`flex flex-col items-center justify-center gap-1 w-1/3 h-full ${mode === AppMode.PROFILE ? 'text-purple-500' : 'text-gray-600'}`}>
           <User size={24} strokeWidth={mode === AppMode.PROFILE ? 2.5 : 2} />
           <span className="text-[10px] font-bold uppercase">Профиль</span>
         </button>
      </nav>

    </div>
  );
};

export default App;
