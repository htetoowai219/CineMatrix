export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "MMK",
  "THB",
  "SGD",
  "MYR",
  "IDR",
  "PHP",
  "VND",
  "INR",
  "JPY",
  "KRW",
  "AUD",
  "CAD",
] as const;

const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  MMK: "K",
  THB: "฿",
  SGD: "S$",
  MYR: "RM",
  IDR: "Rp",
  PHP: "₱",
  VND: "₫",
  INR: "₹",
  JPY: "¥",
  KRW: "₩",
  AUD: "A$",
  CAD: "C$",
};

export const currencySymbol = (currency?: string): string => {
  const code = (currency || "USD").toUpperCase();
  if (code === "MMK") return "MMK";
  return SYMBOLS[code] || `${code} `;
};

export const formatCurrency = (amount: number, currency?: string): string => {
  const code = (currency || "USD").toUpperCase();
  const value = Number.isFinite(amount) ? amount : 0;
  if (code === "MMK") return `${value.toFixed(2)} MMK`;
  const symbol = SYMBOLS[code];
  return symbol ? `${symbol}${value.toFixed(2)}` : `${code} ${value.toFixed(2)}`;
};
