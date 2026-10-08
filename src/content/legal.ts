import type { Locale } from "@/lib/i18n/config";

/**
 * Legal texts (ru / kk / en). DRAFT — must be reviewed by a lawyer before launch
 * (see `business.legalReviewed`). Tokens `{COMPANY}`, `{DPO_EMAIL}`, `{VERSION}` are filled from
 * `src/config/business.ts` at render time. Retention periods mirror docs/DATA-INVENTORY.md and the
 * Hangfire jobs (DataRetentionJob, AccountPurgeJob) — change them together.
 */
export type LegalDocId = "privacy" | "terms" | "cookies" | "refund";
export const LEGAL_DOCS: LegalDocId[] = ["privacy", "terms", "cookies", "refund"];

export interface LegalSection {
  h: string;
  p?: string[];
  ul?: string[];
}
export interface LegalDoc {
  title: string;
  lead: string;
  sections: LegalSection[];
}
export interface CookieRow {
  name: string;
  purpose: string;
  duration: string;
  category: string;
}

export const legalUi: Record<Locale, { updated: string; version: string; draft: string; back: string; cookieName: string; cookiePurpose: string; cookieDuration: string; cookieCategory: string; contents: string }> = {
  ru: {
    updated: "Редакция от",
    version: "Версия",
    draft: "Проект документа: требует проверки юристом до публичного запуска.",
    back: "На главную",
    cookieName: "Имя",
    cookiePurpose: "Назначение",
    cookieDuration: "Срок",
    cookieCategory: "Категория",
    contents: "Содержание",
  },
  kk: {
    updated: "Редакция күні",
    version: "Нұсқа",
    draft: "Құжат жобасы: жария іске қосу алдында заңгер тексеруі қажет.",
    back: "Басты бетке",
    cookieName: "Атауы",
    cookiePurpose: "Мақсаты",
    cookieDuration: "Мерзімі",
    cookieCategory: "Санат",
    contents: "Мазмұны",
  },
  en: {
    updated: "Effective",
    version: "Version",
    draft: "Draft document: needs lawyer review before public launch.",
    back: "Back to home",
    cookieName: "Name",
    cookiePurpose: "Purpose",
    cookieDuration: "Duration",
    cookieCategory: "Category",
    contents: "Contents",
  },
};

