import { useMemo, useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import { defaultMission, missions } from "./missions";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  LANGUAGE_CONFIG,
  LANGUAGE_ASSET_PREFIXES,
  normalizeLanguage,
  languageAsset,
  localizePageMedia,
} from "./i18n/languages";

function getMissionFromUrl() {
  const path = window.location.pathname;
  const slug = path.split("/m/")[1]?.split("/")[0];
  return missions[slug] || defaultMission;
}

const mission = getMissionFromUrl();

const DEMO_ACCESS_CODE = mission.demoAccessCode;
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const START_MAPS_URL = mission.startMapsUrl;

function getImageFallbacks(src) {
  if (!src || typeof src !== "string") return [];

  let path = src;
  try {
    path = new URL(src, window.location.origin).pathname;
  } catch {
    // keep original path
  }

  const candidates = [];
  const add = (value) => {
    if (value && value !== path && !candidates.includes(value)) candidates.push(value);
  };

  const swapJpgJpeg = (value) => {
    if (value.endsWith(".jpeg")) return value.replace(/\.jpeg$/i, ".jpg");
    if (value.endsWith(".jpg")) return value.replace(/\.jpg$/i, ".jpeg");
    return null;
  };

  const swapped = swapJpgJpeg(path);
  if (swapped) add(swapped);

  const missionLangMatch = path.match(/^\/missions\/[^/]+\/(de|fr|eng|en)\/(.+)$/);
  if (missionLangMatch) {
    const legacyLanguagePath = `/${missionLangMatch[1]}/${missionLangMatch[2]}`;
    add(legacyLanguagePath);
    const legacySwapped = swapJpgJpeg(legacyLanguagePath);
    if (legacySwapped) add(legacySwapped);

    const rootPath = `/${missionLangMatch[2]}`;
    add(rootPath);
    const rootSwapped = swapJpgJpeg(rootPath);
    if (rootSwapped) add(rootSwapped);
  }

  const langMatch = path.match(/^\/(de|fr|eng|en)\/(.+)$/);
  if (langMatch) {
    const rootPath = `/${langMatch[2]}`;
    add(rootPath);
    const rootSwapped = swapJpgJpeg(rootPath);
    if (rootSwapped) add(rootSwapped);
  }

  return candidates;
}

function handleImageFallback(event) {
  const img = event.currentTarget;
  const originalSrc = img.dataset.originalSrc || img.getAttribute("src") || "";
  img.dataset.originalSrc = originalSrc;

  const fallbacks = getImageFallbacks(originalSrc);
  const index = Number(img.dataset.fallbackIndex || "0");

  if (fallbacks[index]) {
    img.dataset.fallbackIndex = String(index + 1);
    img.src = fallbacks[index];
    return;
  }

  img.style.display = "none";
}

function MapHint({ lat, lng, radius, title, caption }) {
  return (
    <div style={styles.mapCard}>
      {title ? <div style={styles.mapTitle}>{title}</div> : null}
      <MapContainer
        center={[lat, lng]}
        zoom={17}
        style={styles.mapFrame}
        scrollWheelZoom={false}
      >
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
          tileSize={512}
          zoomOffset={-1}
          attribution="© Mapbox © OpenStreetMap"
        />
        <Circle center={[lat, lng]} radius={radius} />
      </MapContainer>
      <div style={styles.mapCaption}>
        {caption || "Der markierte Bereich zeigt euch ungefähr, wo ihr suchen müsst."}
      </div>
    </div>
  );
}

function TextLines({ text, style }) {
  return (
    <div style={style}>
      {String(text || "").split("\n").map((line, i) => (
        <div key={i} style={styles.line}>
          {line}
        </div>
      ))}
    </div>
  );
}

function ZoomModal({ image, title, onClose }) {
  if (!image) return null;

  return (
    <div style={styles.zoomOverlay} onClick={onClose}>
      <div style={styles.zoomModal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.zoomCloseButton} onClick={onClose}>
          ×
        </button>
        {title ? <div style={styles.zoomTitle}>{title}</div> : null}
        <img src={image} alt={title || "Vergrößerte Ansicht"} style={styles.zoomImage} />
      </div>
    </div>
  );
}

function PlanAssembly({ part1, part2, completeImage, assembled, onAssemble, onZoom, ui }) {
  const [snapping, setSnapping] = useState(false);

  const playSnapSound = () => {
    try {
      const audio = new Audio("/snap.mp3");
      audio.volume = 0.65;
      audio.play().catch(() => {});
    } catch {
      // Sound ist optional – falls keine Datei vorhanden ist, läuft die App trotzdem.
    }
  };

 const handleAssemble = () => {
  if (assembled) return;

  playSnapSound();
  onAssemble();
};

  return (
    <div style={styles.planAssemblyCard}>
      <div style={styles.planAssemblyTitle}>{ui.planAssemblyTitle}</div>

      {!assembled ? (
        <>
          <TextLines text={ui.planAssemblyText} style={styles.planAssemblyText} />

          <div style={styles.planPartsPreview}>
            <img
              src={part1}
              alt={ui.planPart1Title}
              style={{
                ...styles.planPartImage,
                ...(snapping ? styles.planPartImageSnapping : {}),
              }}
              onClick={() => onZoom(part1, ui.planPart1Title)}
            />
            <img
              src={part2}
              alt={ui.planPart2Title}
              style={{
                ...styles.planPartImageFlying,
                ...(snapping ? styles.planPartImageFlyingSnapping : {}),
              }}
              onClick={() => onZoom(part2, ui.planPart2Title)}
            />

            {snapping ? (
              <div style={styles.snapText}>
                {ui.planAssemblySnapTitle}
                <br />
                {ui.planAssemblySnapText}
              </div>
            ) : null}
          </div>

          <button
            style={{
              ...styles.primaryButton,
              ...(snapping ? styles.primaryButtonDisabled : {}),
            }}
            onClick={handleAssemble}
            disabled={snapping}
          >
            {snapping ? ui.planAssemblyWorking : ui.planAssemblyButton}
          </button>
        </>
      ) : (
        <>
          <TextLines text={ui.planAssemblyDoneText} style={styles.planAssemblyText} />

          <div style={styles.completePlanWrap}>
            <img
              src={completeImage}
              alt={ui.planCompleteTitle}
              style={styles.completePlanImage}
              onClick={() => onZoom(completeImage, ui.planCompleteTitle)}
              onError={(e) => {
                handleImageFallback(e);
              }}
            />
            <div style={styles.zoomHint}>{ui.zoomHint}</div>
          </div>
        </>
      )}
    </div>
  );
}

function HintCard({ title, text, image, image2, onImageClick, zoomHintText = "Zum Vergrößern antippen" }) {
  return (
    <div style={styles.hintCard}>
      <div style={styles.hintCardTitle}>{title}</div>
      {image ? (
        <div style={styles.hintImageWrap}>
          <img
            src={image}
            alt={title}
            style={{ ...styles.hintImage, cursor: onImageClick ? "zoom-in" : "default" }}
            onClick={onImageClick}
            onError={(e) => {
              handleImageFallback(e);
            }}
          />
          {onImageClick ? <div style={styles.zoomHint}>{zoomHintText}</div> : null}
        </div>
      ) : null}
      {image2 ? (
        <div style={styles.hintImageWrap}>
          <img
            src={image2}
            alt={title ? `${title} 2` : "Zusätzlicher Hinweis"}
            style={styles.hintImage}
            onError={(e) => {
              handleImageFallback(e);
            }}
          />
        </div>
      ) : null}
      <TextLines text={text} style={styles.hintCardText} />
    </div>
  );
}

function LockWheel({ topValue, value, bottomValue, onUp, onDown }) {
  return (
    <div style={styles.lockWheel}>
      <button style={styles.lockArrowButton} onClick={onUp}>▲</button>
      <div style={styles.lockMiniValue}>{topValue}</div>
      <div style={styles.lockMainValue}>{value}</div>
      <div style={styles.lockMiniValue}>{bottomValue}</div>
      <button style={styles.lockArrowButton} onClick={onDown}>▼</button>
    </div>
  );
}

function buildPagesForLanguage(lang) {
  const rawPages = mission.pages?.[lang] || mission.pages?.[DEFAULT_LANGUAGE] || [];
  return rawPages.map((page) => localizePageMedia(page, lang, mission.assetBase));
}

const pagesByLanguage = SUPPORTED_LANGUAGES.reduce((acc, lang) => {
  acc[lang] = buildPagesForLanguage(lang);
  return acc;
}, {});

const uiText = mission.uiText || {};
const initialAnswers = mission.initialAnswers || {};
const lockAnimals = mission.lock?.animals || [];
const lockSymbols = mission.lock?.symbols || [];


function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[.!?,;:]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}
const STORAGE_KEY = mission.storageKey;
const LANGUAGE_STORAGE_KEY = mission.languageStorageKey || `${STORAGE_KEY}:language`;

function loadSavedGame() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}


async function redeemAccessCode({ code, missionSlug }) {
  const trimmedCode = String(code || "").trim();

  if (!trimmedCode) {
    return {
      success: false,
      message: "Bitte gebt einen Zugangscode ein.",
    };
  }

  const supabaseUrl = mission.supabaseUrl;
  const supabaseAnonKey = mission.supabaseAnonKey;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseAnonKey.includes("HIER_ANON_KEY")
  ) {
    // Lokaler Fallback, damit die App während der Einrichtung weiterhin testbar bleibt.
    if (normalize(trimmedCode) === normalize(DEMO_ACCESS_CODE)) {
      return { success: true, mode: "demo" };
    }

    return {
      success: false,
      message: "Supabase ist noch nicht vollständig eingerichtet.",
    };
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/redeem_access_code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      p_code: trimmedCode,
      p_mission_slug: missionSlug,
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      message: "Die Code-Prüfung ist gerade nicht erreichbar. Bitte versucht es erneut.",
    };
  }

  return response.json();
}

