import { translations } from "./translations.js";

const DEFAULT_LANGUAGE = "mn";
const LANGUAGES = ["en", "mn", "ko"];

export function getCurrentLanguage() {
  const language = localStorage.getItem("language");

  return LANGUAGES.includes(language)
    ? language
    : DEFAULT_LANGUAGE;
}

export function setLanguage(language) {
  if (LANGUAGES.includes(language)) {
    localStorage.setItem("language", language);
  }
}

export function t(path) {
  const language = getCurrentLanguage();
  const keys = path.split(".");

  const lookup = (dictionary) => keys.reduce((value, key) => value?.[key], dictionary);
  return lookup(translations[language]) ?? lookup(translations.en) ?? path;
}

export function toggleLanguage() {
  const current = getCurrentLanguage();
  const currentIndex = LANGUAGES.indexOf(current);

  const nextIndex = (currentIndex + 1) % LANGUAGES.length;
  const next = LANGUAGES[nextIndex];

  setLanguage(next);
  return next;
}

// Номын { en, mn } өгөгдөл болон хуучин энгийн утгуудыг дэмжинэ.
export function getLocalizedValue(value, fallback = "") {
  if (value == null) return fallback;
  if (Array.isArray(value)) return value.map((item) => getLocalizedValue(item, fallback));
  if (typeof value === "object") {
    if (LANGUAGES.some((language) => language in value)) {
      return value[getCurrentLanguage()] || value.en || value.mn || fallback;
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, getLocalizedValue(item, fallback)]));
  }
  return value;
}

export function formatDate(value) {
  if (!value) return "";
  const parts = String(value).split(/[.-]/);
  if (parts.length !== 3) return value;
  let year, month, day;
  if (parts[0].length === 4) [year, month, day] = parts;
  else if (parts[2].length === 4) [day, month, year] = parts;
  else return value;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return value;
  if (getCurrentLanguage() === "mn") return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
  return new Intl.DateTimeFormat(getCurrentLanguage() === "ko" ? "ko-KR" : "en-US", {year: "numeric", month: "long", day: "numeric"}).format(date);
}
