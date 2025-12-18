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
  const remainderAfterThousands = remainderAfterMillions % 1000;
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

export const generateInvoiceHTML = (
  seller: any, 
  buyer: any, 
  items: any[], 
  invoiceNumber: string,
  date: string
) => {
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const totalInWords = numberToRussianWords(total);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Счет №${invoiceNumber}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #0a0a0a;
            color: #ffffff;
            padding: 40px;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #333;
            padding: 20px;
            box-shadow: 0 0 20px rgba(188, 19, 254, 0.1);
        }
        .header-line {
            border-bottom: 2px solid #bc13fe;
            padding-bottom: 10px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            max-height: 60px;
            filter: drop-shadow(0 0 5px #bc13fe);
        }
        h1 {
            color: #bc13fe;
            margin: 0;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .neon-text {
            color: #39ff14;
            text-shadow: 0 0 5px rgba(57, 255, 20, 0.5);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #333;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #1a1a1a;
            color: #bc13fe;
        }
        .total-section {
            text-align: right;
            margin-top: 20px;
            border-top: 2px solid #39ff14;
            padding-top: 10px;
        }
        .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #39ff14;
        }
        .legal-info {
            font-size: 12px;
            color: #888;
            margin-bottom: 20px;
        }
        .bank-table td {
             font-size: 12px;
        }
        .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .sign-box {
            border-bottom: 1px solid #bc13fe;
            width: 200px;
            height: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-line">
            <div>
                ${seller.logoUrl ? `<img src="${seller.logoUrl}" class="logo" alt="Logo" />` : ''}
            </div>
            <div style="text-align: right;">
                <div style="font-size: 10px; color: #666;">ДОКУМЕНТ</div>
                <div class="neon-text">ОРИГИНАЛ</div>
            </div>
        </div>

        <div class="legal-info">
            <table class="bank-table">
                <tr>
                    <td colspan="2" rowspan="2">
                        ${seller.bankName}<br>
                        <span style="font-size: 10px">Банк получателя</span>
                    </td>
                    <td>БИК</td>
                    <td>${seller.bik}</td>
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
        <hr style="border-color: #333; margin: 15px 0;">

        <table style="border: none;">
            <tr style="border: none;">
                <td style="border: none; width: 100px; color: #888;">Поставщик:</td>
                <td style="border: none; font-weight: bold;">
                    ${seller.name}, ИНН ${seller.inn}, КПП ${seller.kpp}, ${seller.address}
                </td>
            </tr>
            <tr style="border: none;">
                <td style="border: none; width: 100px; color: #888;">Покупатель:</td>
                <td style="border: none; font-weight: bold;">
                    ${buyer.name} ${buyer.inn ? `, ИНН ${buyer.inn}` : ''} ${buyer.address ? `, ${buyer.address}` : ''}
                </td>
            </tr>
        </table>

        <table>
            <thead>
                <tr>
                    <th style="width: 5%">№</th>
                    <th style="width: 50%">Товары (работы, услуги)</th>
                    <th style="width: 10%">Кол-во</th>
                    <th style="width: 10%">Ед.</th>
                    <th style="width: 10%">Цена</th>
                    <th style="width: 15%">Сумма</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item, index) => `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>${item.name}</td>
                    <td style="text-align: right;">${item.quantity}</td>
                    <td style="text-align: center;">${item.unit}</td>
                    <td style="text-align: right;">${item.price.toFixed(2)}</td>
                    <td style="text-align: right;">${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="total-section">
            <div style="margin-bottom: 5px;">Итого: ${total.toFixed(2)}</div>
            <div style="margin-bottom: 5px;">В том числе НДС: <span style="color: #666;">Без НДС</span></div>
            <div class="total-amount">Всего к оплате: ${total.toFixed(2)}</div>
        </div>

        <div style="margin-top: 15px; font-style: italic; border-bottom: 1px solid #333; padding-bottom: 5px;">
            Всего наименований ${items.length}, на сумму ${total.toFixed(2)} руб.<br>
            <span style="color: #bc13fe; font-weight: bold;">${totalInWords}</span>
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