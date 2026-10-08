import type { Locale } from "@/lib/i18n/config";

/**
 * "Find 3 signs" exercise: a realistic scam SMS split into segments; the ones with `sign` are the
 * tell-tale phrases. The explanation is shown once the learner finds that segment. Illustrative text,
 * not a real message; the domain uses the reserved .example TLD.
 */
export type SignSegment = { text: string; sign?: string };

export const FIND_SIGNS: Record<Locale, { sender: string; segments: SignSegment[] }> = {
  ru: {
    sender: "+7 747 *** 12 09",
    segments: [
      { text: "Уважаемый клиент! " },
      { text: "Ваша карта заблокирована", sign: "Пугают блокировкой — банк так не пишет с обычного номера." },
      { text: " из-за подозрительной операции. " },
      { text: "В течение 30 минут", sign: "Давят сроком, чтобы вы не успели подумать." },
      { text: " подтвердите данные по ссылке " },
      { text: "kaspi-bank-secure.example", sign: "Чужой домен: настоящий адрес банка — kaspi.kz." },
      { text: " и сообщите код из СМС оператору." },
    ],
  },
  kk: {
    sender: "+7 747 *** 12 09",
    segments: [
      { text: "Құрметті клиент! " },
      { text: "Картаңыз бұғатталды", sign: "Бұғаттаумен қорқытады — банк кәдімгі нөмірден олай жазбайды." },
      { text: " күдікті операцияға байланысты. " },
      { text: "30 минут ішінде", sign: "Ойлануға уақыт бермеу үшін мерзіммен қысым жасайды." },
      { text: " сілтеме арқылы деректерді растаңыз: " },
      { text: "kaspi-bank-secure.example", sign: "Бөгде домен: банктің нағыз мекенжайы — kaspi.kz." },
      { text: " және СМС кодын операторға айтыңыз." },
    ],
  },
  en: {
    sender: "+7 747 *** 12 09",
    segments: [
      { text: "Dear customer! " },
      { text: "Your card has been blocked", sign: "A scare about blocking — a bank doesn't text this from an ordinary number." },
      { text: " due to a suspicious transaction. " },
      { text: "Within 30 minutes", sign: "A deadline so you don't stop to think." },
      { text: " confirm your details at " },
      { text: "kaspi-bank-secure.example", sign: "A look-alike domain: the bank's real address is kaspi.kz." },
      { text: " and tell the operator the SMS code." },
    ],
  },
};
