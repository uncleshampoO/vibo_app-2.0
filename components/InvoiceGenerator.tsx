import React, { useState, useEffect } from 'react';
import { SellerProfile, BuyerProfile, InvoiceItem } from '../types';
import { Plus, Trash2, Briefcase, Building2, Loader2, Save, Eye, Sparkles, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { generateInvoiceHTML } from '../utils';
import { InvoicePreviewModal } from './InvoicePreviewModal';

// --- КОНФИГУРАЦИЯ N8N (PRODUCTION) ---
const N8N_GET_PROFILES_URL = 'https://viboteam.app.n8n.cloud/webhook/get-profiles';
const N8N_SAVE_PROFILE_URL = 'https://viboteam.app.n8n.cloud/webhook/save-profile';
const STORAGE_KEY = 'vibo_profiles_cache_v1';

interface InvoiceGeneratorProps {}

// --- КОМПОНЕНТ УВЕДОМЛЕНИЙ (TOAST) ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl animate-fade-in ${type === 'success' ? 'bg-green-900/90 text-white border border-green-500' : 'bg-red-900/90 text-white border border-red-500'}`}>
    {type === 'success' ? <CheckCircle size={20} className="text-green-400" /> : <AlertCircle size={20} className="text-red-400" />}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose}><X size={16} className="opacity-50 hover:opacity-100" /></button>
  </div>
);

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = () => {
  // 1. БЕЗОПАСНОЕ ОПРЕДЕЛЕНИЕ ID (ИСПРАВЛЕНО!)
  const [userId] = useState(() => {
    const tg = window.Telegram?.WebApp;
    const telegramId = tg?.initDataUnsafe?.user?.id?.toString();

    if (telegramId) {
        return telegramId; // Если мы в Телеграм - используем ID юзера
    }

    // Если мы в браузере - генерируем УНИКАЛЬНЫЙ ID для этого браузера
    // Чтобы ты и другие тестировщики не видели данные друг друга
    const localDebugId = localStorage.getItem('vibo_debug_id');
    if (localDebugId) return localDebugId;

    const newDebugId = 'browser_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('vibo_debug_id', newDebugId);
    return newDebugId;
  });

  // Состояния
  const [profiles, setProfiles] = useState<SellerProfile[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Состояние Счета
  const [invoiceNumber, setInvoiceNumber] = useState('1');
  const [date, setDate] = useState(new Date().toLocaleDateString('ru-RU'));
  const [buyer, setBuyer] = useState<BuyerProfile>({ name: '', inn: '', kpp: '', address: '' });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', name: 'Услуги по разработке ПО', quantity: 1, unit: 'шт', price: 0 }
  ]);
  
  const [invoiceStyle, setInvoiceStyle] = useState<'cyber' | 'classic'>('cyber');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const [tempProfile, setTempProfile] = useState<SellerProfile>({
    id: '', name: '', inn: '', kpp: '', bankName: '', bik: '', accountNumber: '', corrAccount: '', address: ''
  });

  // Хелпер для уведомлений
  const showToast = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 2. СИНХРОНИЗАЦИЯ С ОБЛАКОМ
  useEffect(() => {
    const syncProfiles = async () => {
      if (!userId) return;
      
      // Показываем лоадер только если локально совсем пусто
      if (profiles.length === 0) setIsLoading(true);

      try {
        console.log("Загрузка данных для ID:", userId);
        const response = await fetch(`${N8N_GET_PROFILES_URL}?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
             setProfiles(data);
             localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
             
             // Если активный не выбран - берем первый
             if (!activeProfileId) setActiveProfileId(data[0].id);
          } else {
             // Если n8n вернул пустоту (новый юзер) -> идем в создание
             if (profiles.length === 0) setIsEditingProfile(true);
          }
        }
      } catch (error) {
        console.error('Ошибка синхронизации (работаем оффлайн):', error);
      } finally {
        setIsLoading(false);
      }
    };
    syncProfiles();
  }, [userId]);

  // Логика маршрутизации (Создание vs Просмотр)
  useEffect(() => {
    if (!isLoading && profiles.length === 0 && !isEditingProfile) {
        setIsEditingProfile(true);
    }
    if (profiles.length > 0 && !activeProfileId) {
        setActiveProfileId(profiles[0].id);
    }
  }, [profiles, activeProfileId, isLoading]);

  // 3. УМНЫЙ SELECT (Обработчик)
  const handleProfileSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === 'ADD_NEW_PROFILE') {
          setTempProfile({ id: '', name: '', inn: '', kpp: '', bankName: '', bik: '', accountNumber: '', corrAccount: '', address: '' });
          setIsEditingProfile(true);
      } else {
          setActiveProfileId(value);
          setIsEditingProfile(false);
      }
  };

  // 4. СОХРАНЕНИЕ
  const handleSaveProfile = async () => {
    if (!tempProfile.name) {
        showToast("Введите название компании!", "error");
        return;
    }
    setIsSaving(true);
    const newId = tempProfile.id || Date.now().toString();
    const newProfile = { ...tempProfile, id: newId };

    // 1. Обновляем локально (Мгновенно)
    let updatedProfiles;
    if (tempProfile.id) {
      updatedProfiles = profiles.map(p => p.id === tempProfile.id ? newProfile : p);
    } else {
      updatedProfiles = [...profiles, newProfile];
    }
    setProfiles(updatedProfiles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfiles));
    setActiveProfileId(newId);

    // 2. Отправляем в облако (Фоном)
    try {
        await fetch(N8N_SAVE_PROFILE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, profile: newProfile })
        });
        showToast("Профиль сохранен!", "success");
    } catch (e) {
        console.error("Cloud save failed:", e);
        showToast("Сохранено на устройстве (нет сети)", "error");
    }

    setIsEditingProfile(false);
    setIsSaving(false);
    setTempProfile({ id: '', name: '', inn: '', kpp: '', bankName: '', bik: '', accountNumber: '', corrAccount: '', address: '' });
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  const addItem = () => setItems([...items, { id: Date.now().toString(), name: 'Новая позиция', quantity: 1, unit: 'шт', price: 0 }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handlePreview = () => {
    if (!activeProfile) {
      showToast("Сначала создайте компанию", "error");
      setIsEditingProfile(true);
      return;
    }
    const html = generateInvoiceHTML(activeProfile, buyer, items, invoiceNumber, date, invoiceStyle);
    setPreviewHtml(html);
    setShowPreview(true);
  };

  const whiteInputClass = "w-full p-3 rounded bg-white text-black border border-gray-300 focus:border-vibo-purple focus:outline-none placeholder:text-gray-400";

  // --- ЭКРАН 0: ЗАГРУЗКА ---
  if (isLoading && profiles.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-screen text-vibo-purple animate-pulse">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="text-white">Загрузка профиля...</p>
              <p className="text-[10px] text-gray-600 mt-2">ID: {userId}</p>
          </div>
      )
  }

  // --- ЭКРАН 1: РЕДАКТОР ---
  if (isEditingProfile) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-vibo-darkgray border border-vibo-purple rounded-lg animate-fade-in min-h-screen">
        {notification && <Toast message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
        
        <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2 border-b border-gray-700 pb-4">
          <Building2 className="text-vibo-purple" /> {tempProfile.id ? 'Редактировать' : 'Новая Компания'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Подсветка обязательного поля */}
           <input placeholder="Название ООО/ИП *" className={`${whiteInputClass} ${!tempProfile.name ? 'border-l-4 border-l-red-500' : ''}`} value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} />
           <input placeholder="ИНН" className={whiteInputClass} value={tempProfile.inn} onChange={e => setTempProfile({...tempProfile, inn: e.target.value})} />
           <input placeholder="КПП" className={whiteInputClass} value={tempProfile.kpp} onChange={e => setTempProfile({...tempProfile, kpp: e.target.value})} />
           <input placeholder="Название Банка" className={whiteInputClass} value={tempProfile.bankName} onChange={e => setTempProfile({...tempProfile, bankName: e.target.value})} />
           <input placeholder="БИК" className={whiteInputClass} value={tempProfile.bik} onChange={e => setTempProfile({...tempProfile, bik: e.target.value})} />
           <input placeholder="Расчетный счет" className={whiteInputClass} value={tempProfile.accountNumber} onChange={e => setTempProfile({...tempProfile, accountNumber: e.target.value})} />
           <input placeholder="Корр. счет" className={whiteInputClass} value={tempProfile.corrAccount} onChange={e => setTempProfile({...tempProfile, corrAccount: e.target.value})} />
           <input placeholder="URL Логотипа" className={whiteInputClass} value={tempProfile.logoUrl || ''} onChange={e => setTempProfile({...tempProfile, logoUrl: e.target.value})} />
           <textarea placeholder="Юр. Адрес" className={`${whiteInputClass} md:col-span-2 h-24`} value={tempProfile.address} onChange={e => setTempProfile({...tempProfile, address: e.target.value})} />
           <input placeholder="ФИО Директора" className={whiteInputClass} value={tempProfile.director || ''} onChange={e => setTempProfile({...tempProfile, director: e.target.value})} />
           <input placeholder="ФИО Бухгалтера" className={whiteInputClass} value={tempProfile.accountant || ''} onChange={e => setTempProfile({...tempProfile, accountant: e.target.value})} />
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-700">
          {profiles.length > 0 && (
              <button onClick={() => setIsEditingProfile(false)} className="px-6 py-2 rounded text-gray-400 hover:text-white">Отмена</button>
          )}
          <button onClick={handleSaveProfile} disabled={isSaving} className="bg-vibo-purple hover:bg-purple-600 text-white font-bold py-2 px-6 rounded flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-900/20">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    );
  }

  // --- ЭКРАН 2: ГЕНЕРАТОР ---
  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      {notification && <Toast message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
      
      <InvoicePreviewModal 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
        htmlContent={previewHtml}
        fileName={`Invoice-${invoiceNumber}`}
      />

      {/* Верхняя панель: Выбор компании */}
      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3 w-full">
            <div className="bg-vibo-green/10 p-2 rounded text-vibo-green"><Briefcase size={20} /></div>
            
            {/* 🔥 ВЫПАДАЮЩИЙ СПИСОК С КНОПКОЙ "ДОБАВИТЬ" ВНУТРИ */}
            <select 
                className="bg-black text-white p-3 rounded border border-gray-700 outline-none focus:border-vibo-green w-full font-bold cursor-pointer hover:border-gray-500 transition appearance-none"
                value={activeProfileId}
                onChange={handleProfileSelect}
            >
                <optgroup label="Ваши Компании">
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </optgroup>
                <optgroup label="Действия">
                    <option value="ADD_NEW_PROFILE">➕ Добавить новую компанию...</option>
                </optgroup>
            </select>
         </div>

         <button 
            onClick={() => { setTempProfile(activeProfile); setIsEditingProfile(true); }} 
            className="text-sm text-gray-400 hover:text-white hover:underline decoration-vibo-purple whitespace-nowrap"
         >
            ✎ Изменить
         </button>
      </div>

      {/* Форма Счета */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-800">
            <h3 className="text-vibo-purple font-bold mb-4 uppercase text-xs tracking-wider">Параметры</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-gray-500 uppercase ml-1">№ Счета</label><input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-vibo-purple outline-none" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase ml-1">Дата</label><input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-vibo-purple outline-none" /></div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700">
               <label className="text-[10px] text-gray-500 uppercase mb-2 block">Дизайн</label>
               <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => setInvoiceStyle('cyber')} className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-bold transition-all ${invoiceStyle === 'cyber' ? 'bg-vibo-purple text-white shadow-[0_0_10px_rgba(188,19,254,0.4)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}><Sparkles size={14} /> Cyber</button>
                 <button onClick={() => setInvoiceStyle('classic')} className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-bold transition-all ${invoiceStyle === 'classic' ? 'bg-white text-black shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}><FileText size={14} /> Print</button>
               </div>
            </div>
          </div>

          <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-800">
            <h3 className="text-vibo-green font-bold mb-4 uppercase text-xs tracking-wider">Клиент</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Название Клиента" value={buyer.name} onChange={e => setBuyer({...buyer, name: e.target.value})} className="w-full bg-black border border-gray-700 rounded p-2 text-white placeholder-gray-600 focus:border-vibo-green outline-none" />
              <input type="text" placeholder="ИНН" value={buyer.inn} onChange={e => setBuyer({...buyer, inn: e.target.value})} className="w-full bg-black border border-gray-700 rounded p-2 text-white placeholder-gray-600 focus:border-vibo-green outline-none" />
              <textarea placeholder="Адрес" value={buyer.address} onChange={e => setBuyer({...buyer, address: e.target.value})} className="w-full bg-black border border-gray-700 rounded p-2 text-white placeholder-gray-600 focus:border-vibo-green outline-none h-20 resize-none" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
           <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-800 min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold uppercase text-sm tracking-wider">Позиции</h3>
                <button onClick={addItem} className="flex items-center text-xs bg-vibo-purple/20 text-vibo-purple border border-vibo-purple/50 px-3 py-1.5 rounded-full hover:bg-vibo-purple hover:text-white transition-all"><Plus size={14} className="mr-1"/> Добавить</button>
              </div>
              <div className="space-y-3 flex-grow">
                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-black p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition group">
                    <div className="col-span-1 text-gray-500 text-xs text-center font-mono bg-gray-900 rounded py-1">{idx + 1}</div>
                    <div className="col-span-5"><input className="bg-transparent text-white w-full outline-none placeholder-gray-700 text-sm" placeholder="Услуга/Товар" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} /></div>
                    <div className="col-span-2"><input type="number" className="bg-transparent text-center text-vibo-green w-full outline-none text-sm font-mono bg-green-900/10 rounded" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} /></div>
                    <div className="col-span-3"><input type="number" className="bg-transparent text-right text-white w-full outline-none font-mono text-sm" value={item.price} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} /></div>
                    <div className="col-span-1 text-right"><button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-500 transition p-1"><Trash2 size={14} /></button></div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-700 flex justify-between items-end">
                  <div className="text-gray-500 text-xs uppercase tracking-widest">Итого</div>
                  <div className="text-3xl font-mono text-vibo-green font-bold shadow-green-glow">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}</div>
              </div>
           </div>
           
           <button 
             onClick={handlePreview} 
             disabled={!activeProfile}
             className={`w-full py-4 font-bold uppercase tracking-widest rounded-xl shadow-xl transition duration-300 flex justify-center items-center gap-3 active:scale-95 ${!activeProfile ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' : 'bg-white text-black hover:bg-gray-200'}`}
           >
             <Eye size={20} /> Просмотреть и Отправить
           </button>
        </div>
      </div>
      
      {/* DEBUG ID - Внизу страницы для теста */}
      <div className="text-center mt-10 text-[10px] text-gray-700 font-mono select-all pb-4">
         User ID: {userId}
      </div>
    </div>
  );
};

export default InvoiceGenerator;
