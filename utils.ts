/**
 * A basic implementation to convert numbers to Russian words for the invoice total.
 * Covers numbers up to millions.
 */
export const numberToRussianWords = (num: number): string => {
  if (num === 0) return 'ноль рублей 00 копеек';

  const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const onesFem = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

  const getTriad = (n: number, gender: 'male' | 'female'): string => {
    let str = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    if (h > 0) str += hundreds[h] + ' ';
    
    if (t === 1) {
      str += teens[o] + ' ';
    } else {
      if (t > 1) str += tens[t] + ' ';
      if (o > 0) str += (gender === 'female' ? onesFem[o] : ones[o]) + ' ';
    }
    return str.trim();
  };

  const declension = (n: number, forms: [string, string, string]): string => {
    const lastTwo = n % 100;
    const last = n % 10;
    if (lastTwo >= 11 && lastTwo <= 19) return forms[2];
    if (last === 1) return forms[0];
    if (last >= 2 && last <= 4) return forms[1];
    return forms[2];
  };

  const integerPart = Math.floor(num);
  const fractionalPart = Math.round((num - integerPart) * 100);

  let result = '';
  
  // Millions
  const millions = Math.floor(integerPart / 1000000);
  const remainderAfterMillions = integerPart % 1000000;
  if (millions > 0) {
    result += getTriad(millions, 'male') + ' ' + declension(millions, ['миллион', 'миллиона', 'миллионов']) + ' ';
  }

  // Thousands
  const thousands = Math.floor(remainderAfterMillions / 1000);
  const remainderAfterThousands = remainderAfterThousands % 1000;
  if (thousands > 0) {
    result += getTriad(thousands, 'female') + ' ' + declension(thousands, ['тысяча', 'тысячи', 'тысяч']) + ' ';
  }

  // Ones
  if (remainderAfterThousands > 0) {
    result += getTriad(remainderAfterThousands, 'male') + ' ';
  }

  // Rubles
  result += declension(integerPart, ['рубль', 'рубля', 'рублей']);

  // Kopeks
  const kopeksStr = fractionalPart.toString().padStart(2, '0');
  result += ` ${kopeksStr} ${declension(fractionalPart, ['копейка', 'копейки', 'копеек'])}`;

  return result.charAt(0).toUpperCase() + result.slice(1).trim();
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(val);
};

// --- СТИЛИ ДЛЯ СЧЕТОВ ---
// Исправляем CSS: добавляем nowrap для цифр и фиксированные ширины

const CSS_CYBER = `
  body { font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 20px; margin: 0; -webkit-print-color-adjust: exact; }
  .container { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #333; padding: 20px; box-sizing: border-box; }
  .header-line { border-bottom: 2px solid #bc13fe; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  h1 { color: #bc13fe; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; line-height: 1.2; }
  .neon-text { color: #39ff14; text-shadow: 0 0 5px rgba(57, 255, 20, 0.5); }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; table-layout: fixed; } /* Фиксированный макет таблицы */
  th, td { border: 1px solid #333; padding: 8px; text-align: left; vertical-align: middle; word-wrap: break-word; }
  th { background-color: #1a1a1a; color: #bc13fe; font-size: 12px; text-transform: uppercase; }
  .total-amount { font-size: 18px; font-weight: bold; color: #39ff14; }
  .logo { max-height: 60px; filter: drop-shadow(0 0 5px #bc13fe); }
  .legal-info { font-size: 12px; color: #888; margin-bottom: 20px; }
  /* Классы для колонок, чтобы цифры не переносились */
  .col-num { width: 5%; text-align: center; }
  .col-name { width: 45%; }
  .col-qty { width: 10%; text-align: right; white-space: nowrap; }
  .col-unit { width: 10%; text-align: center; }
  .col-price { width: 15%; text-align: right; white-space: nowrap; }
  .col-sum { width: 15%; text-align: right; white-space: nowrap; }
`;

const CSS_CLASSIC = `
  body { font-family: 'Times New Roman', serif; background-color: #ffffff; color: #000000; padding: 20px; margin: 0; }
  .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
  .header-line { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  h1 { color: #000; font-size: 20px; font-weight: bold; margin-bottom: 5px; }
  .neon-text { display: none; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; table-layout: fixed; }
  th, td { border: 1px solid #000; padding: 5px 8px; text-align: left; vertical-align: top; word-wrap: break-word; }
  th { background-color: #fff; font-weight: bold; text-align: center; }
  .total-amount { font-size: 16px; font-weight: bold; color: #000; }
  .logo { max-height: 60px; }
  .legal-info { font-size: 12px; color: #000; margin-bottom: 20px; }
  .bank-table { width: 100%; margin-bottom: 20px; }
  .bank-table td { border: 1px solid #000; padding: 4px; }
  hr { border-top: 2px solid #000; }
  /* Классы для колонок */
  .col-num { width: 5%; text-align: center; }
  .col-name { width: 45%; }
  .col-qty { width: 10%; text-align: right; white-space: nowrap; }
  .col-unit { width: 10%; text-align: center; }
  .col-price { width: 15%; text-align: right; white-space: nowrap; }
  .col-sum { width: 15%; text-align: right; white-space: nowrap; }
`;

