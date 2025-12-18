import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';

// 👇 ТВОЯ ССЫЛКА НА ВЕБХУК (Лучше использовать Production без -test)
const CHAT_WEBHOOK_URL = 'https://viboteam.app.n8n.cloud/webhook-test/vibo-chat';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'shark';
  timestamp: Date;
}

const SharkChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Слушай сюда. Я — Shark Advisor. Я здесь не для того, чтобы вытирать тебе сопли. Какая у тебя проблема? Клиент не платит? Боишься назвать цену? Говори.",
      sender: 'shark',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. 👇 НОВОЕ: Получаем ID пользователя (или ставим 'guest', если не в Телеграме)
  // @ts-ignore
  const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest_user';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. 👇 ИСПРАВЛЕНО: Отправляем session_id вместе с сообщением
      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.text,
          session_id: tgUserId.toString() // <-- ВОТ ЭТОГО НЕ ХВАТАЛО
        }),
      });

      if (!response.ok) throw new Error('Ошибка сети');

      const data = await response.json();
      
      const sharkMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.output || "...", 
        sender: 'shark',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, sharkMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Связь прервана. Акула ушла на обед.",
        sender: 'shark',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm relative shadow-2xl">
      <div className="p-4 bg-black/80 border-b border-gray-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
           <div className="bg-vibo-green/10 p-2 rounded-full border border-vibo-green/20 shadow-[0_0_10px_rgba(57,255,20,0.2)]">
             <Bot size={20} className="text-vibo-green" />
           </div>
           <div>
             <h3 className="font-bold text-white text-sm tracking-wide">SHARK ADVISOR <span className="text-vibo-purple">AI</span></h3>
             <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-vibo-green rounded-full animate-pulse shadow-[0_0_5px_#39ff14]"></span>
               <span className="text-[10px] text-gray-400 uppercase tracking-wider">Online</span>
             </div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed relative ${
                msg.sender === 'user'
                  ? 'bg-vibo-purple text-white rounded-tr-none shadow-[0_5px_15px_rgba(188,19,254,0.2)]'
                  : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700 shadow-lg'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
             <div className="bg-gray-800/50 border border-gray-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-vibo-green" />
                <span className="text-xs text-vibo-green font-mono tracking-widest">ANALYZING...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-black/90 border-t border-gray-800 z-10">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Задай вопрос..."
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3.5 pl-4 pr-12 focus:outline-none focus:border-vibo-green/50 focus:shadow-[0_0_20px_rgba(57,255,20,0.1)] transition-all placeholder:text-gray-600 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-vibo-green text-black rounded-lg hover:bg-green-400 transition-all transform active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharkChat;
