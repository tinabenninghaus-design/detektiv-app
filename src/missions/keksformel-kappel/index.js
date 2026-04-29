import { pagesDe } from "./pages.de";
import { pagesFr } from "./pages.fr";
import { pagesEn } from "./pages.en";
import { uiText } from "./uiText";
import { initialAnswers } from "./answers";
import { lock } from "./lock";

export const mission = {
  slug: "keksformel-kappel",
  title: "Die verschwundene Keksformel",

  // Wichtig für mehrere Missionen:
  // Assets liegen mission-spezifisch unter public/missions/<slug>/<sprache>/...
  // Beispiel: public/missions/keksformel-kappel/de/header.png
  assetBase: "/missions/keksformel-kappel",

  // Lokaler Test-Fallback, falls Supabase noch nicht verbunden ist.
  // Für Live-Codes ist Supabase zuständig.
  demoAccessCode: "DEMO",

  storageKey: "detektiv_app:keksformel-kappel:v1",
  languageStorageKey: "detektiv_app:keksformel-kappel:language",

  startMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Rathausstra%C3%9Fe%2052%2C%2077966%20Kappel-Grafenhausen",

  reviewUrl: "https://g.page/r/CYxuAwRA_viKEBM/review",
  contactEmail: "info@der-spielzeugladen.de",

  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,

  pages: {
    de: pagesDe,
    fr: pagesFr,
    en: pagesEn,
  },

  uiText,
  initialAnswers,
  lock,
};

export const keksformelKappelMission = mission;
