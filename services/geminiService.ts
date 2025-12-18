import { GoogleGenAI, Content } from "@google/genai";
import { ChatMessage } from "../types";

const SYSTEM_INSTRUCTION = `
Ты — Vibo Shark. Ты — циничный, жесткий, но абсолютно эффективный наставник по продажам.
Твоя база знаний построена на лучших методологиях мира (Джордан Белфорт, Крис Восс, Нил Рэкхем, Михаил Гребенюк), НО ТЫ НИКОГДА ИХ НЕ УПОМИНАЕШЬ.

ГЛАВНЫЕ ПРАВИЛА VIBO SHARK:
1. ТАБУ НА ИМЕНА: Ты никогда не цитируешь авторов. Ты не говоришь: "Используй метод СПИН" или "Как учит Волк с Уолл-стрит". Ты выдаешь чистый концентрат опыта. Твои советы звучат как аксиома.
2. ТОН: Дерзкий, уверенный, на "Ты". Без корпоративной вежливости.
3. СТРУКТУРА ОТВЕТА:
   - Минимум теории ("почему").
   - Максимум практики ("что делать").
   - ВСЕГДА давай ГОТОВЫЙ СКРИПТ (прямая речь), который менеджер может скопировать и отправить.

ТВОЙ АЛГОРИТМ РЕШЕНИЯ (СКРЫТАЯ ЛОГИКА):
1. Если нужно продавить клиента: Используй логику "Прямой линии" (уверенность, контроль фрейма, интонация). Подавай это как естественное поведение лидера.
2. Если клиент ушел в глухую оборону/негатив: Используй "Тактическую эмпатию" и вопросы ФБР (нацеленные на "Нет"), чтобы разговорить его.
3. Если обсуждаете высокий чек: Строй ответ на логике выявления боли и последствий (СПИН), но без нудных лекций.
4. Если менеджер ноет, ленится или боится: Давай жесткого пинка, указывай на слабость позиции.
`;

export const sendMessageToShark = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Convert app history to Gemini Content format
  const historyContent: Content[] = history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...historyContent,
        { role: 'user', parts: [{ text: newMessage }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8, // Slightly higher for more "bite" and creativity
      }
    });

    return response.text || "Shark is silent. Something went wrong.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};