import React from 'react';
import { UserTier } from '../types';
import { Check, Star, Zap } from 'lucide-react';

interface UserProfileProps {
  currentTier: UserTier;
  onUpgrade: (tier: UserTier) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ currentTier, onUpgrade }) => {
  
  const plans = [
    {
      id: UserTier.SECRETARY,
      name: 'Секретарь',
      price: '79₽',
      features: ['Безлимитные счета', 'Кибер-дизайн PDF', 'Сохранение компаний']
    },
    {
      id: UserTier.ASSISTANT,
      name: 'Ассистент',
      price: '399₽',
      features: ['Всё, что в Секретаре', 'Доступ к SHARK ADVISOR', 'AI-скрипты продаж']
    },
    {
      id: UserTier.CLOSER,
      name: 'Клоузер',
      price: '990₽',
      features: ['Всё, что в Ассистенте', 'Разбор аудио звонков', 'Персональная стратегия']
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Карточка текущего статуса */}
      <div className="bg-gradient-to-r from-gray-900 to-black border border-gray-800 p-6 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Ваш текущий план</h3>
          <div className="text-3xl font-bold text-white uppercase flex items-center gap-3">
            {currentTier === UserTier.FREE ? 'Бесплатный' : currentTier}
            <span className="bg-vibo-green text-black text-[10px] px-2 py-1 rounded font-bold">ACTIVE</span>
          </div>
      </div>

      <h3 className="text-xl font-bold text-white mt-8 mb-4 flex items-center gap-2">
        Доступные тарифы <Zap size={18} className="text-vibo-purple" />
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.id;
          return (
            <div key={plan.id} className={`relative p-5 rounded-xl border flex flex-col transition-all duration-300 ${isCurrent ? 'border-vibo-green bg-vibo-green/5 shadow-[0_0_15px_rgba(57,255,20,0.1)]' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className={`font-bold text-lg ${isCurrent ? 'text-vibo-green' : 'text-white'}`}>{plan.name}</h4>
                  <div className="text-2xl font-bold text-white mt-1">{plan.price}<span className="text-sm text-gray-500 font-normal">/мес</span></div>
                </div>
                <div className={`p-2 rounded-lg ${isCurrent ? 'bg-vibo-green/20 text-vibo-green' : 'bg-gray-800 text-vibo-purple'}`}>
                  {plan.id === UserTier.CLOSER ? <Zap size={20}/> : <Star size={20}/>}
                </div>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-300">
                    <Check size={14} className="text-vibo-green mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onUpgrade(plan.id)}
                disabled={isCurrent}
                className={`w-full py-2 rounded font-bold uppercase tracking-wide transition-all ${
                  isCurrent 
                    ? 'bg-gray-800 text-gray-500 cursor-default'
                    : 'bg-vibo-purple text-white hover:bg-purple-600 hover:shadow-[0_0_15px_rgba(188,19,254,0.4)] active:scale-95'
                }`}
              >
                {isCurrent ? 'Текущий план' : 'Улучшить'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserProfile;
