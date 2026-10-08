/**
 * Kazakhstan's 17 regions and 3 cities of republican significance (after the 2022 reform) — the same
 * list and codes as the backend (Domain/Shared/KzRegions.cs). The first codes are historical
 * city-based ids kept for data compatibility.
 */
export const KZ_REGIONS: { code: string; ru: string; en: string; kk: string; city?: boolean }[] = [
  { code: "AST", ru: "Астана", en: "Astana", kk: "Астана", city: true },
  { code: "ALA", ru: "Алматы", en: "Almaty", kk: "Алматы", city: true },
  { code: "SHY", ru: "Шымкент", en: "Shymkent", kk: "Шымкент", city: true },
  { code: "ABA", ru: "Абайская обл.", en: "Abai Region", kk: "Абай облысы" },
  { code: "KOK", ru: "Акмолинская обл.", en: "Akmola Region", kk: "Ақмола облысы" },
  { code: "AKT", ru: "Актюбинская обл.", en: "Aktobe Region", kk: "Ақтөбе облысы" },
  { code: "ALR", ru: "Алматинская обл.", en: "Almaty Region", kk: "Алматы облысы" },
  { code: "ATY", ru: "Атырауская обл.", en: "Atyrau Region", kk: "Атырау облысы" },
  { code: "UKK", ru: "Восточно-Казахстанская обл.", en: "East Kazakhstan", kk: "Шығыс Қазақстан облысы" },
  { code: "TAR", ru: "Жамбылская обл.", en: "Jambyl Region", kk: "Жамбыл облысы" },
  { code: "TLD", ru: "Жетысуская обл.", en: "Jetisu Region", kk: "Жетісу облысы" },
  { code: "URA", ru: "Западно-Казахстанская обл.", en: "West Kazakhstan", kk: "Батыс Қазақстан облысы" },
  { code: "KAR", ru: "Карагандинская обл.", en: "Karaganda Region", kk: "Қарағанды облысы" },
  { code: "KST", ru: "Костанайская обл.", en: "Kostanay Region", kk: "Қостанай облысы" },
  { code: "KZO", ru: "Кызылординская обл.", en: "Kyzylorda Region", kk: "Қызылорда облысы" },
  { code: "MAN", ru: "Мангистауская обл.", en: "Mangystau Region", kk: "Маңғыстау облысы" },
  { code: "PAV", ru: "Павлодарская обл.", en: "Pavlodar Region", kk: "Павлодар облысы" },
  { code: "PET", ru: "Северо-Казахстанская обл.", en: "North Kazakhstan", kk: "Солтүстік Қазақстан облысы" },
  { code: "TUR", ru: "Туркестанская обл.", en: "Turkistan Region", kk: "Түркістан облысы" },
  { code: "ULY", ru: "Улытауская обл.", en: "Ulytau Region", kk: "Ұлытау облысы" },
];

/** Short tile labels for the cartogram (fit in a small square). */
export const KZ_TILE_LABEL: Record<string, { ru: string; en: string; kk: string }> = {
  AST: { ru: "Астана", en: "Astana", kk: "Астана" },
  ALA: { ru: "Алматы", en: "Almaty", kk: "Алматы" },
  SHY: { ru: "Шымкент", en: "Shymkent", kk: "Шымкент" },
  ABA: { ru: "Абай", en: "Abai", kk: "Абай" },
  KOK: { ru: "Акмола", en: "Akmola", kk: "Ақмола" },
  AKT: { ru: "Актобе", en: "Aktobe", kk: "Ақтөбе" },
  ALR: { ru: "Алм. обл.", en: "Almaty R.", kk: "Алм. обл." },
  ATY: { ru: "Атырау", en: "Atyrau", kk: "Атырау" },
  UKK: { ru: "ВКО", en: "East", kk: "ШҚО" },
  TAR: { ru: "Жамбыл", en: "Jambyl", kk: "Жамбыл" },
  TLD: { ru: "Жетысу", en: "Jetisu", kk: "Жетісу" },
  URA: { ru: "ЗКО", en: "West", kk: "БҚО" },
  KAR: { ru: "Караганда", en: "Karaganda", kk: "Қарағанды" },
  KST: { ru: "Костанай", en: "Kostanay", kk: "Қостанай" },
  KZO: { ru: "Кызылорда", en: "Kyzylorda", kk: "Қызылорда" },
  MAN: { ru: "Мангистау", en: "Mangystau", kk: "Маңғыстау" },
  PAV: { ru: "Павлодар", en: "Pavlodar", kk: "Павлодар" },
  PET: { ru: "СКО", en: "North", kk: "СҚО" },
  TUR: { ru: "Туркестан", en: "Turkistan", kk: "Түркістан" },
  ULY: { ru: "Улытау", en: "Ulytau", kk: "Ұлытау" },
};

/**
 * Tile-grid cartogram (row, col): every unit gets an equal square placed roughly where it is on
 * the map — west to east, north to south. Equal areas keep small regions and cities readable.
 */
export const KZ_TILES: Record<string, [number, number]> = {
  URA: [0, 0], AKT: [0, 1], KST: [0, 2], PET: [0, 3], PAV: [0, 4], UKK: [0, 5],
  ATY: [1, 0], ULY: [1, 1], KAR: [1, 2], KOK: [1, 3], AST: [1, 4], ABA: [1, 5],
  MAN: [2, 0], KZO: [2, 1], TUR: [2, 2], TAR: [2, 3], ALR: [2, 4], TLD: [2, 5],
  SHY: [3, 2], ALA: [3, 4],
};

export const IDENTIFIER_KINDS: { value: string; ru: string; en: string }[] = [
  { value: "PhoneNumber", ru: "Телефон", en: "Phone" },
  { value: "Iban", ru: "Счёт (IBAN)", en: "Account (IBAN)" },
  { value: "CardNumber", ru: "Карта", en: "Card" },
  { value: "Domain", ru: "Сайт / домен", en: "Website / domain" },
  { value: "Url", ru: "Ссылка", en: "Link" },
  { value: "MessengerHandle", ru: "Мессенджер", en: "Messenger" },
  { value: "CryptoWallet", ru: "Крипто-кошелёк", en: "Crypto wallet" },
  { value: "Email", ru: "E-mail", en: "Email" },
];

export const REPORT_CATEGORIES = [
  "BankImpersonationCall",
  "PhishingLink",
  "MessengerAccountTakeover",
  "InvestmentScam",
  "MarketplacePrepayment",
  "IdentityTheftLoan",
  "MoneyMuleRecruitment",
  "DeepfakeImpersonation",
  "RomanceScam",
  "BusinessEmailCompromise",
  "JobOfferScam",
  "Other",
] as const;