function LanguageStartScreen({ onSelect }) {
  return (
    <>
      <div style={styles.headerImageWrap}>
        <img
          src={languageAsset(DEFAULT_LANGUAGE, "/header.png", mission.assetBase)}
          alt="Mission"
          style={styles.headerImage}
          onError={(e) => {
            handleImageFallback(e);
          }}
        />
      </div>

      <div style={styles.accessCard}>
        <div style={styles.accessTitle}>Sprache wählen</div>
        <div style={styles.accessText}>
          Choisir la langue · Choose your language
        </div>

        <div style={styles.languageChoiceGrid}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const config = LANGUAGE_CONFIG[lang];
            return (
              <button
                key={lang}
                type="button"
                style={styles.languageChoiceButton}
                onClick={() => onSelect(lang)}
              >
                <span style={styles.languageChoiceFlag}>{config.flag}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function App() {
  const savedGame = loadSavedGame();

  const [language, setLanguageState] = useState(() => {
    const savedLanguage =
      savedGame?.language ||
      (() => {
        try {
          return (
            window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ||
            window.localStorage.getItem("detektiv_app_language")
          );
        } catch {
          return null;
        }
      })();

    return savedLanguage ? normalizeLanguage(savedLanguage) : null;
  });

  const languageIsSelected = Boolean(language);
  const activeLanguage = language || DEFAULT_LANGUAGE;
  const setLanguage = (nextLanguage) => setLanguageState(normalizeLanguage(nextLanguage));
  const pages = pagesByLanguage[activeLanguage] || pagesByLanguage[DEFAULT_LANGUAGE];
  const ui = uiText[activeLanguage] || uiText[DEFAULT_LANGUAGE];
  const asset = (file) =>
    languageAsset(activeLanguage, `/${String(file || "").replace(/^\/+/, "")}`, mission.assetBase);
  const hasSavedAccess = savedGame?.accessGranted === true;
  const [accessGranted, setAccessGranted] = useState(hasSavedAccess);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [currentPage, setCurrentPage] = useState(hasSavedAccess ? savedGame?.currentPage ?? 0 : 0);
  const [answers, setAnswers] = useState(hasSavedAccess ? savedGame?.answers ?? initialAnswers : initialAnswers);
  const [solved, setSolved] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [answerError, setAnswerError] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [choiceError, setChoiceError] = useState("");
  const [wrongChoice, setWrongChoice] = useState("");
  const [showTaskMap, setShowTaskMap] = useState(false);
  const [showNextMap, setShowNextMap] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomTitle, setZoomTitle] = useState("");
  const [planAssembled, setPlanAssembled] = useState(hasSavedAccess ? savedGame?.planAssembled ?? false : false);

  const [finaleRevealShown, setFinaleRevealShown] = useState(false);
  const [finaleLockShown, setFinaleLockShown] = useState(false);

  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
  const [activeInfoPage, setActiveInfoPage] = useState("menu");

  const [problemStation, setProblemStation] = useState("");
  const [problemDevice, setProblemDevice] = useState("");
  const [problemText, setProblemText] = useState("");

  const [secretResetTapCount, setSecretResetTapCount] = useState(0);

  const [secretCornerTapCount, setSecretCornerTapCount] = useState(0);

  const [lockLeft, setLockLeft] = useState(1);
  const [lockAnimalIndex, setLockAnimalIndex] = useState(0);
  const [lockSymbolIndex, setLockSymbolIndex] = useState(0);
  const [lockOpened, setLockOpened] = useState(false);
  const [lockAttempts, setLockAttempts] = useState(0);

  const [showLockHint1, setShowLockHint1] = useState(false);
  const [showLockHint2, setShowLockHint2] = useState(false);
  const [showLockSolution, setShowLockSolution] = useState(false);

  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [arrivedAtStart, setArrivedAtStart] = useState(false);

  const page = pages[currentPage];
  const isAdminMode =
    new URLSearchParams(window.location.search).get("admin") === "1" ||
    window.location.hash === "#admin";
  const isChoiceTask = page.taskMode === "choice";
  const isPhotoChoiceTask = page.taskMode === "photoChoice";

  const selectedChoice =
    (isChoiceTask || isPhotoChoiceTask) && page.answerKey
      ? answers[page.answerKey]
      : "";

  const selectedChoiceData =
    (isChoiceTask || isPhotoChoiceTask) && page.choiceOptions
      ? page.choiceOptions.find((option) => option.value === selectedChoice)
      : null;

  const effectiveSolved =
    solved || ((isChoiceTask || isPhotoChoiceTask) && !!selectedChoice);

  const currentAnimal = lockAnimals[lockAnimalIndex];
  const currentSymbol = lockSymbols[lockSymbolIndex];
  const getLocalizedOptionLabel = (item) => {
    if (activeLanguage === "fr") return item.labelFr || item.label;
    if (activeLanguage === "en") return item.labelEn || item.label;
    return item.label;
  };
  const getLockAnimalLabel = getLocalizedOptionLabel;
  const getLockSymbolLabel = getLocalizedOptionLabel;
  const lockSolution = mission.lock?.solution || {};
  const correctLeft = Number(lockSolution.number || 3);
  const correctAnimalLabel = lockSolution.animal || "Elefant";
  const correctSymbolLabel = lockSolution.symbol || "Sonne";
  const lockHintLevel = Math.min(lockAttempts, 3);
  const shouldShowTaskCard = !page.planImage || showPlan;
  const currentResultBox = selectedChoiceData?.resultBox || page.resultBox;

  const resetGameForTesting = () => {
    localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        localStorage.removeItem("detektiv_app_language");
    window.location.reload();
  };

  const handleSecretResetTouch = (event) => {
    if (event.touches.length !== 3) return;

    setSecretResetTapCount((prev) => {
      const next = prev + 1;

      if (next >= 2) {
        if (window.confirm("Testmodus: Spiel wirklich neu starten?")) {
          localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        localStorage.removeItem("detektiv_app_language");
          window.location.reload();
        }
        return 0;
      }

      return next;
    });
  };

  const handleSecretCornerReset = () => {
    setSecretCornerTapCount((prev) => {
      const next = prev + 1;

      if (next >= 7) {
        if (window.confirm("Testmodus: Spiel wirklich neu starten?")) {
          localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        localStorage.removeItem("detektiv_app_language");
          window.location.reload();
        }
        return 0;
      }

      return next;
    });
  };

  const closeInfoMenu = () => {
    setInfoMenuOpen(false);
    setActiveInfoPage("menu");
  };

  const openInfo = (type) => {
    setInfoMenuOpen(true);
    setActiveInfoPage(type);
  };

  const sendProblemReport = () => {
    const subject = encodeURIComponent(ui.problemEmailSubject || "Problem bei der Schnitzeljagd-App");
    const body = encodeURIComponent(
      `${ui.problemStationLabel || "Station / Seite"}: ${problemStation || "-"}\n\n` +
        `${ui.problemDeviceLabel || "Gerät / Browser"}: ${problemDevice || "-"}\n\n` +
        `${ui.problemDescriptionLabel || "Was ist passiert?"}\n${problemText || "-"}`
    );

    const contactEmail = mission.contactEmail || "info@der-spielzeugladen.de";
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    if (!language) return;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      window.localStorage.removeItem("detektiv_app_language");
    } catch {}

    try {
      document.documentElement.lang = LANGUAGE_CONFIG[language]?.htmlLang || language;
    } catch {}
  }, [language]);

  useEffect(() => {
    if (!language) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          language,
          accessGranted,
          currentPage,
          answers,
          planAssembled,
        })
      );
    } catch {
      // Speicherung ist nicht verfügbar – die App läuft trotzdem weiter.
    }
  }, [language, accessGranted, currentPage, answers, planAssembled]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentPage]);


  const showProgress = page.type === "riddle" || page.type === "finale";
  const totalStations = pages.filter((p) => p.type === "riddle" || p.type === "finale").length;
  const currentStationIndex = pages
    .slice(0, currentPage + 1)
    .filter((p) => p.type === "riddle" || p.type === "finale").length;

  const progress = useMemo(() => {
    if (!showProgress) return 0;
    return Math.round((currentStationIndex / totalStations) * 100);
  }, [showProgress, currentStationIndex, totalStations]);

  const openZoom = (image, title) => {
    setZoomImage(image);
    setZoomTitle(title || "Vergrößerte Ansicht");
  };

  const closeZoom = () => {
    setZoomImage(null);
    setZoomTitle("");
  };

  const playSound = (src, volume = 0.3) => {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  };

  const vibrate = (pattern) => {
    try {
      if ("vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  const handleAnswerChange = (value) => {
    if (!page.answerKey) return;
    setAnswers((prev) => ({ ...prev, [page.answerKey]: value }));
    setAnswerError(false);
  };

  const handleChoiceSelect = (value) => {
    if (!page.answerKey) return;

    const expectedChoiceValue = page.solutionValue || page.correctChoiceValue;
    if (expectedChoiceValue && value !== expectedChoiceValue) {
      const wrongOption = page.choiceOptions?.find((option) => option.value === value);
      const fallbackWrongLabel =
        activeLanguage === "fr" ? "Ce choix" : activeLanguage === "en" ? "This choice" : "Diese Auswahl";
      const wrongLabel = wrongOption?.label?.replace(/[⭐❤️🌼☀️]/g, "").trim() || fallbackWrongLabel;
      setWrongChoice(value);
      setChoiceError(`${wrongLabel} ${ui.choiceWrongSuffix}`);
      return;
    }

    if (page.requiredChoiceValue && value !== page.requiredChoiceValue) {
      setChoiceError(page.wrongChoiceText || ui.fluchtplanWrong);
      return;
    }

    if (page.requiresPhotoBeforeChoice && !photoPreview) {
      setChoiceError(ui.needPhoto);
      return;
    }

    setChoiceError("");
    setWrongChoice("");
    setAnswers((prev) => ({ ...prev, [page.answerKey]: value }));

    if (page.autoAdvanceOnChoiceValue && value === page.autoAdvanceOnChoiceValue) {
      nextPage();
      return;
    }

    setSolved(true);
    setHintLevel(0);
    setShowSolution(false);
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setChoiceError("");
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const resetRiddleState = () => {
    setSolved(false);
    setShowSolution(false);
    setHintLevel(0);
    setAnswerError(false);
    setChoiceError("");
    setWrongChoice("");
    setShowTaskMap(false);
    setShowNextMap(false);
    setShowPlan(false);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const resetLockState = () => {
    setLockLeft(1);
    setLockAnimalIndex(0);
    setLockSymbolIndex(0);
    setLockOpened(false);
    setLockAttempts(0);
    setShowLockHint1(false);
    setShowLockHint2(false);
    setShowLockSolution(false);
  };

  const checkAnswer = () => {
    if (!page.answerKey) return;

    if (!page.correctAnswers || page.correctAnswers.length === 0) {
      setSolved(true);
      setAnswerError(false);
      return;
    }

    const value = normalize(answers[page.answerKey]);
    const isCorrect = page.correctAnswers.some((a) => normalize(a) === value);

    if (isCorrect) {
      setSolved(true);
      setAnswerError(false);
      return;
    }

    setAnswerError(true);
  };

  const revealSolution = () => {
    setShowSolution(true);
    setSolved(true);
    setHintLevel(0);
    setAnswerError(false);
  };

  const stepNumber = (value, direction) => {
    if (direction === "up") return value === 9 ? 1 : value + 1;
    return value === 1 ? 9 : value - 1;
  };

  const stepList = (index, direction, list) => {
    if (direction === "up") return index === list.length - 1 ? 0 : index + 1;
    return index === 0 ? list.length - 1 : index - 1;
  };

  const getNumberAbove = (value) => (value === 1 ? 9 : value - 1);
  const getNumberBelow = (value) => (value === 9 ? 1 : value + 1);
  const getItemAbove = (list, index) => list[index === 0 ? list.length - 1 : index - 1];
  const getItemBelow = (list, index) => list[index === list.length - 1 ? 0 : index + 1];

  const tryOpenLock = () => {
  const selectedNumber = Number(lockLeft);
  const selectedAnimal = normalize(currentAnimal?.label);
  const selectedSymbol = normalize(currentSymbol?.label);

  const isCorrect =
    selectedNumber === correctLeft &&
    selectedAnimal === normalize(correctAnimalLabel) &&
    selectedSymbol === normalize(correctSymbolLabel);

  if (isCorrect) {
    vibrate([80, 40, 120]);
    setTimeout(() => {
      playSound("/unlock.mp3", 0.7);
    }, 120);

    setShowLockHint1(false);
    setShowLockHint2(false);
    setShowLockSolution(false);
    setLockOpened(true);
    return;
  }

  setLockAttempts((prev) => prev + 1);
};

  const unlockMission = async () => {
    if (isRedeemingCode) return;

    if (!String(accessCode || "").trim()) {
      setAccessError(ui.emptyCode);
      return;
    }

    setAccessError("");
    setIsRedeemingCode(true);

    try {
      const result = await redeemAccessCode({
        code: accessCode,
        missionSlug: mission.slug,
      });

      if (result.success) {
        setAccessGranted(true);
        setAccessError("");
        setCurrentPage(1);
        return;
      }

      setAccessError(activeLanguage === "de" ? result.message || ui.invalidCode : ui.invalidCode);
    } catch {
      setAccessError(ui.codeCheckUnavailable);
    } finally {
      setIsRedeemingCode(false);
    }
  };

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 0);
      resetRiddleState();
      resetLockState();
      setArrivedAtStart(false);
      setPlanAssembled(false);
      setFinaleRevealShown(false);
      setFinaleLockShown(false);
    }
  };

  return (
    <div style={styles.page}>
      <button
        type="button"
        aria-label="Test Reset"
        style={styles.secretResetTapZone}
        onClick={handleSecretCornerReset}
      />
      <div
        style={styles.wrapper}
        onTouchStart={handleSecretResetTouch}>
        {currentPage === 0 ? (
          <button
            type="button"
            style={styles.infoMenuButton}
            onClick={() => {
              setInfoMenuOpen(true);
              setActiveInfoPage("menu");
            }}
            aria-label="Menü öffnen"
          >
            ☰
          </button>
        ) : null}

        {isAdminMode ? (
          <button style={styles.adminResetButton} onClick={resetGameForTesting}>
            🔄 Test-Neustart
          </button>
        ) : null}

        {!languageIsSelected ? (
          <LanguageStartScreen onSelect={setLanguage} />
        ) : page.type === "access" ? (
          <>
            <div style={styles.headerImageWrap}>
              <img
                src={asset("header.png")}
                alt={`${page.title} ${page.titleLine2 || ""} ${page.titleLine3 || ""}`.trim()}
                style={styles.headerImage}
                onError={(e) => {
                  handleImageFallback(e);
                }}
              />
            </div>

            <div style={styles.startTitleWrap}>
              <div style={styles.startMissionLabel}>{page.title}</div>
              <h1 style={styles.startMainTitle}>{page.titleLine2}</h1>
              <h1 style={styles.startMainTitleBig}>{page.titleLine3}</h1>
            </div>

            <div style={styles.accessCard}>
              <div style={styles.accessTitle}>{ui.accessTitle}</div>
              <div style={styles.accessText}>
                {ui.accessText}
              </div>

              <input
                style={styles.input}
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder={ui.accessPlaceholder}
                disabled={isRedeemingCode}
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck="false"
              />

              <div style={styles.readyText}>
                {ui.readyText}
              </div>

              <button
                style={{
                  ...styles.startButton,
                  ...(isRedeemingCode ? styles.primaryButtonDisabled : {}),
                }}
                onClick={unlockMission}
                disabled={isRedeemingCode}
              >
                {isRedeemingCode ? ui.checkingCode : ui.unlockButton}
              </button>

              {accessError ? <div style={styles.accessErrorBox}>{accessError}</div> : null}
            </div>

            {page.mapHint ? (
              <MapHint
                lat={page.mapHint.lat}
                lng={page.mapHint.lng}
                radius={page.mapHint.radius}
                title={page.mapHint.title}
                caption={ui.mapCaption}
              />
            ) : null}
          </>
        ) : page.type === "rules" ? (
          <>
            <div style={styles.startTitleWrap}>
              <div style={styles.startMissionLabel}>{page.title}</div>
              <h1 style={styles.startMainTitle}>{page.titleLine2}</h1>
            </div>

            <TextLines text={page.intro} style={styles.rulesIntroBox} />

            <div style={styles.rulesList}>
              {page.rules?.map((rule) => (
                <div key={rule.title} style={styles.ruleItem}>
                  <div style={styles.ruleIcon}>{rule.icon}</div>
                  <div>
                    <div style={styles.ruleTitle}>{rule.title}</div>
                    <div style={styles.ruleText}>{rule.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <button style={styles.acceptRulesButton} onClick={nextPage}>
              {page.acceptText}
            </button>
          </>
        ) : page.type === "start" ? (
          <>
            <div style={styles.startTitleWrap}>
              <div style={styles.startMissionLabel}>{page.title}</div>
              <h1 style={styles.startMainTitle}>{page.titleLine2}</h1>
              <h1 style={styles.startMainTitleBig}>{page.titleLine3}</h1>
            </div>

            {!arrivedAtStart ? (
              <>
                <div style={styles.startLocationCard}>
                  <div style={styles.startLocationTitle}>{ui.beforeMission}</div>

                  <div style={styles.startLocationText}>
                    {ui.startPlace}
                  </div>

                  <div style={styles.startLocationAddress}>
                    {ui.startAddress}
                  </div>

                  <div style={styles.startLocationHint}>
                    <TextLines text={ui.startHint} style={styles.startLocationHint} />
                  </div>

                  <button
                    style={styles.primaryButton}
                    onClick={() => setArrivedAtStart(true)}
                  >
                    {ui.atStart}
                  </button>
                </div>

                <a
                  href={START_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.startLocationLinkSmall}
                >
                  {ui.mapsLink}
                </a>
              </>
            ) : null}

            {arrivedAtStart ? (
              <>
                <div style={styles.startStoryCard}>
                  <TextLines text={page.storyBox} style={styles.startStoryText} />
                  <div style={styles.startSideCharacterWrap}>
                    <img
                      src="/detektiv-zwei.png"
                      alt="Detektiv Figur"
                      style={styles.startSideCharacter}
                      onError={(e) => {
                        handleImageFallback(e);
                      }}
                    />
                  </div>
                </div>

                <div style={styles.mostWantedCard}>
                  <img
                    src={asset("wanted.jpg")}
                    alt="Meister der Krümel Most Wanted"
                    style={styles.mostWantedImage}
                    onError={(e) => {
                      handleImageFallback(e);
                    }}
                  />
                </div>

                {page.audio ? (
                  <div style={styles.audioPlayerCard}>
                    <div style={styles.audioPlayerMainText}>
                      {page.audioTitle || "🎧 Nachricht anhören"}
                    </div>
                    <button
                      style={styles.audioPlayButton}
                      onClick={() => {
                        const audio = document.getElementById(`page-audio-${page.id}`);
                        if (audio) {
                          audio.currentTime = 0;
                          audio.play();
                        }
                      }}
                    >
                      ▶
                    </button>
                    <audio id={`page-audio-${page.id}`} src={page.audio} preload="auto" />
                  </div>
                ) : null}

                <button style={styles.startButton} onClick={nextPage}>
                  {ui.startMissionButton}
                </button>
              </>
            ) : null}
          </>
        ) : (
          <>
            {page.type !== "recipe" ? (
              <div style={styles.headerTop}>
                <div style={styles.characterClean}>
                <img
                  src="/detektiv-zwei.png"
                  alt="Detektiv"
                  style={styles.characterImageClean}
                  onError={(e) => {
                    handleImageFallback(e);
                  }}
                />
              </div>

              <div style={styles.titleAreaWide}>
                <div style={styles.kicker}>{page.title}</div>
                {page.titleLine2 ? <h1 style={styles.mainTitle}>{page.titleLine2}</h1> : null}
                {page.titleLine3 ? <h1 style={styles.mainTitle}>{page.titleLine3}</h1> : null}
                </div>
              </div>
            ) : null}

            {showProgress ? (
              <div style={styles.progressWrap}>
                <div style={styles.progressOuter}>
                  <div style={{ ...styles.progressInner, width: `${progress}%` }} />
                </div>
              </div>
            ) : null}

            {page.image && page.type !== "finale" ? (
              <div style={styles.heroCard}>
                <div style={styles.heroImageInner}>
                  <img
                    src={page.image}
                    alt={page.titleLine2 || page.title}
                    style={styles.heroImage}
                    onError={(e) => {
                      handleImageFallback(e);
                    }}
                  />
                </div>
              </div>
            ) : null}

            {page.type === "riddle" ? (
              <div style={styles.stackGap}>
                <TextLines text={page.storyBox} style={styles.storyBox} />

                {page.audio ? (
                  <div style={styles.audioPlayerCard}>
                    <div style={styles.audioPlayerMainText}>
                      {page.audioTitle || "🎧 Hinweis anhören"}
                    </div>
                    <button
                      style={styles.audioPlayButton}
                      onClick={() => {
                        const audio = document.getElementById(`page-audio-${page.id}`);
                        if (audio) {
                          audio.currentTime = 0;
                          audio.play();
                        }
                      }}
                    >
                      ▶
                    </button>
                    <audio id={`page-audio-${page.id}`} src={page.audio} preload="auto" />
                  </div>
                ) : null}

                {page.planImage && !showPlan ? (
                  <button style={styles.primaryButton} onClick={() => setShowPlan(true)}>
                    {page.planButtonText || "🧾 Hinweis aufheben"}
                  </button>
                ) : null}

                {page.planImage && showPlan ? (
                  <div style={styles.heroCard}>
                    <div style={styles.heroImageInner}>
                   <img
  src={page.planImage}
  alt="Fluchtplan"
  style={{ ...styles.heroImage, cursor: "zoom-in" }}
  onClick={() => openZoom(page.planImage, activeLanguage === "fr" ? "Plan de fuite" : activeLanguage === "en" ? "Escape plan" : "Fluchtplan")}
  onError={(e) => {
    handleImageFallback(e);
  }}
/>
                    </div>
                    <div style={styles.zoomHint}>{ui.zoomHint}</div>
                  </div>
                ) : null}

                {shouldShowTaskCard ? (
                  <div style={styles.taskCard}>
                    <div style={styles.taskTitle}>{page.taskTitle}</div>
                    <TextLines text={page.taskText} style={styles.taskText} />
                    {page.mapHint && !effectiveSolved && !page.hideInlineMapHint ? (
                      <>
                        <button
                          style={styles.secondaryButton}
                          onClick={() => setShowTaskMap((prev) => !prev)}
                        >
                          {showTaskMap ? ui.hideOrientation : ui.showOrientation}
                        </button>

                        {showTaskMap ? (
                          <MapHint
                            lat={page.mapHint.lat}
                            lng={page.mapHint.lng}
                            radius={page.mapHint.radius}
                            title={page.mapHint.title}
                            caption={ui.mapCaption}
                          />
                        ) : null}
                      </>
                    ) : null}

                    {isChoiceTask ? (
                      !effectiveSolved ? (
                        page.choiceLayout === "planHelp" ? (
                          <>
                            <>
  <div style={styles.choiceButtonGroup}>
    {page.choiceOptions?.map((option) => (
      <button
        key={option.value}
        style={{
          ...styles.choiceButton,
          ...(wrongChoice === option.value ? styles.choiceButtonWrong : {}),
        }}
        onClick={() => handleChoiceSelect(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>

  {choiceError ? (
    <div style={styles.inlineErrorBox}>{choiceError}</div>
  ) : null}

  {page.solutionValue && !effectiveSolved ? (
    <div style={styles.optionalHelpWrap}>
      {hintLevel === 0 ? (
        <>
          <div style={styles.subtleHintIntro}>
            {ui.helpIntro}
          </div>
          <button
            style={styles.secondaryButton}
            onClick={() => setHintLevel(1)}
          >
            {ui.smallHint}
          </button>
        </>
      ) : null}

      {hintLevel === 1 ? (
        <HintCard
          zoomHintText={ui.zoomHint}
          title={page.hint1Title}
          text={page.hint1Text}
          image={page.hint1Image}
          onImageClick={
            page.hint1Image
              ? () => openZoom(page.hint1Image, page.hint1Title)
              : null
          }
        />
      ) : null}

      {hintLevel === 1 ? (
        <button
          style={styles.secondaryButton}
          onClick={() => setHintLevel(2)}
        >
          {page.hint2ButtonText || ui.moreHint}
        </button>
      ) : null}

      {hintLevel === 2 ? (
        <HintCard
          zoomHintText={ui.zoomHint}
          title={page.hint2Title}
          text={page.hint2Text}
          image={page.hint2Image}
          onImageClick={
            page.hint2Image
              ? () => openZoom(page.hint2Image, page.hint2Title)
              : null
          }
        />
      ) : null}

      {hintLevel === 2 ? (
        <button
          style={styles.secondaryButton}
          onClick={() => {
            setAnswers((prev) => ({
              ...prev,
              [page.answerKey]: page.solutionValue,
            }));
            setChoiceError("");
            setWrongChoice("");
            setHintLevel(0);
            setShowSolution(true);
            setSolved(true);
          }}
        >
          {ui.solution}
        </button>
      ) : null}
    </div>
  ) : null}
</>

                            <div style={styles.optionalHelpWrap}>
                              {hintLevel === 0 ? (
                                <>
                                  <div style={styles.subtleHintIntro}>
                                    {ui.helpIntro}
                                  </div>
                                  <button
                                    style={styles.secondaryButton}
                                    onClick={() => setHintLevel(1)}
                                  >
                                    {ui.planHelpButton}
                                  </button>
                                </>
                              ) : null}

                              {hintLevel >= 1 ? (
                                <HintCard
          zoomHintText={ui.zoomHint}
                                  title={page.hint1Title}
                                  text={page.hint1Text}
                                  image={page.hint1Image}
                                />
                              ) : null}

                              {hintLevel === 1 ? (
                                <button
                                  style={styles.secondaryButton}
                                  onClick={() => setHintLevel(2)}
                                >
                                  {page.hint2ButtonText || ui.moreHint}
                                </button>
                              ) : null}

                              {hintLevel >= 2 ? (
                                <HintCard
          zoomHintText={ui.zoomHint}
                                  title={page.hint2Title}
                                  text={page.hint2Text}
                                  image={page.hint2Image}
                                  image2={page.hint2Image2}
                                  onImageClick={
                                    page.hint2Image
                                      ? () => openZoom(page.hint2Image, page.hint2Title)
                                      : null
                                  }
                                />
                              ) : null}
                            </div>

                            {page.mapHint ? (
                              <>
                                <button
                                  style={styles.secondaryButton}
                                  onClick={() => setShowTaskMap((prev) => !prev)}
                                >
                                  {showTaskMap ? ui.hideOrientation : ui.showOrientation}
                                </button>

                                {showTaskMap ? (
                                  <MapHint
                                    lat={page.mapHint.lat}
                                    lng={page.mapHint.lng}
                                    radius={page.mapHint.radius}
                                    title={page.mapHint.title}
                                    caption={ui.mapCaption}
                                  />
                                ) : null}
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <div style={styles.choiceButtonGroup}>
                              {page.choiceOptions?.map((option) => (
                                <button
                                  key={option.value}
                                  style={{
                                    ...styles.choiceButton,
                                    ...(wrongChoice === option.value ? styles.choiceButtonWrong : {}),
                                  }}
                                  onClick={() => handleChoiceSelect(option.value)}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>

                            {choiceError ? (
                              <div style={styles.inlineErrorBox}>{choiceError}</div>
                            ) : null}
                          </>
                        )
                      ) : (
                        <div style={styles.selectedChoiceBox}>
                          {selectedChoiceData?.label}
                        </div>
                      )
                    ) : null}

                    {isPhotoChoiceTask ? (
                      <>
                        <div style={styles.photoInfoBox}>
                          <TextLines text={ui.photoInfo} style={styles.photoInfoText} />
                        </div>

                        {!effectiveSolved ? (
                          <>
                          <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
  <label style={styles.uploadButton}>
    {ui.photoTake}
    <input
      type="file"
      accept="image/*"
      capture="environment"
      style={styles.hiddenFileInput}
      onChange={handlePhotoChange}
    />
  </label>

  <label
    style={{
      ...styles.uploadButton,
      background: "#fff",
      color: "#2e6410",
      border: "3px solid #9bc56c",
      boxShadow: "none",
    }}
  >
    {ui.photoGallery}
    <input
      type="file"
      accept="image/*"
      style={styles.hiddenFileInput}
      onChange={handlePhotoChange}
    />
  </label>
</div>

                            {photoPreview ? (
                              <div style={styles.photoPreviewWrap}>
                                <img
                                  src={photoPreview}
                                  alt="Lokale Teamfoto-Vorschau"
                                  style={styles.photoPreview}
                                />

                                <a
                                  href={photoPreview}
                                  download="teamfoto-spion.jpg"
                                  style={styles.downloadSmallButton}
                                >
                                  {ui.photoSave}
                                </a>

                                <button style={styles.secondaryButton} onClick={removePhoto}>
                                  {ui.photoRetry}
                                </button>
                              </div>
                            ) : null}

                            <div style={styles.choiceButtonGroup}>
                              {page.choiceOptions?.map((option) => (
                                <button
                                  key={option.value}
                                  style={{
                                    ...styles.choiceButton,
                                    ...(wrongChoice === option.value ? styles.choiceButtonWrong : {}),
                                  }}
                                  onClick={() => handleChoiceSelect(option.value)}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>

                            {choiceError ? (
                              <div style={styles.inlineErrorBox}>{choiceError}</div>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {photoPreview ? (
                              <div style={styles.photoPreviewWrap}>
                                <img
                                  src={photoPreview}
                                  alt="Lokale Teamfoto-Vorschau"
                                  style={styles.photoPreview}
                                />

                                <a
                                  href={photoPreview}
                                  download="teamfoto-spion.jpg"
                                  style={styles.downloadSmallButton}
                                >
                                  {ui.photoSave}
                                </a>
                              </div>
                            ) : null}

                            <div style={styles.selectedChoiceBox}>
                              {selectedChoiceData?.label}
                            </div>
                          </>
                        )}
                      </>
                    ) : null}

                    {!isChoiceTask && !isPhotoChoiceTask ? (
                      <>
                        <input
                          style={styles.input}
                          type="text"
                          value={answers[page.answerKey]}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          placeholder={page.placeholder}
                        />

                        {!effectiveSolved ? (
                          <button style={styles.primaryButton} onClick={checkAnswer}>
                            {ui.answerCheck}
                          </button>
                        ) : null}

                        {answerError && !effectiveSolved ? (
                          <div style={styles.inlineErrorBox}>
                            {ui.answerWrong}
                          </div>
                        ) : null}

                        {answerError && !effectiveSolved && hintLevel === 0 ? (
                          <button
                            style={styles.secondaryButton}
                            onClick={() => setHintLevel(1)}
                          >
                            {ui.smallHint}
                          </button>
                        ) : null}

                   {hintLevel === 1 && !effectiveSolved ? (
  <HintCard
          zoomHintText={ui.zoomHint}
    title={page.hint1Title}
    text={page.hint1Text}
    image={page.hint1Image}
  />
) : null}

            {hintLevel === 1 && !effectiveSolved ? (
  <button
    style={styles.secondaryButton}
    onClick={() => setHintLevel(2)}
  >
    {page.hint2ButtonText || ui.moreHint}
  </button>
) : null}

                        {hintLevel === 2 && !effectiveSolved ? (
  <HintCard
          zoomHintText={ui.zoomHint}
    title={page.hint2Title}
    text={page.hint2Text}
    image={page.hint2Image}
  />
) : null}

                        {hintLevel >= 2 && !effectiveSolved ? (
                          <button style={styles.secondaryButton} onClick={revealSolution}>
                            {ui.solution}
                          </button>
                        ) : null}

                        {showSolution ? <div style={styles.solutionBox}>{page.solutionText}</div> : null}
                      </>
                    ) : null}
                  </div>
                ) : null}
{page.solutionValue && !effectiveSolved ? (
  <div style={styles.optionalHelpWrap}>
    {hintLevel === 0 ? (
      <>
        <div style={styles.subtleHintIntro}>
          {ui.helpIntro}
        </div>
        <button
          style={styles.secondaryButton}
          onClick={() => setHintLevel(1)}
        >
          {ui.smallHint}
        </button>
      </>
    ) : null}

    {hintLevel === 1 ? (
      <HintCard
          zoomHintText={ui.zoomHint}
        title={page.hint1Title}
        text={page.hint1Text}
        image={page.hint1Image}
        onImageClick={
          page.hint1Image
            ? () => openZoom(page.hint1Image, page.hint1Title)
            : null
        }
      />
    ) : null}

    {hintLevel === 1 ? (
      <button
        style={styles.secondaryButton}
        onClick={() => setHintLevel(2)}
      >
        {page.hint2ButtonText || ui.moreHint}
      </button>
    ) : null}

    {hintLevel === 2 ? (
      <HintCard
          zoomHintText={ui.zoomHint}
        title={page.hint2Title}
        text={page.hint2Text}
        image={page.hint2Image}
        onImageClick={
          page.hint2Image
            ? () => openZoom(page.hint2Image, page.hint2Title)
            : null
        }
      />
    ) : null}

    {hintLevel === 2 ? (
      <button
        style={styles.secondaryButton}
        onClick={() => {
          setAnswers((prev) => ({
            ...prev,
            [page.answerKey]: page.solutionValue,
          }));
          setChoiceError("");
          setWrongChoice("");
          setHintLevel(0);
          setShowSolution(true);
          setSolved(true);
        }}
      >
        {ui.solution}
      </button>
    ) : null}
  </div>
) : null}
                {effectiveSolved && currentResultBox ? (
                  <TextLines text={currentResultBox} style={styles.resultBox} />
                ) : null}

                {effectiveSolved && page.showPlanAssemblyAfterChoice ? (
                 <PlanAssembly
  part1={page.planPart1}
  part2={page.planPart2}
  completeImage={page.planCompleteImage}
  assembled={planAssembled}
  onAssemble={() => setPlanAssembled(true)}
  onZoom={openZoom}
                    ui={ui}
                  />
                ) : null}

                {effectiveSolved &&
                page.nextHintImage &&
                (!page.requiresPlanAssemblyBeforeNext || planAssembled) ? (
                  <div style={styles.nextHintBox}>
                    <img
                      src="/fussabdruecke.png"
                      alt=""
                      style={styles.footprintsTop}
                      onError={(e) => {
                        handleImageFallback(e);
                      }}
                    />

                    <div style={styles.nextHintImageWrap}>
                      <img
                        src={page.nextHintImage}
                        alt="Hinweis zur nächsten Station"
                        style={{
                          ...styles.nextHintImage,
                          cursor: page.nextHintZoomable ? "zoom-in" : "default",
                        }}
                        onClick={
                          page.nextHintZoomable
                            ? () => openZoom(page.nextHintImage, ui.secretHintTitle)
                            : undefined
                        }
                        onError={(e) => {
                          handleImageFallback(e);
                        }}
                      />
                      {page.nextHintZoomable ? (
                        <div style={styles.zoomHint}>{ui.zoomHint}</div>
                      ) : null}
                    </div>

                    <TextLines text={page.nextHintText} style={styles.nextHintText} />

                    {page.nextMapHint ? (
                      <>
                        <button
                          style={styles.secondaryButton}
                          onClick={() => setShowNextMap((prev) => !prev)}
                        >
                          {showNextMap ? ui.hideOrientation : ui.showOrientation}
                        </button>

                        {showNextMap ? (
                          <MapHint
                            lat={page.nextMapHint.lat}
                            lng={page.nextMapHint.lng}
                            radius={page.nextMapHint.radius}
                            title={page.nextMapHint.title}
                            caption={ui.mapCaption}
                          />
                        ) : null}
                      </>
                    ) : null}

                    <img
                      src="/fussabdruecke.png"
                      alt=""
                      style={styles.footprintsBottom}
                      onError={(e) => {
                        handleImageFallback(e);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {page.type === "finale" ? (
              <div style={styles.stackGap}>
                {!finaleRevealShown ? (
                  <>
                    <TextLines text={page.storyBox} style={styles.storyBox} />

                    {page.audio ? (
                      <div style={styles.audioPlayerCard}>
                        <div style={styles.audioPlayerMainText}>
                          {page.audioTitle || "🎧 Nachricht anhören"}
                        </div>
                        <button
                          style={styles.audioPlayButton}
                          onClick={() => {
                            const audio = document.getElementById(`page-audio-${page.id}`);
                            if (audio) {
                              audio.currentTime = 0;
                              audio.play();
                            }
                          }}
                        >
                          ▶
                        </button>
                        <audio id={`page-audio-${page.id}`} src={page.audio} preload="auto" />
                      </div>
                    ) : null}

                    <TextLines
                      text={ui.finaleQuietText}
                      style={styles.storyBox}
                    />

                    <button
                      style={styles.primaryButton}
                      onClick={() => setFinaleRevealShown(true)}
                    >
                      {ui.finaleLookButton}
                    </button>
                  </>
                ) : null}

                {finaleRevealShown && !finaleLockShown ? (
                  <>
                    <div style={styles.heroCard}>
                      <div style={styles.heroImageInner}>
                        <img
                          src={asset("keksdose.png")}
                          alt="Keksdose auf dem Weg"
                          style={styles.heroImage}
                          onError={(e) => {
                            handleImageFallback(e);
                          }}
                        />
                      </div>
                    </div>

                    <TextLines
                      text={ui.finaleBoxText}
                      style={styles.storyBox}
                    />

                    <button
                      style={styles.primaryButton}
                      onClick={() => setFinaleLockShown(true)}
                    >
                      {ui.finaleInspectLockButton}
                    </button>
                  </>
                ) : null}

                {finaleLockShown ? (
                  <div style={{ ...styles.lockCard, ...(lockOpened ? styles.lockCardOpen : {}) }}>
                    <div style={styles.lockTitle}>{page.taskTitle}</div>
                    <TextLines text={page.taskText} style={styles.lockHelpText} />

                    <div style={styles.lockBody}>
                      <LockWheel
                        topValue={getNumberAbove(lockLeft)}
                        value={lockLeft}
                        bottomValue={getNumberBelow(lockLeft)}
                        onUp={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockLeft((prev) => stepNumber(prev, "up"));
                        }}
                        onDown={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockLeft((prev) => stepNumber(prev, "down"));
                        }}
                      />

                      <LockWheel
                        topValue={`${getItemAbove(lockAnimals, lockAnimalIndex).emoji} ${getLockAnimalLabel(getItemAbove(lockAnimals, lockAnimalIndex))}`}
                        value={`${currentAnimal.emoji} ${getLockAnimalLabel(currentAnimal)}`}
                        bottomValue={`${getItemBelow(lockAnimals, lockAnimalIndex).emoji} ${getLockAnimalLabel(getItemBelow(lockAnimals, lockAnimalIndex))}`}
                        onUp={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockAnimalIndex((prev) => stepList(prev, "up", lockAnimals));
                        }}
                        onDown={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockAnimalIndex((prev) => stepList(prev, "down", lockAnimals));
                        }}
                      />

                      <LockWheel
                        topValue={`${getItemAbove(lockSymbols, lockSymbolIndex).emoji} ${getLockSymbolLabel(getItemAbove(lockSymbols, lockSymbolIndex))}`}
                        value={`${currentSymbol.emoji} ${getLockSymbolLabel(currentSymbol)}`}
                        bottomValue={`${getItemBelow(lockSymbols, lockSymbolIndex).emoji} ${getLockSymbolLabel(getItemBelow(lockSymbols, lockSymbolIndex))}`}
                        onUp={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockSymbolIndex((prev) => stepList(prev, "up", lockSymbols));
                        }}
                        onDown={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockSymbolIndex((prev) => stepList(prev, "down", lockSymbols));
                        }}
                      />
                    </div>

                    <button
                      style={{
                        ...styles.lockOpenButton,
                        ...(lockOpened ? styles.lockOpenButtonDone : {}),
                      }}
                      onClick={tryOpenLock}
                      disabled={lockOpened}
                    >
                      {lockOpened ? ui.lockOpened : ui.lockOpen}
                    </button>

                    {!lockOpened && lockAttempts >= 1 ? (
                      <div style={styles.inlineErrorBox}>
                        {ui.lockWrong}
                      </div>
                    ) : null}

                    {!lockOpened && lockAttempts >= 1 && !showLockHint1 ? (
                      <button
                        style={styles.secondaryButton}
                        onClick={() => setShowLockHint1(true)}
                      >
                        {ui.lockHint1Button}
                      </button>
                    ) : null}

                    {!lockOpened && showLockHint1 ? (
                      <div style={styles.lockHintBox}>
                        <div style={styles.lockHintTitle}>{ui.lockHint1Title}</div>
                        <div>
                          <TextLines text={ui.lockHint1Text} style={styles.lockHintText} />
                        </div>
                      </div>
                    ) : null}

                    {!lockOpened && lockAttempts >= 2 && !showLockHint2 ? (
                      <button
                        style={styles.secondaryButton}
                        onClick={() => setShowLockHint2(true)}
                      >
                        {ui.lockHint2Button}
                      </button>
                    ) : null}

                    {!lockOpened && showLockHint2 ? (
                      <div style={styles.lockHintBox}>
                        <div style={styles.lockHintTitle}>{ui.lockHint2Title}</div>
                        <div>
                          <TextLines text={ui.lockHint2Text} style={styles.lockHintText} />
                        </div>
                      </div>
                    ) : null}

                    {!lockOpened && lockAttempts >= 3 && !showLockSolution ? (
                      <button
                        style={styles.secondaryButton}
                        onClick={() => setShowLockSolution(true)}
                      >
                        {ui.solution}
                      </button>
                    ) : null}

                    {!lockOpened && showLockSolution ? (
                      <div style={styles.lockSolutionBox}>
                        <div style={styles.lockHintTitle}>{ui.lockSolutionTitle}</div>
                        <div>
                          <TextLines text={ui.lockSolutionText} style={styles.lockHintText} />
                        </div>
                      </div>
                    ) : null}

                    {lockOpened ? (
                      <>
                        <TextLines text={page.successBox} style={styles.lockSuccessBox} />

                        <div style={styles.formulaRevealCard}>
                          <div style={styles.formulaRevealTitle}>{ui.formulaTitle}</div>
                          <div style={styles.formulaImageWrap}>
                            <img
                              src={asset("keksformel.png")}
                              alt="Die geheime Keksformel"
                              style={styles.formulaImage}
                              onClick={() => openZoom(asset("keksformel.png"), ui.formulaTitle)}
                              onError={(e) => {
                                handleImageFallback(e);
                              }}
                            />
                          </div>
                          <div style={styles.zoomHint}>{ui.zoomHint}</div>

                          <a href={asset("keksformel.pdf")} download style={styles.downloadButton}>
                            {ui.formulaDownload}
                          </a>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {page.type === "recipe" ? (
              <div style={styles.stackGap}>
                <div style={styles.outroHeroCard}>
                  <div style={styles.outroEmoji}>🎉</div>
                  <div style={styles.outroTitle}>{ui.missionCompletedTitle}</div>
                  <TextLines text={page.outroText} style={styles.outroText} />
                </div>

                <div style={styles.outroCard}>
                  <div style={styles.outroCardTitle}>{ui.teamPhotoTitle}</div>
                  <TextLines text={page.photoText} style={styles.outroSmallText} />


                </div>

                <div style={styles.outroCard}>
                  <div style={styles.outroCardTitle}>{ui.reviewTitle}</div>
                  <TextLines text={page.reviewText} style={styles.outroSmallText} />

                  <a
                    href={mission.reviewUrl || "https://g.page/r/CYxuAwRA_viKEBM/review"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.reviewButton}
                  >
                    {ui.reviewButton}
                  </a>
                </div>

                <div style={styles.outroCard}>
                  <div style={styles.outroCardTitle}>{ui.returnTitle}</div>
                  <TextLines text={page.returnText} style={styles.outroSmallText} />
                </div>

                <div style={styles.outroRestartCard}>
                  <TextLines text={page.finalText} style={styles.outroRestartText} />
                  <button type="button" style={styles.restartMissionButton} onClick={resetGameForTesting}>
                    {ui.restartButton}
                  </button>
                </div>
              </div>
            ) : null}

            <div style={styles.navRow}>
              {currentPage < pages.length - 1 &&
              (page.type === "finale"
                ? lockOpened
                : page.requiresPlanAssemblyBeforeNext
                ? effectiveSolved && planAssembled
                : page.type !== "riddle" || effectiveSolved) ? (
                <button style={styles.primaryButton} onClick={nextPage}>
                  {ui.next}
                </button>
              ) : null}
            </div>
          </>
        )}
        <div style={styles.footerLinks}>
          <button type="button" onClick={() => openInfo("impressum")} style={styles.footerLink}>
            {ui.footerImpressum}
          </button>
          <span> | </span>
          <button type="button" onClick={() => openInfo("datenschutz")} style={styles.footerLink}>
            {ui.footerDatenschutz}
          </button>
        </div>
      </div>

      {infoMenuOpen ? (
        <div style={styles.infoOverlay} onClick={closeInfoMenu}>
          <div style={styles.infoModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.infoModalHeader}>
              <button
                type="button"
                style={styles.infoBackButton}
                onClick={() => {
                  if (activeInfoPage === "menu" || activeInfoPage === "impressum" || activeInfoPage === "datenschutz") {
                    closeInfoMenu();
                  } else {
                    setActiveInfoPage("menu");
                  }
                }}
              >
                {activeInfoPage === "menu" || activeInfoPage === "impressum" || activeInfoPage === "datenschutz" ? "✕" : "‹"}
              </button>
              <div style={styles.infoModalTitle}>
                {activeInfoPage === "menu"
                  ? ui.menuTitle
                  : activeInfoPage === "impressum"
                  ? ui.footerImpressum
                  : activeInfoPage === "datenschutz"
                  ? ui.footerDatenschutz
                  : activeInfoPage === "faq"
                  ? ui.faqTitle
                  : ui.problemTitle}
              </div>
            </div>

            {activeInfoPage === "menu" ? (
              <div style={styles.infoMenuList}>
                <button style={styles.infoMenuItem} onClick={() => setActiveInfoPage("faq")}>
                  ❓ {ui.faqTitle}
                </button>
                <button style={styles.infoMenuItem} onClick={() => setActiveInfoPage("problem")}>
                  🛠 {ui.problemTitle}
                </button>
              </div>
            ) : null}

            {activeInfoPage === "impressum" ? (
              <div style={styles.infoContent}>
                <p><strong>{ui.footerImpressum}</strong></p>
                <p>
                  der-spielzeugladen.de OHG<br />
                  Südend 1<br />
                  77966 Kappel-Grafenhausen<br />
                  Deutschland
                </p>
                <p>
                  Tel.: 07822/7809027<br />
                  Fax: 07822/7809028<br />
                  E-Mail: info@der-spielzeugladen.de
                </p>
                <p>
                  Registergericht: Amtsgericht Freiburg<br />
                  Registernummer: HRA 704095
                </p>
                <p>
                  Vertretungsberechtigte Gesellschafter:<br />
                  Tim Benninghaus, Tina Benninghaus
                </p>
                <p>
                  Verantwortlicher i.S.d. § 18 Abs. 2 MStV:<br />
                  Tim Benninghaus, Südend 1, 77966 Kappel-Grafenhausen
                </p>
                <p>
                  Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                  DE 233215666
                </p>
              </div>
            ) : null}

            {activeInfoPage === "datenschutz" ? (
              <div style={styles.infoContent}>
                <p><strong>{ui.privacyHeading}</strong></p>
                <p>{ui.privacyText1}</p>
                <p>{ui.privacyText2}</p>
                <p>{ui.privacyText3}</p>
              </div>
            ) : null}

            {activeInfoPage === "faq" ? (
              <div style={styles.infoContent}>
                <p><strong>{ui.faqHeading}</strong></p>
                {(ui.faqItems || []).map((item) => (
                  <p key={item.question}>
                    <strong>{item.question}</strong><br />
                    {item.answer}
                  </p>
                ))}
              </div>
            ) : null}

            {activeInfoPage === "problem" ? (
              <div style={styles.infoContent}>
                <p><strong>{ui.problemTitle}</strong></p>
                <p>{ui.problemIntro}</p>

                <label style={styles.infoFormLabel}>
                  {ui.problemStationLabel}
                  <input
                    style={styles.infoFormInput}
                    value={problemStation}
                    onChange={(e) => setProblemStation(e.target.value)}
                    placeholder={ui.problemStationPlaceholder}
                  />
                </label>

                <label style={styles.infoFormLabel}>
                  {ui.problemDeviceLabel}
                  <input
                    style={styles.infoFormInput}
                    value={problemDevice}
                    onChange={(e) => setProblemDevice(e.target.value)}
                    placeholder={ui.problemDevicePlaceholder}
                  />
                </label>

                <label style={styles.infoFormLabel}>
                  {ui.problemDescriptionLabel}
                  <textarea
                    style={styles.infoFormTextarea}
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    placeholder={ui.problemDescriptionPlaceholder}
                  />
                </label>

                <button
                  type="button"
                  style={styles.problemSendButton}
                  onClick={sendProblemReport}
                >
                  {ui.problemSendButton}
                </button>

                <p style={styles.infoSmallNote}>
                  {ui.problemSmallNote}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <ZoomModal image={zoomImage} title={zoomTitle} onClose={closeZoom} />
    </div>
  );
}

const styles = {

  languageSwitch: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginBottom: "10px",
  },
  languageButton: {
    border: "2px solid #d8bf98",
    background: "#fff",
    color: "#5a4a3e",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
  },
  languageButtonActive: {
    background: "#3f6f1d",
    color: "#fff",
    border: "2px solid #3f6f1d",
  },
  languageChoiceGrid: {
    display: "grid",
    gap: "10px",
    marginTop: "16px",
  },
  languageChoiceButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    border: "2px solid #d8bf98",
    background: "#fff",
    color: "#2c2015",
    borderRadius: "18px",
    padding: "14px 16px",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer",
  },
  languageChoiceFlag: {
    fontSize: "24px",
    lineHeight: 1,
  },
  photoInfoText: {
    fontSize: "15px",
    lineHeight: 1.35,
    textAlign: "center",
  },
  lockHintText: {
    whiteSpace: "pre-line",
  },
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f5ead9 0%, #efe0cb 100%)",
    padding: "10px",
    fontFamily: "Trebuchet MS, Arial, sans-serif",
    color: "#2c2015",
    position: "relative",
  },
  secretResetTapZone: {
    position: "fixed",
    right: 0,
    bottom: 0,
    width: "54px",
    height: "54px",
    opacity: 0,
    border: "none",
    background: "transparent",
    zIndex: 9998,
    padding: 0,
  },
  wrapper: {
    position: "relative",
    zIndex: 1,
    maxWidth: "620px",
    margin: "0 auto",
    background: "rgba(255,249,241,0.98)",
    borderRadius: "26px",
    padding: "14px",
    boxShadow: "0 14px 44px rgba(70, 40, 10, 0.12)",
    border: "3px solid #ead8bd",
  },
  infoMenuButton: {
    position: "fixed",
    top: "10px",
    left: "10px",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "1.5px solid #d8bf98",
    background: "rgba(255,255,255,0.82)",
    color: "#2c2015",
    fontSize: "19px",
    fontWeight: "900",
    cursor: "pointer",
    zIndex: 9999,
    boxShadow: "0 3px 10px rgba(70,40,10,0.14)",
    opacity: 0.78,
    pointerEvents: "auto",
    touchAction: "manipulation",
  },
  infoOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.38)",
    zIndex: 10000,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "18px 10px",
    boxSizing: "border-box",
  },
  infoModal: {
    width: "100%",
    maxWidth: "560px",
    maxHeight: "86vh",
    overflowY: "auto",
    background: "#fff9f1",
    borderRadius: "24px",
    border: "3px solid #ead8bd",
    boxShadow: "0 16px 46px rgba(0,0,0,0.24)",
    padding: "14px",
    boxSizing: "border-box",
  },
  infoModalHeader: {
    display: "grid",
    gridTemplateColumns: "42px 1fr",
    gap: "8px",
    alignItems: "center",
    marginBottom: "12px",
  },
  infoBackButton: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    border: "2px solid #d8bf98",
    background: "#fff",
    fontSize: "24px",
    fontWeight: "900",
    cursor: "pointer",
    color: "#2c2015",
  },
  infoModalTitle: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#2c2015",
    textAlign: "center",
    paddingRight: "42px",
  },
  infoMenuList: {
    display: "grid",
    gap: "10px",
  },
  infoMenuItem: {
    width: "100%",
    background: "#fff",
    border: "3px solid #d9c9b0",
    borderRadius: "16px",
    padding: "16px",
    fontSize: "18px",
    fontWeight: "900",
    textAlign: "left",
    color: "#2c2015",
    cursor: "pointer",
  },
  infoContent: {
    background: "#fff",
    border: "3px solid #eadfce",
    borderRadius: "18px",
    padding: "16px",
    fontSize: "16px",
    lineHeight: 1.45,
    color: "#2c2015",
  },
  footerLinks: {
    marginTop: "18px",
    paddingTop: "8px",
    textAlign: "center",
    fontSize: "12px",
    color: "#7a6a58",
    opacity: 0.8,
  },
  footerLink: {
    background: "none",
    border: "none",
    color: "#7a6a58",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: "12px",
    padding: "2px 4px",
    fontFamily: "inherit",
  },
  infoFormLabel: {
    display: "block",
    fontSize: "15px",
    fontWeight: "900",
    marginTop: "12px",
    marginBottom: "6px",
    color: "#2c2015",
  },
  infoFormInput: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: "6px",
    borderRadius: "14px",
    border: "2px solid #d8bf98",
    padding: "12px",
    fontSize: "16px",
    background: "#fffdf8",
    fontFamily: "inherit",
  },
  infoFormTextarea: {
    width: "100%",
    minHeight: "120px",
    boxSizing: "border-box",
    marginTop: "6px",
    borderRadius: "14px",
    border: "2px solid #d8bf98",
    padding: "12px",
    fontSize: "16px",
    background: "#fffdf8",
    fontFamily: "inherit",
    resize: "vertical",
  },
  problemSendButton: {
    width: "100%",
    marginTop: "14px",
    background: "linear-gradient(180deg, #5b902c 0%, #3f6f1d 100%)",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "14px 16px",
    fontSize: "17px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 4px 0 rgba(43,84,17,0.35)",
  },
  infoSmallNote: {
    fontSize: "13px",
    color: "#6a5846",
    marginTop: "10px",
  },
  adminResetButton: {
    position: "sticky",
    top: "8px",
    left: "100%",
    display: "block",
    marginLeft: "auto",
    marginBottom: "10px",
    background: "#fff",
    border: "2px dashed #b78b54",
    borderRadius: "14px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
    zIndex: 99,
    color: "#5b3c1c",
  },
  headerImageWrap: { width: "100%", marginBottom: "12px" },
  headerImage: { width: "100%", maxHeight: "320px", objectFit: "contain", display: "block" },
  startTitleWrap: { textAlign: "center", padding: "0 6px", marginBottom: "14px" },
  startMissionLabel: {
    fontSize: "20px",
    fontWeight: "900",
    marginBottom: "8px",
    letterSpacing: "0.8px",
    color: "#2f2418",
  },
  startMainTitle: {
    fontSize: "30px",
    lineHeight: 1.02,
    margin: 0,
    fontWeight: "900",
    color: "#2a2017",
  },
  startMainTitleBig: {
    fontSize: "34px",
    lineHeight: 1.02,
    margin: "4px 0 0 0",
    fontWeight: "900",
    color: "#2a2017",
  },
  startSubtitle: { fontSize: "16px", marginTop: "12px", color: "#5a4a3e", fontWeight: "bold" },
  accessCard: {
    background: "#fff",
    borderRadius: "24px",
    padding: "18px",
    border: "3px solid #e7dccb",
    boxShadow: "0 6px 18px rgba(70,40,10,0.06)",
    marginBottom: "16px",
  },
  accessTitle: {
    fontSize: "22px",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: "10px",
    color: "#2c2015",
  },
  accessText: { fontSize: "17px", lineHeight: 1.4, textAlign: "center", marginBottom: "14px" },
  rulesIntroBox: {
    background: "#fff",
    border: "3px solid #eadfce",
    borderRadius: "22px",
    padding: "16px",
    fontSize: "17px",
    lineHeight: 1.45,
    textAlign: "center",
    marginBottom: "14px",
    whiteSpace: "pre-line",
  },
  rulesList: {
    display: "grid",
    gap: "10px",
    marginBottom: "16px",
  },
  ruleItem: {
    display: "grid",
    gridTemplateColumns: "42px 1fr",
    gap: "10px",
    alignItems: "start",
    background: "#fffdf8",
    border: "3px solid #eadfce",
    borderRadius: "18px",
    padding: "12px",
  },
  ruleIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "#f3eadb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },
  ruleTitle: {
    fontSize: "17px",
    fontWeight: "900",
    color: "#2c2015",
    marginBottom: "4px",
  },
  ruleText: {
    fontSize: "15px",
    lineHeight: 1.35,
    color: "#4f4032",
  },
  acceptRulesButton: {
    width: "100%",
    background: "linear-gradient(180deg, #5b902c 0%, #3f6f1d 100%)",
    color: "white",
    border: "none",
    borderRadius: "18px",
    padding: "16px 18px",
    fontSize: "17px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 5px 0 rgba(43,84,17,0.35)",
    lineHeight: 1.25,
  },
  accessErrorBox: {
    background: "#fff3e6",
    color: "#6b2f14",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "16px",
    lineHeight: 1.35,
    textAlign: "center",
    border: "3px solid #efc18f",
    fontWeight: "bold",
  },
  readyText: {
    textAlign: "center",
    fontSize: "16px",
    marginBottom: "12px",
    fontWeight: "bold",
    color: "#2c2015",
  },
  ageText: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "14px",
    color: "#5a4a3e",
    lineHeight: 1.4,
  },
  startLocationCard: {
    background: "#fff",
    borderRadius: "24px",
    padding: "18px",
    border: "3px solid #e7dccb",
    boxShadow: "0 6px 18px rgba(70,40,10,0.06)",
    marginBottom: "10px",
    textAlign: "center",
  },
  startLocationTitle: {
    fontSize: "20px",
    fontWeight: "900",
    marginBottom: "10px",
    color: "#2c2015",
  },
  startLocationText: {
    fontSize: "16px",
    lineHeight: 1.4,
    fontWeight: "bold",
    color: "#5a4a3e",
    marginBottom: "8px",
  },
  startLocationAddress: {
    fontSize: "15px",
    lineHeight: 1.35,
    color: "#7a6a5a",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  startLocationHint: {
    fontSize: "15px",
    lineHeight: 1.35,
    color: "#7a6a5a",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  startLocationLinkSmall: {
    display: "block",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#2e6410",
    textDecoration: "underline",
    marginBottom: "14px",
  },
  startStoryCard: {
    background: "linear-gradient(180deg, #e7a14f 0%, #de9442 100%)",
    borderRadius: "24px",
    padding: "14px",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    alignItems: "center",
    marginBottom: "14px",
    border: "3px solid #d18935",
    boxShadow: "0 8px 22px rgba(70,40,10,0.08)",
  },
  startStoryText: { fontSize: "17px", lineHeight: 1.45, textAlign: "center", whiteSpace: "pre-line" },
  startSideCharacterWrap: { display: "flex", justifyContent: "center" },
  startSideCharacter: {
    width: "100px",
    height: "100px",
    objectFit: "contain",
    filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.08))",
  },
  startButton: {
    width: "100%",
    background: "linear-gradient(180deg, #4f7f1f 0%, #2e6410 100%)",
    color: "white",
    border: "none",
    borderRadius: "18px",
    padding: "14px 16px",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 5px 0 rgba(38,75,11,0.35)",
    marginBottom: "16px",
    letterSpacing: "0.3px",
  },
  mostWantedCard: {
    background: "#fff",
    borderRadius: "24px",
    padding: "14px",
    marginBottom: "16px",
    boxShadow: "0 8px 22px rgba(70,40,10,0.08)",
    border: "3px solid #e7dccb",
  },
  mostWantedImage: { width: "100%", maxHeight: "320px", objectFit: "contain", display: "block" },
  headerTop: {
    display: "grid",
    gridTemplateColumns: "64px 1fr",
    gap: "12px",
    alignItems: "center",
    marginBottom: "10px",
  },
  characterClean: { display: "flex", alignItems: "center", justifyContent: "center" },
  characterImageClean: { width: "58px", height: "58px", objectFit: "contain", display: "block" },
  titleAreaWide: { textAlign: "center", paddingRight: "10px" },
  kicker: { fontSize: "18px", fontWeight: "900", color: "#7c5b2c", marginBottom: "4px" },
  mainTitle: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.05,
    color: "#2c2015",
    fontWeight: "900",
  },
  progressWrap: { marginBottom: "14px", padding: "0 6px" },
  progressOuter: {
    width: "100%",
    height: "8px",
    background: "#efe4d2",
    borderRadius: "999px",
    overflow: "hidden",
    border: "1px solid #d7c39f",
  },
  progressInner: {
    height: "100%",
    background: "linear-gradient(90deg, #4f7e24 0%, #7eb43e 100%)",
    borderRadius: "999px",
    transition: "width 0.35s ease",
  },
  heroCard: {
    background: "#fff",
    borderRadius: "22px",
    padding: "12px",
    marginBottom: "16px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  },
  heroImageInner: { background: "#fff", borderRadius: "16px", overflow: "hidden" },
  heroImage: {
    width: "100%",
    height: "250px",
    objectFit: "contain",
    display: "block",
    background: "#fff",
  },
  stackGap: { display: "grid", gap: "14px" },
  storyBox: {
    background: "linear-gradient(180deg, #eda859 0%, #e29741 100%)",
    color: "#2d241c",
    padding: "16px",
    borderRadius: "22px",
    fontSize: "18px",
    lineHeight: 1.4,
    whiteSpace: "pre-line",
    border: "3px solid #d48932",
  },
  taskCard: {
    background: "#fff",
    border: "3px solid #eadfce",
    padding: "22px 18px",
    borderRadius: "22px",
  },
  taskTitle: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#467322",
    marginBottom: "12px",
    lineHeight: 1.1,
    textAlign: "center",
  },
  taskText: {
    fontSize: "18px",
    lineHeight: 1.4,
    marginBottom: "16px",
    whiteSpace: "pre-line",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "16px 18px",
    fontSize: "18px",
    borderRadius: "16px",
    border: "3px solid #d9c9b0",
    marginBottom: "14px",
    boxSizing: "border-box",
    background: "#fffdf9",
    color: "#2c2015",
backgroundColor: "#fffdf9",
WebkitTextFillColor: "#2c2015",
caretColor: "#2c2015",
  },
  primaryButton: {
    background: "linear-gradient(180deg, #5b902c 0%, #3f6f1d 100%)",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "16px 18px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 0 rgba(43,84,17,0.35)",
    width: "100%",
  },
  secondaryButton: {
    background: "#fff",
    color: "#2d241c",
    border: "3px solid #cdb999",
    borderRadius: "16px",
    padding: "14px 18px",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
    marginTop: "14px",
    marginBottom: "4px",
  },
  subtleHintIntro: {
    textAlign: "center",
    marginTop: "18px",
    marginBottom: "2px",
    fontSize: "15px",
    lineHeight: 1.35,
    color: "#7a6a5a",
    fontWeight: "bold",
  },
  optionalHelpWrap: {
    marginTop: "20px",
    paddingTop: "12px",
    borderTop: "2px dashed #eadfce",
  },
  choiceButtonGroup: {
    display: "grid",
    gap: "12px",
    marginTop: "18px",
  },
  choiceButton: {
    width: "100%",
    background: "#fff",
    color: "#2d241c",
    border: "3px solid #d9c9b0",
    borderRadius: "16px",
    padding: "16px 18px",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
    lineHeight: 1.35,
    textAlign: "left",
  },
  choiceButtonWrong: {
    background: "#fff3f0",
    border: "3px solid #d46a4c",
    color: "#7a2518",
  },
  selectedChoiceBox: {
    background: "#f7efe4",
    borderRadius: "18px",
    padding: "16px",
    fontSize: "16px",
    border: "3px solid #e2d3be",
    textAlign: "center",
    fontWeight: "bold",
  },
  inlineErrorBox: {
    background: "#fff3e6",
    color: "#6b2f14",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "16px",
    lineHeight: 1.35,
    textAlign: "center",
    border: "3px solid #efc18f",
    fontWeight: "bold",
    marginTop: "12px",
  },
  photoInfoBox: {
    background: "#f7efe4",
    borderRadius: "16px",
    padding: "14px",
    marginBottom: "14px",
    fontSize: "15px",
    lineHeight: 1.35,
    textAlign: "center",
    border: "3px solid #e2d3be",
  },
  uploadButton: {
    display: "block",
    width: "100%",
    background: "linear-gradient(180deg, #5b902c 0%, #3f6f1d 100%)",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "16px 18px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 0 rgba(43,84,17,0.35)",
    textAlign: "center",
    marginBottom: "14px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  hiddenFileInput: {
    position: "absolute",
    inset: 0,
    opacity: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer",
  },
  photoPreviewWrap: { display: "grid", gap: "10px", marginBottom: "14px" },
  photoPreview: {
    width: "100%",
    maxHeight: "320px",
    objectFit: "contain",
    display: "block",
    borderRadius: "16px",
    background: "#fff",
    border: "3px solid #eadfce",
  },
  planAssemblyCard: {
    background: "#fff",
    borderRadius: "22px",
    padding: "18px",
    border: "3px solid #eadfce",
    boxShadow: "0 6px 18px rgba(70,40,10,0.06)",
    textAlign: "center",
  },
  planAssemblyTitle: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#467322",
    marginBottom: "10px",
    lineHeight: 1.15,
  },
  planAssemblyText: {
    fontSize: "17px",
    lineHeight: 1.4,
    marginBottom: "14px",
    fontWeight: "bold",
    color: "#2d241c",
  },
  planPartsPreview: {
    position: "relative",
    minHeight: "280px",
    marginBottom: "14px",
    borderRadius: "18px",
    background: "#f8efe2",
    border: "3px dashed #d8bf98",
    overflow: "hidden",
  },
  planPartImage: {
    position: "absolute",
    left: "6%",
    top: "20px",
    width: "58%",
    maxHeight: "240px",
    objectFit: "contain",
    borderRadius: "12px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
    transform: "rotate(-3deg)",
    cursor: "zoom-in",
    background: "#fff",
  },
  planPartImageSnapping: {
    left: "8%",
    top: "34px",
    transform: "rotate(0deg) scale(1.04)",
    transition: "all 1.15s cubic-bezier(0.2, 0.9, 0.2, 1.15)",
    zIndex: 2,
  },
  planPartImageFlying: {
    position: "absolute",
    right: "5%",
    top: "52px",
    width: "46%",
    maxHeight: "220px",
    objectFit: "contain",
    borderRadius: "12px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.14)",
    transform: "rotate(5deg)",
    cursor: "zoom-in",
    background: "#fff",
  },
  planPartImageFlyingSnapping: {
    right: "11%",
    top: "38px",
    transform: "rotate(0deg) scale(1.04)",
    transition: "all 1.15s cubic-bezier(0.2, 0.9, 0.2, 1.15)",
    zIndex: 3,
  },
  snapText: {
    position: "absolute",
    left: "50%",
    bottom: "18px",
    transform: "translateX(-50%)",
    background: "#fff8dc",
    border: "3px solid #f0d36a",
    borderRadius: "16px",
    padding: "10px 14px",
    fontSize: "15px",
    fontWeight: "900",
    color: "#2d241c",
    boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
    zIndex: 5,
    width: "80%",
    lineHeight: 1.25,
  },
  primaryButtonDisabled: {
    opacity: 0.75,
    cursor: "default",
  },
  completePlanWrap: {
    background: "#fff",
    borderRadius: "18px",
    padding: "10px",
    border: "3px solid #eadfce",
  },
  completePlanImage: {
    width: "100%",
    maxHeight: "420px",
    objectFit: "contain",
    display: "block",
    borderRadius: "12px",
    cursor: "zoom-in",
    background: "#fff",
  },
  hintCard: {
    background: "#fff8dc",
    borderRadius: "20px",
    padding: "18px 16px",
    marginTop: "14px",
    marginBottom: "16px",
    border: "3px solid #f0d36a",
  },
  hintCardTitle: {
    fontSize: "16px",
    fontWeight: "900",
    marginBottom: "10px",
    textAlign: "center",
    color: "#7c5b2c",
  },
  hintCardText: {
    fontSize: "16px",
    lineHeight: 1.5,
    textAlign: "center",
  },
  hintImageWrap: {
    background: "#fff",
    borderRadius: "14px",
    padding: "8px",
    marginBottom: "10px",
  },
  hintImage: {
    width: "100%",
    maxHeight: "220px",
    objectFit: "contain",
    display: "block",
    borderRadius: "10px",
    background: "#fff",
  },
  zoomHint: {
    marginTop: "8px",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#7a6a5a",
    textAlign: "center",
  },
  solutionBox: {
    background: "#f9efe0",
    borderRadius: "18px",
    padding: "16px",
    marginTop: "10px",
    fontSize: "16px",
    border: "3px solid #e6ccb0",
    textAlign: "center",
    fontWeight: "bold",
  },
  resultBox: {
    background: "linear-gradient(180deg, #f3d7a9 0%, #efc98a 100%)",
    padding: "16px",
    borderRadius: "22px",
    fontSize: "17px",
    lineHeight: 1.4,
    whiteSpace: "pre-line",
    border: "3px solid #e1b568",
    textAlign: "center",
  },
  nextHintBox: {
    background: "#fff",
    borderRadius: "22px",
    padding: "18px 14px",
    textAlign: "center",
    boxShadow: "0 6px 18px rgba(70,40,10,0.05)",
    position: "relative",
    overflow: "hidden",
  },
  footprintsTop: {
    position: "absolute",
    top: "14px",
    right: "12px",
    width: "120px",
    opacity: 0.4,
    pointerEvents: "none",
  },
  footprintsBottom: {
    position: "absolute",
    bottom: "14px",
    left: "12px",
    width: "120px",
    opacity: 0.4,
    transform: "rotate(180deg)",
    pointerEvents: "none",
  },
  nextHintImageWrap: {
    background: "#fff",
    borderRadius: "16px",
    padding: "10px",
    marginBottom: "12px",
  },
  nextHintImage: {
    width: "100%",
    maxHeight: "210px",
    objectFit: "contain",
    borderRadius: "10px",
    display: "block",
    background: "#fff",
  },
  nextHintText: {
    fontSize: "16px",
    lineHeight: 1.35,
    fontWeight: "bold",
    color: "#2d241c",
    position: "relative",
    zIndex: 1,
  },
  mapCard: {
    background: "#fff",
    borderRadius: "22px",
    padding: "14px",
    border: "3px solid #e7dccb",
    boxShadow: "0 6px 18px rgba(70,40,10,0.06)",
    marginTop: "12px",
  },
  mapTitle: {
    fontSize: "16px",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: "10px",
    color: "#2c2015",
  },
  mapFrame: { height: "250px", width: "100%", borderRadius: "14px", overflow: "hidden" },
  mapCaption: {
    marginTop: "10px",
    fontSize: "14px",
    lineHeight: 1.35,
    textAlign: "center",
    color: "#5a4a3e",
    fontWeight: "bold",
  },
  infoBox: {
    background: "#fff",
    border: "3px solid #eadfce",
    padding: "18px",
    borderRadius: "20px",
    fontSize: "18px",
    whiteSpace: "pre-line",
    lineHeight: 1.45,
  },
  successBox: {
    background: "#f3f3f3",
    padding: "18px",
    borderRadius: "22px",
    fontSize: "18px",
    lineHeight: 1.4,
    whiteSpace: "pre-line",
    border: "3px solid #dfdfdf",
  },
  downloadButton: {
    display: "block",
    width: "100%",
    background: "linear-gradient(180deg, #4f7f1f 0%, #2e6410 100%)",
    color: "white",
    textDecoration: "none",
    borderRadius: "18px",
    padding: "16px 18px",
    fontSize: "18px",
    fontWeight: "900",
    textAlign: "center",
    boxShadow: "0 5px 0 rgba(38,75,11,0.35)",
    boxSizing: "border-box",
  },
  formulaRevealCard: {
    background: "#fffdf8",
    border: "3px solid #d8bf98",
    borderRadius: "22px",
    padding: "16px",
    marginTop: "16px",
    textAlign: "center",
  },
  formulaRevealTitle: {
    fontSize: "20px",
    fontWeight: "900",
    color: "#467322",
    marginBottom: "12px",
  },
  formulaImageWrap: {
    background: "#fff",
    borderRadius: "16px",
    padding: "10px",
    marginBottom: "8px",
    border: "3px solid #eadfce",
  },
  formulaImage: {
    width: "100%",
    maxHeight: "520px",
    objectFit: "contain",
    display: "block",
    borderRadius: "12px",
    cursor: "zoom-in",
    background: "#fff",
  },
  outroHeroCard: {
    background: "linear-gradient(180deg, #fff8dc 0%, #f8e7b8 100%)",
    border: "3px solid #f0d36a",
    borderRadius: "24px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 8px 22px rgba(70,40,10,0.08)",
  },
  outroEmoji: {
    fontSize: "44px",
    marginBottom: "8px",
  },
  outroTitle: {
    fontSize: "26px",
    fontWeight: "900",
    color: "#2c2015",
    marginBottom: "12px",
  },
  outroText: {
    fontSize: "18px",
    lineHeight: 1.45,
    whiteSpace: "pre-line",
    textAlign: "center",
  },
  outroCard: {
    background: "#fff",
    border: "3px solid #eadfce",
    borderRadius: "22px",
    padding: "18px",
    textAlign: "center",
  },
  outroCardTitle: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#467322",
    marginBottom: "10px",
  },
  outroSmallText: {
    fontSize: "17px",
    lineHeight: 1.45,
    whiteSpace: "pre-line",
    textAlign: "center",
  },
  downloadSmallButton: {
    display: "block",
    width: "100%",
    background: "#fff",
    color: "#2e6410",
    textDecoration: "none",
    borderRadius: "16px",
    padding: "14px 18px",
    fontSize: "17px",
    fontWeight: "900",
    textAlign: "center",
    border: "3px solid #9bc56c",
    boxSizing: "border-box",
  },
  line: { marginBottom: "6px" },
  navRow: { display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginTop: "24px" },
  audioPlayerCard: {
    marginTop: "10px",
    marginBottom: "16px",
    background: "#f6ead7",
    borderRadius: "18px",
    padding: "16px",
    textAlign: "center",
    border: "3px dashed #c9a97a",
  },
  audioPlayerMainText: {
    fontSize: "18px",
    fontWeight: "900",
    marginBottom: "12px",
    color: "#2c2015",
  },
  audioPlayButton: {
    background: "#a32020",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "60px",
    height: "60px",
    fontSize: "22px",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    fontWeight: "900",
  },
  lockCard: {
    background: "linear-gradient(180deg, #3d3127 0%, #2d241c 100%)",
    borderRadius: "26px",
    padding: "18px",
    border: "4px solid #b98a43",
    boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
  },
  lockCardOpen: {
    border: "4px solid #6ea53a",
    boxShadow: "0 10px 30px rgba(69,120,35,0.22)",
  },
  lockTitle: {
    color: "#fff4df",
    fontSize: "22px",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: "12px",
    lineHeight: 1.15,
  },
  lockHelpText: {
    color: "#f7ead5",
    fontSize: "16px",
    lineHeight: 1.35,
    textAlign: "center",
    marginBottom: "16px",
  },
  lockBody: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    marginBottom: "16px",
    width: "100%",
    alignItems: "stretch",
  },
  lockWheel: {
    background: "#f8eddc",
    borderRadius: "20px",
    padding: "10px 6px",
    display: "grid",
    gap: "8px",
    alignItems: "center",
    border: "3px solid #d8bf98",
    minHeight: "210px",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  lockArrowButton: {
    width: "100%",
    background: "#fff",
    color: "#2d241c",
    border: "3px solid #ccb38c",
    borderRadius: "14px",
    padding: "10px 4px",
    fontSize: "20px",
    fontWeight: "900",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  lockMiniValue: {
    background: "#f4ead9",
    borderRadius: "14px",
    border: "2px solid #e2cfb0",
    minHeight: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "6px 3px",
    fontSize: "clamp(10px, 2.8vw, 13px)",
    fontWeight: "bold",
    color: "#7a6446",
    lineHeight: 1.1,
    minWidth: 0,
    overflow: "hidden",
    wordBreak: "normal",
overflowWrap: "normal",
hyphens: "none",
    boxSizing: "border-box",
  },
  lockMainValue: {
    background: "#fffdf8",
    borderRadius: "16px",
    border: "3px solid #d8c19a",
    minHeight: "68px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "8px 4px",
    fontSize: "clamp(15px, 4.2vw, 22px)",
    fontWeight: "900",
    color: "#2b2118",
    lineHeight: 1.1,
    minWidth: 0,
    overflow: "hidden",
    wordBreak: "normal",
overflowWrap: "normal",
hyphens: "none",
    boxSizing: "border-box",
  },
  lockOpenButton: {
    background: "linear-gradient(180deg, #5b902c 0%, #3f6f1d 100%)",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "16px 18px",
    fontSize: "20px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 4px 0 rgba(43,84,17,0.35)",
    width: "100%",
  },
  lockOpenButtonDone: {
    background: "linear-gradient(180deg, #7ab542 0%, #5f9730 100%)",
    boxShadow: "0 4px 0 rgba(52,98,24,0.30)",
    cursor: "default",
    opacity: 1,
  },
  lockHintBox: {
    background: "#fff3e6",
    color: "#4b2d10",
    padding: "16px",
    borderRadius: "18px",
    fontSize: "16px",
    lineHeight: 1.35,
    border: "3px solid #efc18f",
    textAlign: "center",
    marginTop: "14px",
    fontWeight: "bold",
  },
  lockHintTitle: { fontSize: "16px", fontWeight: "900", marginBottom: "8px" },
  lockSolutionBox: {
    background: "#f9efe0",
    color: "#3d2911",
    padding: "16px",
    borderRadius: "18px",
    fontSize: "16px",
    lineHeight: 1.35,
    border: "3px solid #e6ccb0",
    textAlign: "center",
    marginTop: "14px",
    fontWeight: "bold",
  },
  lockSuccessBox: {
    background: "#eef7e4",
    color: "#274314",
    padding: "16px",
    borderRadius: "18px",
    fontSize: "17px",
    lineHeight: 1.4,
    whiteSpace: "pre-line",
    border: "3px solid #9bc56c",
    textAlign: "center",
    marginTop: "14px",
    fontWeight: "bold",
  },
  socialButtonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "16px",
  },
  socialButton: {
    display: "block",
    width: "100%",
    background: "#fff",
    color: "#2e6410",
    textDecoration: "none",
    borderRadius: "16px",
    padding: "14px 18px",
    fontSize: "17px",
    fontWeight: "900",
    textAlign: "center",
    border: "3px solid #9bc56c",
    boxSizing: "border-box",
  },
  hashtagBox: {
    marginTop: "14px",
    background: "#f7efe4",
    border: "3px solid #e2d3be",
    borderRadius: "16px",
    padding: "14px",
    fontSize: "16px",
    lineHeight: 1.35,
    textAlign: "center",
    color: "#2c2015",
  },
  reviewButton: {
    display: "block",
    width: "100%",
    marginTop: "16px",
    background: "linear-gradient(180deg, #5b902c 0%, #3f6f1d 100%)",
    color: "white",
    textDecoration: "none",
    borderRadius: "16px",
    padding: "14px 18px",
    fontSize: "17px",
    fontWeight: "900",
    textAlign: "center",
    boxShadow: "0 4px 0 rgba(43,84,17,0.35)",
    boxSizing: "border-box",
  },
  outroRestartCard: {
    background: "#f3f3f3",
    border: "3px solid #dfdfdf",
    borderRadius: "22px",
    padding: "18px",
    textAlign: "center",
  },
  outroRestartText: {
    fontSize: "18px",
    lineHeight: 1.4,
    whiteSpace: "pre-line",
    textAlign: "center",
    marginBottom: "14px",
  },
  restartMissionButton: {
    width: "100%",
    background: "linear-gradient(180deg, #5b902c 0%, #3f6f1d 100%)",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "15px 18px",
    fontSize: "17px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 4px 0 rgba(43,84,17,0.35)",
  },
  zoomOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.72)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px",
  },
  zoomModal: {
    position: "relative",
    width: "100%",
    maxWidth: "900px",
    maxHeight: "92vh",
    background: "#fffdf8",
    borderRadius: "20px",
    padding: "14px",
    border: "3px solid #ead8bd",
    boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
    overflow: "auto",
  },
  zoomCloseButton: {
    position: "absolute",
    top: "8px",
    right: "10px",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "none",
    background: "#a32020",
    color: "#fff",
    fontSize: "28px",
    fontWeight: "900",
    cursor: "pointer",
    lineHeight: 1,
  },
  zoomTitle: {
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "900",
    marginBottom: "12px",
    color: "#2c2015",
    paddingRight: "44px",
  },
  zoomImage: {
    width: "100%",
    maxHeight: "82vh",
    objectFit: "contain",
    display: "block",
    borderRadius: "14px",
    background: "#fff",
  },
};
