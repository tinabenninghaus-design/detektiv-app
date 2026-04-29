export const DEFAULT_LANGUAGE = "de";
export const SUPPORTED_LANGUAGES = ["de", "fr", "en"];

export const LANGUAGE_CONFIG = {
  de: {
    label: "Deutsch",
    flag: "🇩🇪",
    assetFolder: "de",
    legacyAssetBase: "/de",
    htmlLang: "de",
  },
  fr: {
    label: "Français",
    flag: "🇫🇷",
    assetFolder: "fr",
    legacyAssetBase: "/fr",
    htmlLang: "fr",
  },
  en: {
    label: "English",
    flag: "🇬🇧",
    assetFolder: "eng",
    legacyAssetBase: "/eng",
    htmlLang: "en",
  },
};

export const LANGUAGE_ASSET_PREFIXES = [
  "/missions",
  ...new Set([
    ...Object.values(LANGUAGE_CONFIG).map((language) => language.legacyAssetBase),
    "/en",
  ]),
];

export const LANGUAGE_MEDIA_KEYS = [
  "image",
  "audio",
  "planImage",
  "planPart1",
  "planPart2",
  "planCompleteImage",
  "hint1Image",
  "hint2Image",
  "hintImage",
  "hint2Image2",
  "nextHintImage",
];

export function normalizeLanguage(lang) {
  const value = String(lang || "").toLowerCase().trim();
  if (value === "fr" || value.startsWith("fr-")) return "fr";
  if (value === "en" || value === "eng" || value.startsWith("en-")) return "en";
  if (value === "de" || value.startsWith("de-")) return "de";
  return DEFAULT_LANGUAGE;
}

export function getLanguageAssetBase(lang, missionAssetBase = "") {
  const language = normalizeLanguage(lang);
  const folder = LANGUAGE_CONFIG[language]?.assetFolder || language;
  const cleanMissionBase = String(missionAssetBase || "").replace(/\/$/, "");

  if (cleanMissionBase) return `${cleanMissionBase}/${folder}`;
  return LANGUAGE_CONFIG[language]?.legacyAssetBase || `/${folder}`;
}

export function languageAsset(lang, file, missionAssetBase = "") {
  if (typeof file !== "string") return file;
  if (!file) return file;
  if (/^(https?:|data:|blob:)/i.test(file)) return file;

  if (LANGUAGE_ASSET_PREFIXES.some((prefix) => file.startsWith(`${prefix}/`))) return file;
  if (!file.startsWith("/")) return file;

  const cleanFile = String(file || "").replace(/^\/+/, "");
  return `${getLanguageAssetBase(lang, missionAssetBase)}/${cleanFile}`;
}

export function localizePageMedia(page, lang, missionAssetBase = "") {
  const localized = { ...page };
  for (const key of LANGUAGE_MEDIA_KEYS) {
    if (localized[key]) localized[key] = languageAsset(lang, localized[key], missionAssetBase);
  }
  return localized;
}
