import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, ZoomIn, ZoomOut } from 'lucide-react';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  fileName: string;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  htmlContent,
  fileName 
}) => {
  const [scale, setScale] = useState(0.45); // Начальный масштаб для "мини-версии"
  const [isZoomed, setIsZoomed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Сброс масштаба при открытии
  useEffect(() => {
    if (isOpen) {
      setIsZoomed(false);
      setScale(0.45); // Подгоняем под мобильный экран (примерно)
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const file = new File([blob], `${fileName}.html`, { type: 'text/html' });

      // 1. Пробуем нативный шеринг файла (Android/iOS)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Счет на оплату',
          text: 'Счет сформирован в Vibo Team',
        });
        return;
      }
      
      // 2. Если файлы нельзя, пробуем просто текст (ссылку пока не можем, т.к. нет бэкенда для файлов)
      if (navigator.share) {
         await navigator.share({
          title: 'Счет на оплату',
          text: 'К сожалению, ваш браузер не поддерживает отправку файлов из этого меню. Попробуйте открыть с ПК.',
        });
        return;
      }

      // 3. Фолбэк: Просто сообщаем (в Telegram WebApp скачивание часто заблокировано)
      alert("Ваше устройство не поддерживает прямую отправку файлов из Mini App. Пожалуйста, откройте приложение с компьютера или сделайте скриншот.");

    } catch (error) {
      console.log('Error sharing:', error);
      // Не пугаем юзера ошибкой AbortError (если он сам закрыл меню)
      if ((error as Error).name !== 'AbortError') {
         alert("Ошибка при попытке поделиться: " + (error as Error).message);
      }
    }
  };

  const toggleZoom = () => {
    if (isZoomed) {
      setScale(0.45); // Обратно в мини-режим
    } else {
      setScale(1.0); // Полный размер (скролл)
    }
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-0 animate-fade-in">
      <div className="bg-vibo-darkgray w-full h-full md:h-[90vh] md:w-[800px] md:rounded-xl flex flex-col overflow-hidden shadow-2xl border border-vibo-purple/30 relative">
        
        {/* Шапка */}
        <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700 z-10 shrink-0">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Предпросмотр</h3>
          <div className="flex gap-3">
             {/* Кнопка Зум */}
            <button 
              onClick={toggleZoom}
              className="bg-gray-800 text-vibo-purple p-2 rounded-lg hover:bg-gray-700 transition"
            >
              {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
            </button>

            {/* Кнопка Поделиться */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 bg-vibo-green text-black px-3 py-2 rounded-lg font-bold text-xs hover:bg-green-400 transition active:scale-95"
            >
              <Share2 size={16} /> <span className="hidden sm:inline">Отправить</span>
            </button>

            {/* Кнопка Закрыть */}
            <button 
              onClick={onClose}
              className="bg-gray-800 text-white p-2 rounded-lg hover:bg-red-500 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Тело с iFrame */}
        <div className="flex-grow bg-[#1a1a1a] relative overflow-auto flex justify-center">
           <div 
             className="origin-top transition-transform duration-300 ease-in-out bg-white shadow-2xl"
             style={{
               width: '800px', // Фиксируем ширину А4
               minHeight: '1100px', // Высота А4 (примерно)
               transform: `scale(${scale})`,
               marginTop: isZoomed ? '0' : '20px', // Отступ сверху для красоты в мини-режиме
               marginBottom: '20px'
             }}
           >
             <iframe 
               srcDoc={htmlContent} 
               className="w-full h-full border-none" 
               title="Invoice Preview"
               sandbox="allow-same-origin allow-scripts" // Разрешаем скрипты для рендеринга
             />
             
             {/* Прозрачная вуаль, чтобы можно было зумить кликом (опционально) */}
             {!isZoomed && (
                <div 
                  className="absolute inset-0 cursor-zoom-in z-20" 
                  onClick={toggleZoom}
                  title="Нажмите для увеличения"
                />
             )}
           </div>
        </div>

        {/* Подсказка для пользователя */}
        {!isZoomed && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-xs pointer-events-none fade-in">
            Нажми, чтобы увеличить
          </div>
        )}
      </div>
    </div>
  );
};
