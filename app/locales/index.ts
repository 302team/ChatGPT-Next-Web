import cn from "./cn";
import en from "./en";
import pt from "./pt";
import tw from "./tw";
import id from "./id";
import fr from "./fr";
import es from "./es";
import it from "./it";
import tr from "./tr";
import jp from "./jp";
import de from "./de";
import vi from "./vi";
import ru from "./ru";
import no from "./no";
import cs from "./cs";
import ko from "./ko";
import ar from "./ar";
import bn from "./bn";
import sk from "./sk";
import { merge } from "../utils/merge";

import type { LocaleType } from "./cn";
export type { LocaleType, PartialLocaleType } from "./cn";

const ALL_LANGS = {
  cn,
  en,
  tw,
  pt,
  jp,
  ko,
  id,
  fr,
  es,
  it,
  tr,
  de,
  vi,
  ru,
  cs,
  no,
  ar,
  bn,
  sk,
};

export type Lang = keyof typeof ALL_LANGS;

export const AllLangs = Object.keys(ALL_LANGS) as Lang[];

export const ALL_LANG_OPTIONS: Record<Lang, string> = {
  cn: "简体中文",
  en: "English",
  pt: "Português",
  tw: "繁體中文",
  jp: "日本語",
  ko: "한국어",
  id: "Indonesia",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  tr: "Türkçe",
  de: "Deutsch",
  vi: "Tiếng Việt",
  ru: "Русский",
  cs: "Čeština",
  no: "Nynorsk",
  ar: "العربية",
  bn: "বাংলা",
  sk: "Slovensky",
};

const LANG_KEY = "lang";
const DEFAULT_LANG = "en";

const fallbackLang = en;
const targetLang = ALL_LANGS[getLang()] as LocaleType;

// if target lang missing some fields, it will use fallback lang string
merge(fallbackLang, targetLang);

export default fallbackLang as LocaleType;

export const langCodeMap = {
  "zh-CN": "cn",
  "en-US": "en",
  "pt-BR": "pt",
  "zh-TW": "tw",
  "ja-JP": "jp",
  "ko-KR": "ko",
  "id-ID": "id",
  "fr-FR": "fr",
  "es-ES": "es",
  "it-IT": "it",
  "tr-TR": "tr",
  "de-DE": "de",
  "vi-VN": "vi",
  "ru-RU": "ru",
  "cs-CZ": "cs",
  "no-NO": "no",
  "ar-SA": "ar",
  "bn-BD": "bn",
  "sk-SK": "sk",
} as Record<string, string>;

export function getLangCode(lang: string) {
  return langCodeMap[lang] || "en";
}

function getLangFromSearchParams() {
  let lang = "";
  try {
    let hash = window.location.hash;
    if (hash.includes("lang=")) {
      const query = hash.split("?").pop();
      const langRecord = query?.split("&").find((q) => q.includes("lang"));
      if (langRecord) {
        const locale = langRecord.split("=")[1];
        lang = getLangCode(locale);
        localStorage.setItem("lang", lang);
      }
    }
  } catch (error) {}

  return lang;
}

function getItem(key: string) {
  try {
    const lang = getLangFromSearchParams();
    return lang ? lang : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function getLanguage() {
  try {
    return navigator.language.toLowerCase();
  } catch {
    return DEFAULT_LANG;
  }
}

export function getLang(): Lang {
  const savedLang = getItem(LANG_KEY);

  if (AllLangs.includes((savedLang ?? "") as Lang)) {
    return savedLang as Lang;
  }

  const lang = getLanguage();

  for (const option of AllLangs) {
    if (lang.includes(option)) {
      return option;
    }
  }

  return DEFAULT_LANG;
}

export function changeLang(lang: Lang) {
  setItem(LANG_KEY, lang);
  location.reload();
}

export function getISOLang() {
  const isoLangString: Record<string, string> = {
    cn: "zh-Hans",
    tw: "zh-Hant",
  };

  const lang = getLang();
  return isoLangString[lang] ?? lang;
}
