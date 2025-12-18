import React, { useState, useEffect } from 'react';
import { AppMode, UserTier } from './types';
import InvoiceGenerator from './components/InvoiceGenerator';
import SharkChat from './components/SharkChat';
import UserProfile from './components/UserProfile';
import { FileText, MessageSquare, Zap, User, Lock } from 'lucide-react';

const WEBHOOK_URL = 'https://viboteam.app.n8n.cloud/webhook-test/vibo-init';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.INVOICE);
  const [tier, setTier] = useState<UserTier>(UserTier.FREE);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      // Fetch dynamic telegram user ID or fallback to test ID
      const telegramId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const finalUserId = telegramId || 123456;

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: finalUserId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Vibo Init Response for User:', finalUserId, data);

        // Update tier if it's provided in the response and matches our enum
        if (data.tier && Object.values(UserTier).includes(data.tier as UserTier)) {
          setTier(data.tier as UserTier);
        }
        
        if (data.message) {
          console.log('Message from n8n:', data.message);
        }
      } catch (error) {
        console.error('Failed to initialize user via n8n:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeUser();
  }, []);

  const isSharkLocked = tier === UserTier.FREE || tier === UserTier.SECRETARY;

  const handleUpgrade = (newTier: UserTier) => {
    // In a real app, this would trigger a payment or API call
    setTier(newTier);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-gradient-to-tr from-vibo-purple to-blue-600 p-3 rounded-xl animate-pulse shadow-[0_0_30px_rgba(188,19,254,0.3)]">
            <Zap size={40} className="text-white fill-white" />
          </div>
          <div className="text-center">
             <p className="text-vibo-purple font-mono text-sm tracking-widest animate-pulse">INITIALIZING VIBO_SYS...</p>
             <p className="text-[10px] text-gray-700 mt-2 font-mono">ESTABLISHING SECURE CONNECTION</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-200 selection:bg-vibo-purple selection:text-white pb-24 md:pb-0">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-black">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vibo-purple/10 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vibo-green/5 blur-[120px] rounded-full"></div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/70 border-b border-gray-800 h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-gradient-to-tr from-vibo-purple to-blue-600 p-1.5 rounded shadow-[0_0_10px_rgba(188,19,254,0.5)]">
                <Zap size={20} className="text-white fill-white" />
             </div>
             <h1 className="text-xl font-bold tracking-tighter text-white">
               VIBO <span className="text-vibo-purple font-light">ASSISTANT</span>
             </h1>
          </div>

          <nav className="hidden md:flex bg-gray-900/50 p-1 rounded-lg border border-gray-800">
             <button 
               onClick={() => setMode(AppMode.INVOICE)}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                 mode === AppMode.INVOICE 
                 ? 'bg-vibo-purple text-white shadow-[0_0_10px_rgba(188,19,254,0.4)]' 
                 : 'text-gray-400 hover:text-white'
               }`}
             >
               <FileText size={16} />
               СЧЕТА
             </button>
             <button 
               onClick={() => setMode(AppMode.SHARK)}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                 mode === AppMode.SHARK
                 ? 'bg-vibo-green text-black shadow-[0_0_10px_rgba(57,255,20,0.4)]' 
                 : 'text-gray-400 hover:text-white'
               }`}
             >
               <MessageSquare size={16} />
               SHARK {isSharkLocked && <Lock size={12} className="ml-0.5 opacity-60" />}
             </button>
             <button 
               onClick={() => setMode(AppMode.PROFILE)}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                 mode === AppMode.PROFILE
                 ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
                 : 'text-gray-400 hover:text-white'
               }`}
             >
               <User size={16} />
               ПРОФИЛЬ
             </button>
          </nav>
          
          <div className="text-[10px] font-mono px-2 py-1 rounded bg-gray-900 text-vibo-green border border-gray-700 uppercase tracking-widest shadow-[0_0_5px_rgba(57,255,20,0.2)]">
             {tier}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {mode === AppMode.INVOICE && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Генератор Счетов</h2>
                <p className="text-gray-500 text-sm">Создавайте профессиональные документы за пару кликов.</p>
             </div>
             <InvoiceGenerator /> 
          </div>
        )}

        {mode === AppMode.SHARK && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-vibo-green mb-1 tracking-tight">Shark Advisor</h2>
                <p className="text-gray-500 text-sm">Агрессивный ИИ-ментор для закрытия ваших сделок.</p>
             </div>
             
             {isSharkLocked ? (
               <div className="flex flex-col items-center justify-center py-20 px-6 border border-gray-800 rounded-xl bg-gray-900/40 text-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                  <div className="bg-gray-800 p-6 rounded-full mb-6 border border-gray-700 shadow-[0_0_20px_rgba(57,255,20,0.1)]">
                    <Lock size={48} className="text-vibo-green" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Доступ ограничен</h3>
                  <p className="text-gray-400 mb-8 max-w-sm text-sm leading-relaxed">
                    Для общения с Shark Advisor необходим тариф <b>Assistant</b> или выше. Улучшите план, чтобы получить преимущество в переговорах.
                  </p>
                  <button 
                    onClick={() => setMode(AppMode.PROFILE)}
                    className="px-8 py-3 rounded-lg font-bold uppercase bg-vibo-green text-black hover:bg-green-400 shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-all active:scale-95"
                  >
                    Разблокировать доступ
                  </button>
               </div>
             ) : (
               <SharkChat />
             )}
          </div>
        )}

        {mode === AppMode.PROFILE && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Настройки подписки</h2>
              <UserProfile currentTier={tier} onUpgrade={handleUpgrade} />
           </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-gray-800 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-20 md:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
         <button onClick={() => setMode(AppMode.INVOICE)} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${mode === AppMode.INVOICE ? 'text-vibo-purple' : 'text-gray-500'}`}>
           <FileText size={22} />
           <span className="text-[10px] font-bold uppercase tracking-tighter">Счета</span>
         </button>

         <button onClick={() => setMode(AppMode.SHARK)} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${mode === AppMode.SHARK ? 'text-vibo-green' : 'text-gray-500'}`}>
           <div className="relative">
             <MessageSquare size={22} />
             {isSharkLocked && <div className="absolute -top-1 -right-2 bg-black rounded-full p-[2px] border border-gray-800 shadow-sm"><Lock size={10} className="text-vibo-green"/></div>}
           </div>
           <span className="text-[10px] font-bold uppercase tracking-tighter">Advisor</span>
         </button>

         <button onClick={() => setMode(AppMode.PROFILE)} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${mode === AppMode.PROFILE ? 'text-blue-500' : 'text-gray-500'}`}>
           <User size={22} />
           <span className="text-[10px] font-bold uppercase tracking-tighter">Профиль</span>
         </button>
      </nav>

      <style>{`
        .input-cyber {
           background-color: #000;
           color: #fff;
           border: 1px solid #333;
           padding: 10px 12px;
           border-radius: 4px;
           outline: none;
           transition: all 0.2s;
           font-size: 14px;
        }
        .input-cyber:focus {
           border-color: #bc13fe;
           box-shadow: 0 0 8px rgba(188,19,254,0.2);
        }
        .btn-primary {
           background-color: #bc13fe;
           color: white;
           padding: 10px 20px;
           border-radius: 4px;
           font-weight: bold;
           text-transform: uppercase;
           letter-spacing: 1px;
           transition: all 0.2s;
        }
        .btn-primary:hover {
           background-color: #9d0fd3;
           box-shadow: 0 0 15px rgba(188,19,254,0.4);
        }
      `}</style>
    </div>
  );
};

export default App;