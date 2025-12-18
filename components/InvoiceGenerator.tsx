import React, { useState, useEffect } from 'react';
import { SellerProfile, BuyerProfile, InvoiceItem } from '../types';
import { Plus, Trash2, Printer, Briefcase, ChevronDown } from 'lucide-react';
import { generateInvoiceHTML } from '../utils';

interface InvoiceGeneratorProps {
  // empty props
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = () => {
  // State for Profiles
  const [profiles, setProfiles] = useState<SellerProfile[]>(() => {
    const saved = localStorage.getItem('vibo_seller_profiles');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Invoice State
  const [invoiceNumber, setInvoiceNumber] = useState('1');
  const [date, setDate] = useState(new Date().toLocaleDateString('ru-RU'));
  const [buyer, setBuyer] = useState<BuyerProfile>({ name: '', inn: '', kpp: '', address: '' });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', name: 'Услуги по разработке ПО', quantity: 1, unit: 'шт', price: 0 }
  ]);

  // Temporary profile state for editing
  const [tempProfile, setTempProfile] = useState<SellerProfile>({
    id: '', name: '', inn: '', kpp: '', bankName: '', bik: '', accountNumber: '', corrAccount: '', address: ''
  });

  useEffect(() => {
    localStorage.setItem('vibo_seller_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (profiles.length > 0 && !activeProfileId) {
      setActiveProfileId(profiles[0].id);
    }
    if (profiles.length === 0) {
      setIsEditingProfile(true); // Force creation if empty
    }
  }, [profiles, activeProfileId]);

  const handleSaveProfile = () => {
    if (!tempProfile.name) return;
    const newProfile = { ...tempProfile, id: tempProfile.id || Date.now().toString() };
    
    if (tempProfile.id) {
      setProfiles(prev => prev.map(p => p.id === tempProfile.id ? newProfile : p));
    } else {
      setProfiles(prev => [...prev, newProfile]);
    }
    setActiveProfileId(newProfile.id);
    setIsEditingProfile(false);
    setTempProfile({ id: '', name: '', inn: '', kpp: '', bankName: '', bik: '', accountNumber: '', corrAccount: '', address: '' });
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: 'Новая позиция', quantity: 1, unit: 'шт', price: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleGenerate = () => {
    if (!activeProfile) {
      alert("Сначала создайте профиль компании!");
      return;
    }
    const html = generateInvoiceHTML(activeProfile, buyer, items, invoiceNumber, date);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (isEditingProfile || profiles.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-vibo-darkgray border border-vibo-purple rounded-lg shadow-[0_0_15px_rgba(188,19,254,0.3)]">
        <h2 className="text-2xl font-bold text-vibo-purple mb-6 uppercase tracking-widest flex items-center">
          <Briefcase className="mr-2" /> 
          {tempProfile.id ? 'Редактировать Компанию' : 'Новая Компания'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input placeholder="Название ООО/ИП" className="input-cyber" value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} />
           <input placeholder="ИНН" className="input-cyber" value={tempProfile.inn} onChange={e => setTempProfile({...tempProfile, inn: e.target.value})} />
           <input placeholder="КПП" className="input-cyber" value={tempProfile.kpp} onChange={e => setTempProfile({...tempProfile, kpp: e.target.value})} />
           <input placeholder="Название Банка" className="input-cyber" value={tempProfile.bankName} onChange={e => setTempProfile({...tempProfile, bankName: e.target.value})} />
           <input placeholder="БИК" className="input-cyber" value={tempProfile.bik} onChange={e => setTempProfile({...tempProfile, bik: e.target.value})} />
           <input placeholder="Расчетный счет" className="input-cyber" value={tempProfile.accountNumber} onChange={e => setTempProfile({...tempProfile, accountNumber: e.target.value})} />
           <input placeholder="Корр. счет" className="input-cyber" value={tempProfile.corrAccount} onChange={e => setTempProfile({...tempProfile, corrAccount: e.target.value})} />
           <input placeholder="URL Логотипа" className="input-cyber" value={tempProfile.logoUrl || ''} onChange={e => setTempProfile({...tempProfile, logoUrl: e.target.value})} />
           <textarea placeholder="Юр. Адрес" className="input-cyber md:col-span-2" value={tempProfile.address} onChange={e => setTempProfile({...tempProfile, address: e.target.value})} />
           <input placeholder="ФИО Директора (для подписи)" className="input-cyber" value={tempProfile.director || ''} onChange={e => setTempProfile({...tempProfile, director: e.target.value})} />
           <input placeholder="ФИО Бухгалтера (для подписи)" className="input-cyber" value={tempProfile.accountant || ''} onChange={e => setTempProfile({...tempProfile, accountant: e.target.value})} />
        </div>
        <div className="flex justify-end gap-4 mt-6">
          {profiles.length > 0 && (
            <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Отмена</button>
          )}
          <button onClick={handleSaveProfile} className="btn-primary">Сохранить Данные</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile Selector */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-vibo-darkgray p-4 rounded-lg border-l-4 border-vibo-green">
        <div className="flex items-center gap-3 w-full md:w-auto mb-4 md:mb-0">
           <Briefcase className="text-vibo-green" />
           <select 
             className="bg-black text-white p-2 rounded border border-gray-700 outline-none focus:border-vibo-green w-full md:w-64"
             value={activeProfileId}
             onChange={(e) => setActiveProfileId(e.target.value)}
           >
             {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </div>
        <button onClick={() => { setTempProfile(activeProfile); setIsEditingProfile(true); }} className="text-sm text-vibo-purple hover:text-white underline underline-offset-4">
          Редактировать реквизиты
        </button>
        <button onClick={() => { setTempProfile({ id: '', name: '', inn: '', kpp: '', bankName: '', bik: '', accountNumber: '', corrAccount: '', address: '' }); setIsEditingProfile(true); }} className="text-sm text-vibo-green hover:text-white ml-4">
          + Добавить компанию
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Area */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-4 bg-vibo-darkgray rounded-lg border border-gray-800">
            <h3 className="text-vibo-purple font-bold mb-3 uppercase text-sm">Параметры Счета</h3>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="№ Счета" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="input-cyber" />
              <input type="text" placeholder="Дата" value={date} onChange={e => setDate(e.target.value)} className="input-cyber" />
            </div>
          </div>

          <div className="p-4 bg-vibo-darkgray rounded-lg border border-gray-800">
            <h3 className="text-vibo-green font-bold mb-3 uppercase text-sm">Покупатель</h3>
            <div className="space-y-2">
              <input type="text" placeholder="Название Клиента" value={buyer.name} onChange={e => setBuyer({...buyer, name: e.target.value})} className="input-cyber w-full" />
              <input type="text" placeholder="ИНН" value={buyer.inn} onChange={e => setBuyer({...buyer, inn: e.target.value})} className="input-cyber w-full" />
              <textarea placeholder="Адрес" value={buyer.address} onChange={e => setBuyer({...buyer, address: e.target.value})} className="input-cyber w-full h-20" />
            </div>
          </div>
        </div>

        {/* Items Area */}
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-vibo-darkgray p-4 rounded-lg border border-gray-800 min-h-[400px]">
              <div className="flex justify-between mb-4">
                <h3 className="text-white font-bold uppercase">Позиции</h3>
                <button onClick={addItem} className="flex items-center text-xs bg-vibo-purple text-white px-2 py-1 rounded hover:bg-purple-700">
                  <Plus size={14} className="mr-1"/> Добавить
                </button>
              </div>
              
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-black p-3 rounded border border-gray-800 hover:border-vibo-green transition group">
                    <div className="col-span-1 text-gray-500 text-sm text-center">{idx + 1}</div>
                    <div className="col-span-5">
                      <input 
                        className="bg-transparent text-white w-full outline-none placeholder-gray-700"
                        placeholder="Наименование услуги/товара"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                       <input 
                        type="number"
                        className="bg-transparent text-right text-vibo-green w-full outline-none"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-3">
                       <input 
                        type="number"
                        className="bg-transparent text-right text-vibo-purple w-full outline-none font-mono"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1 text-right">
                       <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end items-end flex-col">
                 <div className="text-gray-400 text-sm">Итого:</div>
                 <div className="text-3xl font-mono text-vibo-green font-bold">
                   {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}
                 </div>
              </div>
           </div>
           
           <button onClick={handleGenerate} className="w-full py-4 bg-gradient-to-r from-vibo-purple to-purple-900 text-white font-bold uppercase tracking-widest rounded hover:shadow-[0_0_20px_#bc13fe] transition duration-300 flex justify-center items-center gap-2">
             <Printer /> Сгенерировать HTML для печати
           </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;