export const generateInvoiceHTML = (
  seller: any, 
  buyer: any, 
  items: any[], 
  invoiceNumber: string,
  date: string,
  theme: 'cyber' | 'classic' = 'cyber'
) => {
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const totalInWords = numberToRussianWords(total);
  const styles = theme === 'cyber' ? CSS_CYBER : CSS_CLASSIC;
  
  const logoHtml = seller.logoUrl ? `<img src="${seller.logoUrl}" class="logo" alt="Logo" />` : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Счет №${invoiceNumber}</title>
    <style>
        ${styles}
        .signatures { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sign-box { border-bottom: 1px solid ${theme === 'cyber' ? '#bc13fe' : '#000'}; width: 200px; height: 30px; }
        .total-section { text-align: right; margin-top: 20px; border-top: 2px solid ${theme === 'cyber' ? '#39ff14' : '#000'}; padding-top: 10px; page-break-inside: avoid; }
        
        @media print {
             body { background-color: white !important; color: black !important; }
             .container { border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; }
             .neon-text { display: none !important; }
             th { background-color: white !important; color: black !important; border: 1px solid black !important; }
             td { border: 1px solid black !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-line">
            <div>${logoHtml}</div>
            <div style="text-align: right;">
                <div style="font-size: 10px; color: #666;">ДОКУМЕНТ</div>
                <div class="neon-text">ОРИГИНАЛ</div>
            </div>
        </div>

        <div class="legal-info">
            <table class="bank-table" style="table-layout: auto;">
                <tr>
                    <td colspan="2" rowspan="2" style="width: 50%">
                        ${seller.bankName}<br>
                        <span style="font-size: 10px">Банк получателя</span>
                    </td>
                    <td style="width: 10%">БИК</td>
                    <td style="width: 40%">${seller.bik}</td>
                </tr>
                <tr>
                    <td>Сч. №</td>
                    <td>${seller.accountNumber}</td>
                </tr>
                <tr>
                    <td>ИНН ${seller.inn}</td>
                    <td>КПП ${seller.kpp}</td>
                    <td rowspan="2">Сч. №</td>
                    <td rowspan="2">${seller.corrAccount}</td>
                </tr>
                <tr>
                    <td colspan="2">
                        ${seller.name}<br>
                        <span style="font-size: 10px">Получатель</span>
                    </td>
                </tr>
            </table>
        </div>

        <h1>Счет на оплату № ${invoiceNumber} от ${date}</h1>
        <hr style="border-color: ${theme === 'cyber' ? '#333' : '#000'}; margin: 15px 0;">

        <table style="border: none; margin: 10px 0; table-layout: auto;">
            <tr style="border: none;">
                <td style="border: none; width: 100px; color: ${theme === 'cyber' ? '#888' : '#000'}; vertical-align: top;">Поставщик:</td>
                <td style="border: none; font-weight: bold;">
                    ${seller.name}, ИНН ${seller.inn}, КПП ${seller.kpp}, ${seller.address}
                </td>
            </tr>
            <tr style="border: none;">
                <td style="border: none; width: 100px; color: ${theme === 'cyber' ? '#888' : '#000'}; vertical-align: top;">Покупатель:</td>
                <td style="border: none; font-weight: bold;">
                    ${buyer.name} ${buyer.inn ? `, ИНН ${buyer.inn}` : ''} ${buyer.address ? `, ${buyer.address}` : ''}
                </td>
            </tr>
        </table>

        <table>
            <thead>
                <tr>
                    <th class="col-num">№</th>
                    <th class="col-name">Товары (работы, услуги)</th>
                    <th class="col-qty">Кол-во</th>
                    <th class="col-unit">Ед.</th>
                    <th class="col-price">Цена</th>
                    <th class="col-sum">Сумма</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item, index) => `
                <tr>
                    <td class="col-num">${index + 1}</td>
                    <td class="col-name">${item.name}</td>
                    <td class="col-qty">${item.quantity}</td>
                    <td class="col-unit">${item.unit}</td>
                    <td class="col-price">${item.price.toFixed(2)}</td>
                    <td class="col-sum">${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="total-section">
            <div style="margin-bottom: 5px;">Итого: ${total.toFixed(2)}</div>
            <div style="margin-bottom: 5px;">В том числе НДС: <span style="color: #666;">Без НДС</span></div>
            <div class="total-amount">Всего к оплате: ${total.toFixed(2)}</div>
        </div>

        <div style="margin-top: 15px; font-style: italic; border-bottom: 1px solid ${theme === 'cyber' ? '#333' : '#000'}; padding-bottom: 5px;">
            Всего наименований ${items.length}, на сумму ${total.toFixed(2)} руб.<br>
            <span style="font-weight: bold;">${totalInWords}</span>
        </div>

        <div class="signatures">
            <div>
                <div>Руководитель</div>
                <div class="sign-box"></div>
                <div style="font-size: 10px; text-align: center; color: #666;">${seller.director || 'подпись'}</div>
            </div>
            <div>
                <div>Бухгалтер</div>
                <div class="sign-box"></div>
                <div style="font-size: 10px; text-align: center; color: #666;">${seller.accountant || 'подпись'}</div>
            </div>
        </div>
    </div>
</body>
</html>`;
};
