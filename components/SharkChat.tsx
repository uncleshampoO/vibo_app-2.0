import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendMessageToShark } from '../services/geminiService';
import { Send, Zap, AlertTriangle } from 'lucide-react';

const SharkChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToShark(history, input);
      setHistory(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      setHistory(prev => [...prev, { role: 'model', text: "Shark is offline. Check your connection.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-vibo-darkgray rounded-lg border border-gray-800 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="bg-black p-4 border-b border-gray-800 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <h2 className="text-white font-bold tracking-widest uppercase text-sm">Vibo Shark <span className="text-gray-600 text-xs normal-case ml-2">// Online Advisor</span></h2>
         </div>
         <div className="text-xs text-gray-500">NO MERCY MODE</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
         {history.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
             <Zap size={48} className="mb-4 text-vibo-purple" />
             <p className="text-center max-w-md">
               Shark готов. Спроси про сложного клиента, возражение "Дорого", или как закрыть сделку. 
               <br/><span className="text-xs mt-2 block">Не ной. Действуй.</span>
             </p>
           </div>
         )}
         
         {history.map((msg, idx) => (
           <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-xl relative ${
               msg.role === 'user' 
                 ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 rounded-tr-none border border-gray-700' 
                 : 'bg-black text-vibo-green border border-vibo-green/30 rounded-tl-none shadow-[0_0_15px_rgba(57,255,20,0.1)]'
             }`}>
                {msg.isError && <AlertTriangle className="inline mr-2 text-red-500" size={16} />}
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {msg.text}
                </div>
                {msg.role === 'model' && (
                  <div className="absolute -bottom-5 left-0 text-[10px] text-gray-600 uppercase font-bold tracking-widest">Vibo Shark System</div>
                )}
             </div>
           </div>
         ))}
         
         {isLoading && (
            <div className="flex justify-start">
              <div className="bg-black border border-gray-800 px-4 py-3 rounded-xl rounded-tl-none">
                 <div className="flex gap-1">
                   <div className="w-2 h-2 bg-vibo-purple rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-vibo-purple rounded-full animate-bounce delay-100"></div>
                   <div className="w-2 h-2 bg-vibo-purple rounded-full animate-bounce delay-200"></div>
                 </div>
              </div>
            </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black border-t border-gray-800">
        <div className="relative flex items-center gap-2">
           <textarea 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Опиши ситуацию. Будь краток..."
             className="w-full bg-vibo-darkgray text-white p-3 pr-12 rounded-lg border border-gray-700 focus:border-vibo-purple outline-none resize-none h-14 custom-scrollbar transition-colors"
           />
           <button 
             onClick={handleSend}
             disabled={isLoading || !input.trim()}
             className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-vibo-purple text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
           >
             <Send size={18} />
           </button>
        </div>
        <div className="text-[10px] text-gray-600 mt-2 text-center">
          CONFIDENTIAL. AI GENERATED ADVICE. USE AT OWN RISK.
        </div>
      </div>
    </div>
  );
};

export default SharkChat;