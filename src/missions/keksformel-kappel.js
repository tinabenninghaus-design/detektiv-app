export const keksformelKappelMission = {
  slug: "keksformel-kappel",
  title: "Die verschwundene Keksformel",
  location: "Kappel-Grafenhausen",

  // Fallback nur für lokale Tests, solange Supabase noch nicht komplett verbunden ist.
  demoAccessCode: "KAPPEL2026",

  // Eigener Spielstand pro Mission. Bei Bedarf zum kompletten Neustart localStorage.clear() ausführen.
  storageKey: "meister_kruemel_save_v1_keksformel-kappel",

  // Supabase-Projekt-URL. Die URL ist aus deinem Projekt-Screenshot übernommen.
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,

  // HIER musst du gleich deinen anon public key aus Supabase einfügen.
  // Supabase: Project Settings → API → Project API keys → anon public
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,

  startMapsUrl:
    "https://www.google.com/maps/place/St.+Cyprian+und+Justina/@48.2903035,6.5287539,141837m/data=!3m1!1e3!4m10!1m2!2m1!1sKirche+Kappel!3m6!1s0x47913a0dcd161049:0x64d387c6bb1bf4e8!8m2!3d48.2903035!4d7.7482363!15sCg1LaXJjaGUgS2FwcGVsWg8iDWtpcmNoZSBrYXBwZWySAQ9jYXRob2xpY19jaHVyY2iaASRDaGREU1VoTk1HOW5TMFZKUTBGblNVUndhV0Z4YlRsM1JSQULgAQD6AQQIABAV!16s%2Fg%2F11c54_1y5k?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D",
};