export const cookieRows: Record<Locale, CookieRow[]> = {
  ru: [
    { name: "qorgau_jwt", purpose: "Короткоживущий токен входа (httpOnly). Без него нельзя сохранить прогресс и согласия.", duration: "до 30 минут", category: "Необходимые" },
    { name: "qorgau_refresh", purpose: "Токен продления сессии (httpOnly). Меняется при каждом использовании; повтор старого токена завершает сессию.", duration: "14 дней", category: "Необходимые" },
    { name: "qorgau_uid", purpose: "Идентификатор вашей сессии для интерфейса.", duration: "14 дней", category: "Необходимые" },
    { name: "qorgau_remember", purpose: "Помнит ваш выбор «Запомнить меня»: без него вход заканчивается при закрытии браузера.", duration: "14 дней или до закрытия браузера", category: "Необходимые" },
    { name: "qorgau_consent", purpose: "Запоминает ваш выбор по cookie.", duration: "180 дней", category: "Необходимые" },
    { name: "qorgau_locale", purpose: "Язык интерфейса. Записывается, только когда вы его меняете.", duration: "1 год при согласии «Предпочтения», иначе до закрытия браузера", category: "Предпочтения" },
    { name: "qorgau_density", purpose: "Режим «крупный шрифт». Записывается, только когда вы его включаете.", duration: "1 год при согласии «Предпочтения», иначе до закрытия браузера", category: "Предпочтения" },
    { name: "qorgau_contrast", purpose: "Режим высокой контрастности. Записывается, только когда вы его меняете.", duration: "1 год при согласии «Предпочтения», иначе до закрытия браузера", category: "Предпочтения" },
    { name: "qorgau_role", purpose: "Выбранная роль при входе (для меню).", duration: "30 дней", category: "Предпочтения" },
    { name: "theme (localStorage)", purpose: "Светлая или тёмная тема. Хранится только в вашем браузере.", duration: "до очистки данных сайта", category: "Предпочтения" },
  ],
  kk: [
    { name: "qorgau_jwt", purpose: "Қысқа мерзімді кіру токені (httpOnly). Онсыз прогресс пен келісімдерді сақтау мүмкін емес.", duration: "30 минутқа дейін", category: "Қажетті" },
    { name: "qorgau_refresh", purpose: "Сессияны ұзарту токені (httpOnly). Әр қолданған сайын ауысады; ескі токенді қайталау сессияны аяқтайды.", duration: "14 күн", category: "Қажетті" },
    { name: "qorgau_uid", purpose: "Интерфейс үшін сессия идентификаторы.", duration: "14 күн", category: "Қажетті" },
    { name: "qorgau_remember", purpose: "«Мені есте сақтау» таңдауыңызды сақтайды: онсыз браузерді жапқанда кіру аяқталады.", duration: "14 күн немесе браузер жабылғанша", category: "Қажетті" },
    { name: "qorgau_consent", purpose: "Cookie бойынша таңдауыңызды есте сақтайды.", duration: "180 күн", category: "Қажетті" },
    { name: "qorgau_locale", purpose: "Интерфейс тілі. Тек сіз өзгерткенде жазылады.", duration: "«Теңшеулер» келісімі болса 1 жыл, әйтпесе браузер жабылғанға дейін", category: "Теңшеулер" },
    { name: "qorgau_density", purpose: "«Үлкен қаріп» режимі. Тек сіз қосқанда жазылады.", duration: "«Теңшеулер» келісімі болса 1 жыл, әйтпесе браузер жабылғанға дейін", category: "Теңшеулер" },
    { name: "qorgau_contrast", purpose: "Жоғары контраст режимі. Тек сіз өзгерткенде жазылады.", duration: "«Теңшеулер» келісімі болса 1 жыл, әйтпесе браузер жабылғанға дейін", category: "Теңшеулер" },
    { name: "qorgau_role", purpose: "Кіру кезіндегі таңдалған рөл (мәзір үшін).", duration: "30 күн", category: "Теңшеулер" },
    { name: "theme (localStorage)", purpose: "Ашық немесе қараңғы тақырып. Тек сіздің браузеріңізде сақталады.", duration: "сайт деректері тазартылғанға дейін", category: "Теңшеулер" },
  ],
  en: [
    { name: "qorgau_jwt", purpose: "Short-lived sign-in token (httpOnly). Without it progress and consents cannot be saved.", duration: "up to 30 minutes", category: "Necessary" },
    { name: "qorgau_refresh", purpose: "Session refresh token (httpOnly). Rotated on every use; replaying an old one ends the session.", duration: "14 days", category: "Necessary" },
    { name: "qorgau_uid", purpose: "Session identifier used by the interface.", duration: "14 days", category: "Necessary" },
    { name: "qorgau_remember", purpose: "Remembers your “Keep me signed in” choice; without it, the session ends when the browser closes.", duration: "14 days or until the browser closes", category: "Necessary" },
    { name: "qorgau_consent", purpose: "Remembers your cookie choice.", duration: "180 days", category: "Necessary" },
    { name: "qorgau_locale", purpose: "Interface language. Written only when you change it.", duration: "1 year with Preferences consent, otherwise until the browser closes", category: "Preferences" },
    { name: "qorgau_density", purpose: "Large-text mode. Written only when you switch it on.", duration: "1 year with Preferences consent, otherwise until the browser closes", category: "Preferences" },
    { name: "qorgau_contrast", purpose: "High-contrast mode. Written only when you change it.", duration: "1 year with Preferences consent, otherwise until the browser closes", category: "Preferences" },
    { name: "qorgau_role", purpose: "Role chosen at sign-in (used for the menu).", duration: "30 days", category: "Preferences" },
    { name: "theme (localStorage)", purpose: "Light or dark theme. Stored only in your browser.", duration: "until site data is cleared", category: "Preferences" },
  ],
};

