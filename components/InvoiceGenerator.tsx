import React, { useState, useEffect } from 'react';
import { SellerProfile, BuyerProfile, InvoiceItem } from '../types';
import { Plus, Trash2, Printer, Briefcase, Building2, Loader2, Save, Eye, FileText, Sparkles } from 'lucide-react';
import { generateInvoiceHTML } from '../utils';
import { InvoicePreviewModal } from './InvoicePreviewModal'; // Импортируем модалку

// --- КОНФИГУРАЦИЯ N8N (PRODUCTION) ---
const N8N_GET_PROFILES_URL = 'https://viboteam.app.n8n.cloud/webhook/get-profiles'; 
const N8N_SAVE_PROFILE_URL = 'https://viboteam.app.n8n.cloud/webhook/save-profile';

interface InvoiceGeneratorProps {}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = () => {
  // 1. ПОЛУЧАЕМ ID ПОЛЬЗОВАТЕЛЯ TELEGRAM
  const tg = window.Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id?.toString() || 'test-user-id';

  // Состояния данных
  const [profiles, setProfiles] = useState<SellerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Состояние Счета
  const [invoiceNumber, setInvoiceNumber] = useState('1');
  const [date, setDate] = useState(new Date().toLocaleDateString('ru-RU'));
  const [buyer, setBuyer] = useState<BuyerProfile>({ name: '', inn: '', kpp: '', address: '' });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', name: 'Услуги по разработке ПО', quantity: 1, unit: 'шт', price: 0 }
  ]);
  
  // 🔥 НОВОЕ: Состояние стиля и превью
  const [invoiceStyle, setInvoiceStyle] = useState<'cyber' | 'classic'>('cyber');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // Временный профиль
  const [tempProfile, setTempProfile] = useState<SellerProfile>({
    id: '', name: '', inn: '', kpp: '', bankName: '', bik: '', accountNumber: '', corrAccount: '', address: ''
  });

  // ЗАГРУЗКА
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${N8N_GET_PROFILES_URL}?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setProfiles(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfiles();
  }, [userId]);

  useEffect(() => {
    if (profiles.length > 0 && !activeProfileId) setActiveProfileId(profiles[0].id);
    if (!isLoading && profiles.length === 0 && !isEditingProfile) setIsEditingProfile(true); 
  }, [profiles, activeProfileId, isLoading, isEditingProfile]);

  // СОХРАНЕНИЕ
  const handleSaveProfile = async () => {
    if (!tempProfile.name) return;
    setIsSaving(true);
    const newId = tempProfile.id || Date.now().toString();
    const newProfile = { ...tempProfile, id: newId };

    if (tempProfile.id) {
      setProfiles(prev => prev.map(p => p.id === tempProfile.id ? newProfile : p));
    } else {
      setProfiles(prev => [...prev, newProfile]);
    }
    
    try {
        await fetch(N8N_SAVE_PROFILE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, profile: newProfile })
        });
    } catch (e) {
        console.error("Cloud save error", e);
    }
    setActiveProfileId(newProfile.id);
    setIsEditingProfile(false);
    setIsSaving(false);
    setTempProfile({ id: '', name: '', inn: '', kpp: '', bankName: '', bik: '', accountNumber: '', corrAccount: '', address: '' });
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  const addItem = () => setItems([...items, { id: Date.now().toString(), name: 'Новая позиция', quantity: 1, unit: 'шт', price: 0 }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

  // 🔥 ОБНОВЛЕННАЯ ГЕНЕРАЦИЯ (Вместо window.open открываем модалку)
  const handlePreview = () => {
    if (!activeProfile) {
      alert("Сначала создайте профиль компании!");
      return;
    }
    // Генерируем HTML с выбранным стилем
    const html = generateInvoiceHTML(activeProfile, buyer, items, invoiceNumber, date, invoiceStyle);
    setPreviewHtml(html);
    setShowPreview(true); // Открываем модалку
  };

  const whiteInputClass = "w-full p-3 rounded bg-white text-black border border-gray-300 focus:border-vibo-purple focus:outline-none placeholder:text-gray-400";

  if (isLoading) return <div className="flex flex-col items-center justify-center h-64 text-vibo-purple animate-pulse"><Loader2 className="w-10 h-10 animate-spin mb-2" /><p>Загрузка...</p></div>;

  // РЕДАКТИРОВАНИЕ
  if (isEditingProfile || profiles.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-vibo-darkgray border border-vibo-purple rounded-lg animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2 border-b border-gray-700 pb-4">
          <Building2 className="text-vibo-purple" /> {tempProfile.id ? 'Редактировать Компанию' : 'Новая Компания'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input placeholder="Название ООО/ИП" className={whiteInputClass} value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} />
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
          {profiles.length > 0 && <button onClick={() => setIsEditingProfile(false)} className="px-6 py-2 rounded text-gray-400 hover:text-white">Отмена</button>}
          <button onClick={handleSaveProfile} disabled={isSaving} className="bg-vibo-purple hover:bg-purple-600 text-white font-bold py-2 px-6 rounded flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    );
  }

  // ОСНОВНОЙ ЭКРАН
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Модальное окно предпросмотра */}
      <InvoicePreviewModal 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
        htmlContent={previewHtml}
        fileName={`Invoice-${invoiceNumber}`}
      />

      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
        <div className="flex items-center gap-3 w-full md:w-auto mb-4 md:mb-0">
           <div className="bg-vibo-green/10 p-2 rounded text-vibo-green"><Briefcase size={20} /></div>
           <select className="bg-black text-white p-2 rounded border border-gray-700 outline-none focus:border-vibo-green w-full md:w-64" value={activeProfileId} onChange={(e) => setActiveProfileId(e.target.value)}>
             {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setTempProfile(activeProfile); setIsEditingProfile(true); }} className="text-sm text-gray-400 hover:text-white hover:underline decoration-vibo-purple">Изменить реквизиты</button>
          <button onClick={() => { setTempProfile({ id: '', name: '', inn: '', kpp: '', bankName: '', bik: '', accountNumber: '', corrAccount: '', address: '' }); setIsEditingProfile(true); }} className="text-sm text-vibo-green hover:text-green-400 font-bold">+ Новая</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-800">
            <h3 className="text-vibo-purple font-bold mb-4 uppercase text-xs tracking-wider">Параметры Счета</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-gray-500 uppercase ml-1">№ Счета</label><input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-vibo-purple outline-none" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase ml-1">Дата</label><input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-vibo-purple outline-none" /></div>
            </div>
            
            {/* 🔥 ВЫБОР СТИЛЯ */}
            <div className="mt-6 pt-4 border-t border-gray-700">
               <label className="text-[10px] text-gray-500 uppercase mb-2 block">Стиль Документа</label>
               <div className="grid grid-cols-2 gap-2">
                 <button 
                   onClick={() => setInvoiceStyle('cyber')}
                   className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-bold transition-all ${invoiceStyle === 'cyber' ? 'bg-vibo-purple text-white shadow-[0_0_10px_rgba(188,19,254,0.4)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                 >
                   <Sparkles size={14} /> Vibo Cyber
                 </button>
                 <button 
                   onClick={() => setInvoiceStyle('classic')}
                   className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-bold transition-all ${invoiceStyle === 'classic' ? 'bg-white text-black shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                 >
                   <FileText size={14} /> Классика
                 </button>
               </div>
            </div>
          </div>

          <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-800">
            <h3 className="text-vibo-green font-bold mb-4 uppercase text-xs tracking-wider">Покупатель (Клиент)</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Название Клиента" value={buyer.name} onChange={e => setBuyer({...buyer, name: e.target.value})} className="w-full bg-black border border-gray-700 rounded p-2 text-white placeholder-gray-600 focus:border-vibo-green outline-none" />
              <input type="text" placeholder="ИНН" value={buyer.inn} onChange={e => setBuyer({...buyer, inn: e.target.value})} className="w-full bg-black border border-gray-700 rounded p-2 text-white placeholder-gray-600 focus:border-vibo-green outline-none" />
              <textarea placeholder="Адрес покупателя" value={buyer.address} onChange={e => setBuyer({...buyer, address: e.target.value})} className="w-full bg-black border border-gray-700 rounded p-2 text-white placeholder-gray-600 focus:border-vibo-green outline-none h-20 resize-none" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
           <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-800 min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold uppercase text-sm tracking-wider">Позиции в счете</h3>
                <button onClick={addItem} className="flex items-center text-xs bg-vibo-purple/20 text-vibo-purple border border-vibo-purple/50 px-3 py-1.5 rounded-full hover:bg-vibo-purple hover:text-white transition-all"><Plus size={14} className="mr-1"/> Добавить</button>
              </div>
              <div className="space-y-3 flex-grow">
                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-black p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition group">
                    <div className="col-span-1 text-gray-500 text-xs text-center font-mono bg-gray-900 rounded py-1">{idx + 1}</div>
                    <div className="col-span-5"><input className="bg-transparent text-white w-full outline-none placeholder-gray-700 text-sm" placeholder="Название" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} /></div>
                    <div className="col-span-2"><input type="number" className="bg-transparent text-center text-vibo-green w-full outline-none text-sm font-mono bg-green-900/10 rounded" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} /></div>
                    <div className="col-span-3"><input type="number" className="bg-transparent text-right text-white w-full outline-none font-mono text-sm" value={item.price} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} /></div>
                    <div className="col-span-1 text-right"><button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-500 transition p-1"><Trash2 size={14} /></button></div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-700 flex justify-between items-end">
                  <div className="text-gray-500 text-xs uppercase tracking-widest">Итого к оплате</div>
                  <div className="text-3xl font-mono text-vibo-green font-bold shadow-green-glow">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}</div>
              </div>
           </div>
           
           <button onClick={handlePreview} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 shadow-xl transition duration-300 flex justify-center items-center gap-3 active:scale-95">
             <Eye size={20} /> Просмотреть и Отправить
           </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
