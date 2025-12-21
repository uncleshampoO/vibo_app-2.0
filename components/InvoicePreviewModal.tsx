import React from 'react';
import { X, Share2, Download } from 'lucide-react';

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
  if (!isOpen) return null;

  const handleShare = async () => {
    // Создаем файл из HTML строки
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const file = new File([blob], `${fileName}.html`, { type: 'text/html' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Счет на оплату',
          text: 'Счет сформирован в Vibo Team',
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Фолбэк для ПК - просто скачивание
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-2xl border border-vibo-purple">
        {/* Шапка модального окна */}
        <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
          <h3 className="text-white font-bold">Предпросмотр счета</h3>
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 bg-vibo-green text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-400 transition"
            >
              <Share2 size={16} /> <span className="hidden sm:inline">Отправить/Скачать</span>
            </button>
            <button 
              onClick={onClose}
              className="bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Тело с iFrame (безопасный рендер HTML) */}
        <div className="flex-grow bg-gray-100 p-0 overflow-hidden relative">
           <iframe 
             srcDoc={htmlContent} 
             className="w-full h-full border-none bg-white" 
             title="Invoice Preview"
           />
        </div>
      </div>
    </div>
  );
};