export const legal: Record<Locale, Record<LegalDocId, LegalDoc>> = {
  ru: {
    privacy: {
      title: "Политика конфиденциальности",
      lead: "Как QorgauAI обрабатывает персональные данные в соответствии с Законом Республики Казахстан «О персональных данных и их защите» № 94-V.",
      sections: [
        { h: "1. Кто мы", p: ["Оператор данных: {COMPANY}. Ответственный за защиту персональных данных: {DPO_EMAIL}."] },
        {
          h: "2. Какие данные мы обрабатываем",
          ul: [
            "Аккаунт: e-mail, отображаемое имя, выбранный трек обучения. Пароль мы не храним.",
            "Телефон (необязательно): только необратимый хеш; сам номер не сохраняется.",
            "Проверки: то, что вы отправили на анализ (текст, ссылка, скриншот, аудио), используется для получения вердикта. Сохраняется только замаскированный идентификатор, хеш, оценка риска и пояснение.",
            "Жалобы: категория, обезличенное описание, регион, идентификатор мошенника в виде хеша. ФИО потерпевшего мы не запрашиваем.",
            "Согласия: какое согласие, версия политики, время и хеш IP-адреса как доказательство.",
          ],
        },
        {
          h: "3. Цели и правовые основания",
          p: ["Мы обрабатываем данные, чтобы выдавать вердикты о риске мошенничества, вести ваш учебный прогресс, защищать близких при вашем согласии и улучшать сообщество жалоб. Основание: ваше согласие (его можно отозвать в любой момент) и законный интерес в безопасности сервиса."],
        },
        {
          h: "4. Передача третьим лицам и за границу",
          p: [
            "Для ИИ-анализа текст, изображение или аудио, которые вы отправили на проверку, передаются в Google Gemini (Google LLC). Серверы Google находятся за пределами Казахстана, поэтому это трансграничная передача. Из изображений мы заранее удаляем метаданные (EXIF, геолокацию).",
            "Не отправляйте на проверку паспорта, номера карт, коды из SMS и другие чувствительные данные.",
            "Хостинг и инфраструктура: {{HOSTING_PROVIDER}} (будет указано до запуска). Мы не продаём данные и не передаём их рекламным сетям.",
          ],
        },
        {
          h: "5. Сроки хранения",
          ul: [
            "Результаты проверок: 90 дней, затем удаляются автоматически (оспоренные хранятся до решения).",
            "Аккаунт: пока он существует. После запроса на удаление действует 14 дней отмены, затем личные данные безвозвратно обезличиваются.",
            "Жалобы в радаре: после удаления аккаунта автор обезличивается, а сама жалоба остаётся без привязки к вам, чтобы не разрушать общую картину угроз.",
            "Записи о согласиях: пока существует аккаунт и ещё 3 года после, как доказательство.",
          ],
        },
        {
          h: "6. Ваши права",
          ul: [
            "Получить копию своих данных: «Настройки → Приватность → Скачать мои данные».",
            "Отозвать согласие или удалить аккаунт: там же, не более двух нажатий.",
            "Потребовать исправления данных и подать жалобу в уполномоченный орган.",
            "Если вы не зарегистрированы: напишите на {DPO_EMAIL}, и мы ответим в срок, установленный законом.",
          ],
        },
        { h: "7. Дети", p: ["Если вам нет 18 лет, для полноценной работы нужно согласие законного представителя. До его подтверждения отчёты не попадают в публичный радар, а имя не показывается в рейтинге.", "Мы спрашиваем только год и месяц рождения. Согласие даёт опекун из вашего семейного круга в QorgauAI. Мы не проверяем документы: опекун сам подтверждает, что он ваш родитель или законный представитель, и это действие записывается в журнал аудита."] },
        { h: "8. Изменения", p: ["При существенных изменениях мы изменим версию политики ({VERSION}) и попросим подтвердить согласие заново."] },
      ],
    },
    terms: {
      title: "Условия использования",
      lead: "Правила пользования QorgauAI. Используя сервис, вы принимаете эти условия.",
      sections: [
        { h: "1. Что делает сервис", p: ["QorgauAI помогает распознать признаки мошенничества в сообщениях, ссылках, номерах и звонках. Вердикт формируется правилами, ИИ-моделью и данными сообщества."] },
        {
          h: "2. Вердикт носит рекомендательный характер",
          p: ["Оценка риска не является юридическим заключением, финансовой консультацией или гарантией. ИИ может ошибаться. Перед переводом денег проверяйте информацию в официальном приложении или по номеру банка с оборота карты."],
        },
        {
          h: "3. Запрещено",
          ul: [
            "Использовать API для массового сбора данных, обхода лимитов или обучения конкурирующих моделей.",
            "Подавать заведомо ложные жалобы или накручивать репутацию.",
            "Отправлять чужие персональные данные без права на это.",
            "Использовать сервис для подготовки мошеннических схем: проверять, «пройдёт ли» текст.",
          ],
        },
        { h: "4. Аккаунт", p: ["Вы отвечаете за действия под своим аккаунтом. Мы можем ограничить доступ при нарушении условий."] },
        { h: "5. Ответственность", p: ["Сервис предоставляется «как есть». Мы не отвечаем за убытки, возникшие из-за решений, принятых только на основании вердикта, в пределах, разрешённых законом."] },
        { h: "6. Применимое право", p: ["Применяется право Республики Казахстан. Споры разрешаются в соответствии с законодательством РК после попытки урегулирования по e-mail {DPO_EMAIL}."] },
      ],
    },
    cookies: {
      title: "Политика использования cookie",
      lead: "Какие cookie и локальные хранилища использует QorgauAI и как это изменить.",
      sections: [
        { h: "1. Категории", ul: ["Необходимые: работают всегда, без них сервис не откроется (вход, запоминание выбора).", "Предпочтения: язык и крупный шрифт. Без вашего согласия они действуют только до закрытия браузера.", "Аналитика: выключена по умолчанию. Загружается только после вашего «Принять»."] },
        { h: "2. Таблица cookie", p: ["Полный перечень ниже."] },
        { h: "3. Как изменить выбор", p: ["Нажмите «Настройки cookie» в нижней части любой страницы. Выбор можно изменить в любой момент; «Отклонить все» и «Принять все» равнозначны."] },
      ],
    },
    refund: {
      title: "Политика возврата (для B2B-партнёров)",
      lead: "Для граждан QorgauAI бесплатен: платить за проверки сообщений и обучение не нужно. Эта политика касается только предоплаченных пакетов запросов API.",
      sections: [
        { h: "1. Кому это относится", p: ["Организациям, которые покупают пакеты запросов для интеграции проверки в свои сервисы."] },
        { h: "2. Возврат неиспользованного остатка", ul: ["Вы можете запросить возврат за неиспользованные запросы в течение 14 дней после оплаты пакета.", "Возврат считается пропорционально неиспользованному остатку по цене пакета.", "Срок выплаты: до 10 рабочих дней после подтверждения заявки."] },
        { h: "3. Когда возврат невозможен", p: ["Использованные запросы не возвращаются. Если пакет оплачен более 14 дней назад, остаток переносится на следующий период, но не возвращается деньгами. Условия будут уточнены в договоре."] },
        { h: "4. Как запросить", p: ["Напишите на {DPO_EMAIL} с номером счёта. Точные условия оплаты и НДС указаны на странице тарифов."] },
      ],
    },
  },
  kk: {
    privacy: {
      title: "Құпиялылық саясаты",
      lead: "QorgauAI дербес деректерді «Дербес деректер және оларды қорғау туралы» Қазақстан Республикасының № 94-V Заңына сәйкес қалай өңдейді.",
      sections: [
        { h: "1. Біз кімбіз", p: ["Деректер операторы: {COMPANY}. Дербес деректерді қорғауға жауапты тұлға: {DPO_EMAIL}."] },
        {
          h: "2. Қандай деректерді өңдейміз",
          ul: [
            "Аккаунт: e-mail, көрсетілетін аты, таңдалған оқу бағыты. Құпиясөзді сақтамаймыз.",
            "Телефон (міндетті емес): тек қайтымсыз хеш; нөмірдің өзі сақталмайды.",
            "Тексерулер: талдауға жіберген мәліметіңіз (мәтін, сілтеме, скриншот, аудио) үкім алу үшін қолданылады. Тек маскіленген идентификатор, хеш, тәуекел бағасы және түсіндірме сақталады.",
            "Шағымдар: санат, иесіздендірілген сипаттама, өңір, алаяқ идентификаторының хеші. Жәбірленушінің аты-жөнін сұрамаймыз.",
            "Келісімдер: қандай келісім, саясат нұсқасы, уақыты және дәлел ретінде IP хеші.",
          ],
        },
        {
          h: "3. Мақсаттары мен құқықтық негіздері",
          p: ["Деректерді алаяқтық тәуекелі туралы үкім беру, оқу прогресін жүргізу, келісіміңізбен жақындарыңызды қорғау және шағымдар қауымдастығын жақсарту үшін өңдейміз. Негіз: сіздің келісіміңіз (кез келген уақытта қайтарып алуға болады) және сервис қауіпсіздігіндегі заңды мүдде."],
        },
        {
          h: "4. Үшінші тұлғаларға және шетелге беру",
          p: [
            "ЖИ талдауы үшін тексеруге жіберген мәтін, сурет немесе аудио Google Gemini (Google LLC) қызметіне беріледі. Google серверлері Қазақстаннан тыс жерде орналасқан, сондықтан бұл трансшекаралық беру. Суреттерден метадеректерді (EXIF, геолокация) алдын ала жоямыз.",
            "Тексеруге төлқұжатты, карта нөмірін, SMS кодтарын және басқа сезімтал деректерді жібермеңіз.",
            "Хостинг және инфрақұрылым: {{HOSTING_PROVIDER}} (іске қосуға дейін көрсетіледі). Деректерді сатпаймыз және жарнама желілеріне бермейміз.",
          ],
        },
        {
          h: "5. Сақтау мерзімдері",
          ul: [
            "Тексеру нәтижелері: 90 күн, содан кейін автоматты түрде жойылады (дауланғандары шешімге дейін сақталады).",
            "Аккаунт: ол бар кезде. Жою сұрауынан кейін 14 күн бас тарту мерзімі болады, сосын жеке деректер қайтарусыз иесіздендіріледі.",
            "Радардағы шағымдар: аккаунт жойылғаннан кейін автор иесіздендіріледі, ал шағымның өзі қауіптердің жалпы көрінісі бұзылмауы үшін сізбен байланыссыз қалады.",
            "Келісімдер туралы жазбалар: аккаунт бар кезде және одан кейін 3 жыл дәлел ретінде.",
          ],
        },
        {
          h: "6. Сіздің құқықтарыңыз",
          ul: [
            "Деректеріңіздің көшірмесін алу: «Баптаулар → Құпиялылық → Деректерімді жүктеу».",
            "Келісімді қайтарып алу немесе аккаунтты жою: сонда, екі басудан артық емес.",
            "Деректерді түзетуді талап ету және уәкілетті органға шағым беру.",
            "Тіркелмеген болсаңыз: {DPO_EMAIL} мекенжайына жазыңыз, заңда белгіленген мерзімде жауап береміз.",
          ],
        },
        { h: "7. Балалар", p: ["18 жасқа толмасаңыз, толық пайдалану үшін заңды өкілдің келісімі қажет. Ол расталғанға дейін есептер жария радарға түспейді, ал аты рейтингте көрсетілмейді.", "Біз тек туған жыл мен айды сұраймыз. Келісімді QorgauAI-дағы отбасылық шеңберіңіздегі қамқоршы береді. Біз құжаттарды тексермейміз: қамқоршы өзінің ата-анаңыз немесе заңды өкіліңіз екенін өзі растайды, бұл әрекет аудит журналына жазылады."] },
        { h: "8. Өзгерістер", p: ["Елеулі өзгерістер болса, саясат нұсқасын ({VERSION}) өзгертіп, келісімді қайта растауды сұраймыз."] },
      ],
    },
    terms: {
      title: "Пайдалану шарттары",
      lead: "QorgauAI пайдалану ережелері. Сервисті пайдалана отырып, осы шарттарды қабылдайсыз.",
      sections: [
        { h: "1. Сервис не істейді", p: ["QorgauAI хабарламалардағы, сілтемелердегі, нөмірлердегі және қоңыраулардағы алаяқтық белгілерін тануға көмектеседі. Үкімді ережелер, ЖИ моделі және қауымдастық деректері қалыптастырады."] },
        {
          h: "2. Үкім кеңес сипатында",
          p: ["Тәуекел бағасы заңды қорытынды, қаржылық кеңес немесе кепілдік емес. ЖИ қателесуі мүмкін. Ақша аударар алдында ақпаратты ресми қосымшадан немесе картаның артындағы банк нөмірі арқылы тексеріңіз."],
        },
        {
          h: "3. Тыйым салынады",
          ul: [
            "API-ді деректерді жаппай жинау, лимиттерді айналып өту немесе бәсекелес модельдерді оқыту үшін пайдалану.",
            "Көрінеу жалған шағымдар беру немесе беделді жасанды көтеру.",
            "Басқалардың дербес деректерін құқықсыз жіберу.",
            "Сервисті алаяқтық схемаларын дайындау үшін қолдану: мәтіннің «өтетінін» тексеру.",
          ],
        },
        { h: "4. Аккаунт", p: ["Аккаунтыңыздағы әрекеттерге өзіңіз жауаптысыз. Шарттар бұзылса, қолжетімділікті шектей аламыз."] },
        { h: "5. Жауапкершілік", p: ["Сервис «сол күйінде» ұсынылады. Тек үкімге сүйеніп қабылданған шешімдерден туған шығындар үшін заңда рұқсат етілген шекте жауап бермейміз."] },
        { h: "6. Қолданылатын құқық", p: ["Қазақстан Республикасының құқығы қолданылады. Даулар {DPO_EMAIL} арқылы реттеуге тырысқаннан кейін ҚР заңнамасына сәйкес шешіледі."] },
      ],
    },
    cookies: {
      title: "Cookie пайдалану саясаты",
      lead: "QorgauAI қандай cookie және жергілікті сақтауды қолданады және оны қалай өзгертуге болады.",
      sections: [
        { h: "1. Санаттар", ul: ["Қажетті: әрдайым жұмыс істейді, онсыз сервис ашылмайды (кіру, таңдауды есте сақтау).", "Теңшеулер: тіл және үлкен қаріп. Келісіміңізсіз олар браузер жабылғанға дейін ғана әрекет етеді.", "Аналитика: әдепкіде өшірулі. Тек сіз «Қабылдау» басқаннан кейін жүктеледі."] },
        { h: "2. Cookie кестесі", p: ["Толық тізім төменде."] },
        { h: "3. Таңдауды қалай өзгертуге болады", p: ["Кез келген беттің төменгі жағындағы «Cookie баптаулары» түймесін басыңыз. Таңдауды кез келген уақытта өзгертуге болады; «Бәрін қабылдамау» және «Бәрін қабылдау» тең құқылы."] },
      ],
    },
    refund: {
      title: "Қайтару саясаты (B2B серіктестер үшін)",
      lead: "Азаматтар үшін QorgauAI тегін: хабарламаларды тексеру мен оқу үшін төлеудің қажеті жоқ. Бұл саясат тек API сұраныстарының алдын ала төленген пакеттеріне қатысты.",
      sections: [
        { h: "1. Кімге қатысты", p: ["Тексеруді өз сервистеріне біріктіру үшін сұраныс пакеттерін сатып алатын ұйымдарға."] },
        { h: "2. Пайдаланылмаған қалдықты қайтару", ul: ["Пакет төленген күннен бастап 14 күн ішінде пайдаланылмаған сұраныстар үшін қайтаруды сұратуға болады.", "Қайтару пакет бағасы бойынша пайдаланылмаған қалдыққа пропорционал есептеледі.", "Төлем мерзімі: өтінім расталғаннан кейін 10 жұмыс күніне дейін."] },
        { h: "3. Қайтару мүмкін емес жағдайлар", p: ["Пайдаланылған сұраныстар қайтарылмайды. Пакет 14 күннен астам бұрын төленсе, қалдық келесі кезеңге ауысады, бірақ ақшамен қайтарылмайды. Шарттар келісімшартта нақтыланады."] },
        { h: "4. Қалай сұрату керек", p: ["Шот нөмірімен {DPO_EMAIL} мекенжайына жазыңыз. Төлем шарттары мен ҚҚС тарифтер бетінде көрсетіледі."] },
      ],
    },
  },
  en: {
    privacy: {
      title: "Privacy Policy",
      lead: "How QorgauAI processes personal data under the Law of the Republic of Kazakhstan \"On Personal Data and Their Protection\" No. 94-V, with GDPR-style privacy by design.",
      sections: [
        { h: "1. Who we are", p: ["Data operator: {COMPANY}. Person responsible for personal data protection: {DPO_EMAIL}."] },
        {
          h: "2. What we process",
          ul: [
            "Account: e-mail, display name, chosen learning track. We do not store a password.",
            "Phone (optional): only an irreversible hash; the number itself is not stored.",
            "Checks: what you submit for analysis (text, link, screenshot, audio) is used to produce a verdict. Only a masked identifier, a hash, the risk score and the explanation are kept.",
            "Reports: category, anonymised description, region, the scammer identifier as a hash. We do not ask for the victim's name.",
            "Consents: which consent, policy version, time and a hash of the IP address as evidence.",
          ],
        },
        {
          h: "3. Purposes and legal bases",
          p: ["We process data to give scam-risk verdicts, keep your learning progress, protect relatives when you consent, and improve the community report picture. Basis: your consent (withdrawable at any time) and our legitimate interest in the security of the service."],
        },
        {
          h: "4. Third parties and cross-border transfer",
          p: [
            "For AI analysis, the text, image or audio you submit is sent to Google Gemini (Google LLC). Google's servers are outside Kazakhstan, so this is a cross-border transfer. We strip metadata (EXIF, geolocation) from images first.",
            "Do not submit passports, card numbers, SMS codes or other sensitive data.",
            "Hosting and infrastructure: {{HOSTING_PROVIDER}} (to be named before launch). We do not sell data or pass it to ad networks.",
          ],
        },
        {
          h: "5. Retention",
          ul: [
            "Check results: 90 days, then deleted automatically (disputed ones are kept until resolved).",
            "Account: while it exists. After a deletion request there is a 14-day grace period; then personal data is irreversibly anonymised.",
            "Radar reports: when an account is deleted the author is anonymised and the report stays unlinked from you so the shared threat picture is not broken.",
            "Consent records: while the account exists plus 3 years, as evidence.",
          ],
        },
        {
          h: "6. Your rights",
          ul: [
            "Get a copy of your data: Settings → Privacy → Download my data.",
            "Withdraw consent or delete your account: same place, at most two clicks.",
            "Ask for correction and complain to the supervisory authority.",
            "If you are not registered: write to {DPO_EMAIL} and we will answer within the legal time limit.",
          ],
        },
        { h: "7. Children", p: ["If you are under 18, full use needs a legal guardian's consent. Until it is confirmed, your reports do not reach the public radar and your name is not shown on the leaderboard.", "We ask only for the year and month of birth. Consent is given by a guardian in your QorgauAI family circle. We do not check documents: the guardian confirms that they are your parent or legal guardian, and this action is recorded in the audit log."] },
        { h: "8. Changes", p: ["For material changes we bump the policy version ({VERSION}) and ask you to confirm consent again."] },
      ],
    },
    terms: {
      title: "Terms of Service",
      lead: "Rules for using QorgauAI. By using the service you accept these terms.",
      sections: [
        { h: "1. What the service does", p: ["QorgauAI helps you spot signs of fraud in messages, links, numbers and calls. A verdict is built from rules, an AI model and community data."] },
        {
          h: "2. Verdicts are advisory",
          p: ["A risk score is not a legal opinion, financial advice or a guarantee. The AI can be wrong. Before sending money, verify in the official app or by calling the bank number on the back of your card."],
        },
        {
          h: "3. Prohibited use",
          ul: [
            "Using the API for bulk data collection, bypassing limits or training competing models.",
            "Filing knowingly false reports or inflating reputation.",
            "Submitting other people's personal data without the right to do so.",
            "Using the service to prepare scams, for example testing whether a text 'passes'.",
          ],
        },
        { h: "4. Account", p: ["You are responsible for activity under your account. We may restrict access if these terms are broken."] },
        { h: "5. Liability", p: ["The service is provided \"as is\". To the extent the law allows, we are not liable for losses from decisions made solely on a verdict."] },
        { h: "6. Governing law", p: ["The law of the Republic of Kazakhstan applies. Disputes are resolved under Kazakh law after an attempt to settle by e-mail at {DPO_EMAIL}."] },
      ],
    },
    cookies: {
      title: "Cookie Policy",
      lead: "Which cookies and local storage QorgauAI uses and how to change your choice.",
      sections: [
        { h: "1. Categories", ul: ["Necessary: always on; the service cannot work without them (sign-in, remembering your choice).", "Preferences: language and large text. Without your consent they last only until the browser closes.", "Analytics: off by default. Loaded only after you click Accept."] },
        { h: "2. Cookie table", p: ["The full list is below."] },
        { h: "3. Changing your choice", p: ["Use \"Cookie settings\" at the bottom of any page. You can change it any time; Reject all and Accept all carry equal weight."] },
      ],
    },
    refund: {
      title: "Refund Policy (B2B partners)",
      lead: "QorgauAI is free for citizens: you never pay for message checks or learning. This policy covers only prepaid API request packs.",
      sections: [
        { h: "1. Who it applies to", p: ["Organisations buying request packs to embed checks in their own services."] },
        { h: "2. Refund of unused balance", ul: ["You can request a refund for unused requests within 14 days of paying for a pack.", "The refund is pro rata to the unused balance at the pack price.", "Payout within 10 business days after the request is confirmed."] },
        { h: "3. When a refund is not possible", p: ["Used requests are not refunded. If the pack was paid more than 14 days ago, the balance rolls over to the next period but is not paid back in cash. Details are confirmed in the contract."] },
        { h: "4. How to request", p: ["E-mail {DPO_EMAIL} with the invoice number. Exact payment and VAT terms are on the pricing page."] },
      ],
    },
  },
};
