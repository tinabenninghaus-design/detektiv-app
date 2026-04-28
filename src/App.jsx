import { useMemo, useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import { keksformelKappelMission } from "./missions/keksformel-kappel";

const missions = {
  "keksformel-kappel": keksformelKappelMission,
};

function getMissionFromUrl() {
  const path = window.location.pathname;
  const slug = path.split("/m/")[1]?.split("/")[0];
  return missions[slug] || keksformelKappelMission;
}

const mission = getMissionFromUrl();

const DEMO_ACCESS_CODE = mission.demoAccessCode;
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const START_MAPS_URL = mission.startMapsUrl;

function MapHint({ lat, lng, radius, title }) {
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
        Der markierte Bereich zeigt euch ungefähr, wo ihr suchen müsst.
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

function PlanAssembly({ part1, part2, completeImage, assembled, onAssemble, onZoom }) {
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
    if (snapping || assembled) return;

    setSnapping(true);

    setTimeout(() => {
      playSnapSound();
    }, 450);

    setTimeout(() => {
      onAssemble();
      setSnapping(false);
    }, 1250);
  };

  return (
    <div style={styles.planAssemblyCard}>
      <div style={styles.planAssemblyTitle}>🧩 Der zweite Teil des Fluchtplans</div>

      {!assembled ? (
        <>
          <div style={styles.planAssemblyText}>
            Der Spion hält euch den zweiten Teil hin.
            <br />
            Wenn beide Stücke zusammenpassen, wisst ihr, wohin Meister der Krümel geflüchtet ist.
          </div>

          <div style={styles.planPartsPreview}>
            <img
              src={part1}
              alt="Erster Teil des Fluchtplans"
              style={{
                ...styles.planPartImage,
                ...(snapping ? styles.planPartImageSnapping : {}),
              }}
              onClick={() => onZoom(part1, "Fluchtplan Teil 1")}
            />
            <img
              src={part2}
              alt="Zweiter Teil des Fluchtplans"
              style={{
                ...styles.planPartImageFlying,
                ...(snapping ? styles.planPartImageFlyingSnapping : {}),
              }}
              onClick={() => onZoom(part2, "Fluchtplan Teil 2")}
            />

            {snapping ? (
              <div style={styles.snapText}>
                KLICK!
                <br />
                Die beiden Teile passen perfekt zusammen...
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
            {snapping ? "🧩 Wartet mal... jetzt ergibt alles Sinn!" : "🧩 Fluchtplan zusammensetzen"}
          </button>
        </>
      ) : (
        <>
          <div style={styles.planAssemblyText}>
            Wow!
            <br /><br />
            Jetzt ergibt alles Sinn!
            <br /><br />
            Ihr habt den kompletten Fluchtplan!
          </div>

          <div style={styles.completePlanWrap}>
            <img
              src={completeImage}
              alt="Vollständiger Fluchtplan"
              style={styles.completePlanImage}
              onClick={() => onZoom(completeImage, "Vollständiger Fluchtplan")}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div style={styles.zoomHint}>Zum Vergrößern antippen</div>
          </div>
        </>
      )}
    </div>
  );
}

function HintCard({ title, text, image, image2, onImageClick }) {
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
              e.currentTarget.style.display = "none";
            }}
          />
          {onImageClick ? <div style={styles.zoomHint}>Zum Vergrößern antippen</div> : null}
        </div>
      ) : null}
      {image2 ? (
        <div style={styles.hintImageWrap}>
          <img
            src={image2}
            alt={title ? `${title} 2` : "Zusätzlicher Hinweis"}
            style={styles.hintImage}
            onError={(e) => {
              e.currentTarget.style.display = "none";
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

const pages = [
  {
    id: "access",
    type: "access",
    title: "MISSION",
    titleLine2: "DIE VERSCHWUNDENE",
    titleLine3: "KEKSFORMEL",
    subtitle: "EIN ABENTEUER FÜR KLEINE DETEKTIVE",
    mapHint: {
      lat: 48.290403410202586,
      lng: 7.747882244995799,
      radius: 60,
      title: "STARTPUNKT",
    },
  },
  {
    id: "rules",
    type: "rules",
    title: "REGELN",
    titleLine2: "BEVOR DIE MISSION STARTET",
    intro:
      "Bevor ihr Meister der Krümel verfolgt, lest bitte kurz die wichtigsten Regeln.\n\nDann kann das Abenteuer sicher losgehen.",
    rules: [
      {
        icon: "🚦",
        title: "Ihr spielt auf eigene Verantwortung",
        text: "Achtet auf Verkehr, Wege und eure Umgebung. Erwachsene behalten die Gruppe im Blick.",
      },
      {
        icon: "🚫",
        title: "Kein Privatgelände betreten",
        text: "Alle Hinweise sind von öffentlich zugänglichen Wegen aus erreichbar.",
      },
      {
        icon: "🤫",
        title: "Nehmt Rücksicht",
        text: "Bitte stört keine Anwohner, Passanten oder andere Kinder.",
      },
      {
        icon: "🧹",
        title: "Hinterlasst alles ordentlich",
        text: "Nehmt nichts mit, außer es ist ausdrücklich Teil des Spiels.",
      },
      {
        icon: "🗑️",
        title: "Kein Müll, kein Lärm",
        text: "Meister der Krümel mag Chaos – ihr bleibt besser unauffällig.",
      },
    ],
    acceptText: "✅ Wir haben die Regeln gelesen und akzeptiert",
  },
  {
    id: "start",
    type: "start",
    title: "MISSION",
    titleLine2: "DIE VERSCHWUNDENE",
    titleLine3: "KEKSFORMEL",
    subtitle: "EIN ABENTEUER FÜR KLEINE DETEKTIVE",
    storyBox:
      "Detektive aufgepasst!\n\nDer Club der Keksliebhaber zählt auf euch.\n\nDie geheime Keksformel wurde gestohlen!\n\nUnd zwar von niemand Geringerem als:\nMEISTER DER KRÜMEL!\n\nIhr seid genau an dem Ort angekommen,\nan dem er zuletzt gesehen wurde...\n\nUnd ich fürchte...\n\ner weiß längst, dass ihr hier seid.\n\nDenn er hat euch eine Nachricht hinterlassen.\n\nHört sie euch jetzt an...\n\nVielleicht ist das seine erste Spur.",
    audio: "/meister-intro.mp3",
    audioTitle: "Geheime Nachricht anhören",
  },
  {
    id: "station1",
    type: "riddle",
    title: "STATION 1:",
    titleLine2: "DIE ERSTE SPUR",
    image: "/station1.jpeg",
    storyBox:
      "Wartet mal...\n\nSeht ihr das?\n\nKleine Kekskrümel liegen auf dem Boden!\n\nSie führen direkt zum Eingang der Kirche...\n\nMeister der Krümel war also hier.\n\nDas ist seine erste Spur!",
    taskTitle: "DIE GEHEIMEN HELFER",
    taskText:
      "Meister der Krümel war hier…\n\nDoch dann wurde er plötzlich von einem Steinmonster erschreckt!\n\nZum Glück hat das Steinmonster kleine Helfer.\n\nSie haben genau beobachtet,\nwohin der Meister danach geflüchtet ist.\n\nFindet die kleinen Helfer\nund zählt sie!",
    resultBox:
      "Sehr gut, Detektive!\n\nDie kleinen Helfer nicken euch zu.\n\nEiner von ihnen flüstert:\n\n„Diese Zahl könnte später noch wichtig werden…“\n\nDann zeigt euch ein anderer Helfer einen geheimen Zettel…",
    hint1Title: "Hinweis 1",
    hint1Text:
      "Tipp:\n\nDas Monster sitzt weiter unten an der Figur…\n\nGanz in seiner Nähe\nverstecken sich die Helfer.",
    hint1Image: "/hinweis1a.jpeg",
    hint2Title: "Hinweis 2",
    hint2Text:
      "Jetzt wird’s einfach:\n\nDie Helfer haben Flügel\nund kleine Gesichter.\n\nZählt alle, die ihr sehen könnt!",
    hint2Image: "/hinweis1b.jpeg",
    solutionText: "Die richtige Lösung ist: 3",
    answerKey: "helfer",
    correctAnswers: ["3"],
    placeholder: "Zahl eingeben",
    nextMapHint: {
      lat: 48.28995189877323,
      lng: 7.747286794557996,
      radius: 120,
      title: "ORIENTIERUNGSHILFE SCHULHOF",
    },
    nextHintImage: "/hinweis1.jpeg",
    nextHintZoomable: true,
    nextHintText:
      "Hier wurde Meister der Krümel als Nächstes gesehen. Erkennt ihr den Ort?",
  },
  {
    id: "station2",
    type: "riddle",
    taskMode: "choice",
    title: "STATION 2:",
    titleLine2: "DIE KRAFTPROBE",
    image: "/station2.jpeg",
    storyBox:
      "Hier ist er stehen geblieben...\n\nAber nicht, um sich auszuruhen.\n\nNein – hier wollte Meister der Krümel zeigen,\nwie toll er ist.\n\n„Selbst wenn ihr meine Keksformel findet…“, hat er geprahlt,\n\n„ihr habt gar nicht die Kraft,\num den perfekten Teig zu machen!“\n\nDann hat er sich an die Stange gehängt\nund laut mitgezählt:\n\n„1… 2… 3…“\n\nBis er bei 10 angekommen ist.\n\nEr wollte euch wohl beweisen,\ndass ihr keine Chance gegen ihn habt...\n\nAber vielleicht hat er euch unterschätzt...",
    taskTitle: "DER STÄRKE-CHECK",
    taskText:
      "Jetzt seid ihr dran!\n\nHängt euch an die Stange\nund zählt eure Sekunden.\n\nSchafft ihr mehr als die 10 Sekunden von Meister der Krümel?\n\nOder seid ihr vielleicht sogar stärker als er?",
    choiceOptions: [
      {
        value: "ueberboten",
        label: "💪 Überboten!",
        resultBox:
          "Wow!\n\nIhr wart stärker als Meister der Krümel!\n\nDas hat er bestimmt nicht erwartet...\n\nJetzt wird er langsam nervös!",
      },
      {
        value: "punktlandung",
        label: "🎯 Punktlandung!",
        resultBox:
          "Perfekt!\n\nGenau so stark wie Meister der Krümel.\n\nAber ihr habt etwas, das er nicht hat:\n\nTeamgeist!\n\nUnd das bringt euch weiter.",
      },
      {
        value: "knapp",
        label: "😅 Knapp dran!",
        resultBox:
          "Das war richtig stark!\n\nIhr wart ganz nah dran an Meister der Krümel.\n\nUnd wer so nah dran ist,\nkommt beim nächsten Versuch ganz sicher vorbei!\n\nEr sollte euch besser nicht unterschätzen…",
      },
    ],
    answerKey: "kraftprobe",
    nextMapHint: {
      lat: 48.29009868466259,
      lng: 7.746701051557932,
      radius: 50,
      title: "ORIENTIERUNGSHILFE ZUM HECKENDURCHGANG",
    },
    nextHintImage: "/hinweis2.jpeg",
    nextHintText:
      "Meister der Krümel ist weiter geflüchtet...\n\nHaltet Ausschau nach einem schmalen Durchgang zwischen den Hecken – er versteckt sich etwas am Rand des Geländes.\n\nDort geht die Spur vom Meister weiter!",
  },
  {
    id: "station3",
    type: "riddle",
    taskMode: "choice",
    title: "STATION 3:",
    titleLine2: "DER GEHEIMGANG",
    image: "/station3.jpeg",
    storyBox: "Was war das denn???\n\nHört genau hin!",
    audio: "/station3.mp3",
    audioTitle: "🎧 Geräusch aus dem Gebüsch anhören",
    taskTitle: "DIE SCHLEICHMISSION",
    taskText:
      "Auf geht’s, Detektive!\n\nDas ist eure Chance!\n\nSchleicht euch jetzt so leise wie möglich durch den Gang,\num Meister der Krümel zu erwischen!",
    choiceOptions: [
      {
        value: "lautlos",
        label: "🕵️ Lautlos wie Schatten",
        resultBox:
          "Perfekt!\n\nIhr wart fast nicht zu hören.\n\nDoch Meister der Krümel war euch trotzdem noch einen Schritt voraus...\n\nAber ihr seid ganz dicht hinter ihm!",
      },
      {
        value: "vorsichtig",
        label: "🤫 Ziemlich leise",
        resultBox:
          "Das war schon richtig gut!\n\nEin kleines Geräusch war vielleicht dabei...\n\nDoch Meister der Krümel war euch trotzdem noch einen Schritt voraus.\n\nZum Glück seid ihr weiter auf seiner Spur!",
      },
      {
        value: "laut",
        label: "😂 Eher laut unterwegs",
        resultBox:
          "Oh oh...\n\nDas war ganz schön laut!\n\nVielleicht hat Meister der Krümel euch gehört...\n\nUnd trotzdem war er euch wieder einen Schritt voraus.\n\nAber ihr gebt nicht auf und bleibt dran!",
      },
    ],
    answerKey: "schleichmission",
    nextHintImage: "/hinweis3.jpeg",
    nextHintText:
      "Die Spur führt weiter. Schaut genau hin – dort hat sich Meister der Krümel etwas Neues ausgedacht.",
  },
  {
    id: "station4",
    type: "riddle",
    taskMode: "choice",
    title: "STATION 4:",
    titleLine2: "DER FLUCHTPLAN",
    image: null,
    storyBox:
      "Moment mal...\n\nWas liegt denn da auf dem Boden?\n\nDas sieht aus wie ein Fluchtplan!\n\nMeister der Krümel muss ihn unterwegs verloren haben.\n\nHebt ihn vorsichtig auf und schaut ihn euch genau an...",
    planImage: "/station4.jpeg",
    planButtonText: "🧾 Fluchtplan aufheben",
    taskTitle: "DER GEHEIME FLUCHTPLAN",
    taskText:
      "Oh nein...\n\nDa fehlt ja ein Stück!\n\nDer Plan ist unvollständig.\n\nAber vielleicht reicht das schon, um Meister der Krümel ein Stück zu folgen.\n\nFolgt den Kreisen – genau so, wie sie eingezeichnet sind.\n\nGeht den Weg nach, bis der Plan plötzlich endet.\n\nUnd genau dort stimmt etwas nicht...\n\nSchaut euch ganz genau um!",
    choiceOptions: [
      {
        value: "fluchtplan",
        label: "👀 Wir haben etwas entdeckt!",
      },
    ],
    answerKey: "untergrund",
    hint1Title: "Hinweis 1",
    hint1Text:
      "Ihr wisst nicht,\nwohin ihr gehen müsst?\n\nVergleicht den ersten Teil des Fluchtplans mit der Straße vor euch.\n\nDie Kreise auf dem Plan sind eure Spur.",
    hint1Image: null,
    hint2Title: "Hinweis 2",
    hint2Text:
      "Folgt nur den Gullideckeln,\ndie wie die Kreise auf dem ersten Fluchtplan-Teil angeordnet sind.\n\nWenn der Plan endet, seid ihr am richtigen Ort.\n\nSchaut euch dort ganz genau um...",
    hint2Image: null,
    mapHint: {
      lat: 48.29020174749672,
      lng: 7.742450771764303,
      radius: 20,
      title: "ORIENTIERUNGSHILFE ZUM ENDE DER SPUR",
    },
  },
  {
    id: "station5",
    type: "riddle",
    taskMode: "photoChoice",
    title: "STATION 5:",
    titleLine2: "DER SPION",
    image: "/station5.jpeg",
    storyBox:
      "Stopp!\n\nHabt ihr das gesehen?\n\nDa beobachtet euch jemand...\n\nEr hat euch die ganze Zeit im Blick behalten.\n\nDas muss ein Spion von Meister der Krümel sein!\n\nEr tritt vorsichtig näher...\n\nUnd flüstert:\n\n„Psst... ich will euch helfen.“",
    taskTitle: "DER SEITENWECHSEL",
    taskText:
      "Der Spion schaut sich nervös um...\n\n„Meister der Krümel hat mir einen Auftrag gegeben.\nIch sollte diesen Teil des Fluchtplans für ihn aufbewahren...“\n\nEr hält kurz inne.\n\n„Aber ich habe genug davon.\nIch bekomme nicht mal einen einzigen Keks!“\n\nEr schaut euch entschlossen an:\n\n„Ich beweise euch, dass ich wirklich die Seiten wechseln will.“\n\nLasst uns ein verrücktes Teamfoto machen!\n\nDann wisst ihr, dass ich jetzt zu euch gehöre.",
    choiceOptions: [
      {
        value: "foto gemacht",
        label: "📸 Wir haben ein Teamfoto gemacht!",
        resultBox:
          "Perfekt!\n\nDer Spion grinst breit.\n\n„Jetzt sind wir ein Team.“\n\nEr schaut sich noch einmal vorsichtig um...\n\n„Wenn Meister der Krümel merkt, dass ich euch helfe, bekomme ich richtig Ärger.“\n\nDann beugt er sich zu euch und flüstert:\n\n„Aber egal. Zusammen schaffen wir das!“\n\nEr holt ein zerknittertes Stück Papier hervor.\n\n„Das hier hat mir Meister der Krümel zur Aufbewahrung gegeben...\nDer zweite Teil vom Fluchtplan!“\n\nEr zwinkert euch zu.\n\n„Jetzt gehört er euch.“",
      },
    ],
    answerKey: "spion",
    planPart1: "/Fluchtplan1.png",
    planPart2: "/Fluchtplan2.png",
    planCompleteImage: "/Fluchtplan-komplett.png",
    nextMapHint: {
      lat: 48.28964348125478,
      lng: 7.740355094937401,
      radius: 120,
      title: "ORIENTIERUNGSHILFE (NUR WENN IHR NICHT WEITERKOMMT)",
    },
    nextHintImage: "/hinweis5.jpeg",
    nextHintText:
      "Der vollständige Fluchtplan zeigt euch den Weg.\n\nSchaut ihn euch ganz genau an und folgt der Spur.\n\nNur wenn ihr wirklich nicht weiterkommt, könnt ihr euch hier einen kleinen Hinweis holen.",
  },

  {
    id: "station6",
    type: "riddle",
    title: "STATION 6:",
    titleLine2: "DER GEHEIME TREFFPUNKT",
    image: "/station6.jpeg",
    storyBox:
      "Der Spion bleibt stehen…\n\n„Ich weiß jetzt, warum der Meister hier war…“\n\nEr schaut sich um.\n\n„Er hat sich hier mit seinen Spionen getroffen,\num seinen Fluchtplan weiter zu besprechen…“\n\nEr senkt die Stimme.\n\n„Sie dachten, sie wären unbeobachtet…“\n\nEr macht eine kurze Pause.\n\n„Aber sie haben sich geirrt…“\n\nEr deutet in die Richtung.\n\n„Jemand hat alles gesehen…\nganz still… ganz versteckt…“\n\nEr flüstert:\n\n„Ein Tier…“\n\nDann schaut er euch an.\n\n„Findet heraus, welches.“",
    taskTitle: "DAS VERSTECK",
    taskText:
      "Seht euch hier genau um.\n\nWo könnte man sich verstecken,\nohne sofort gesehen zu werden?\n\nSchaut euch dort ganz genau um…\n\nFindet das Tier,\ndas alles beobachtet hat.",
    resultBox:
      "Sehr gut!\n\nIhr habt den stillen Beobachter gefunden.\n\nDer Elefant wackelt geheimnisvoll hin und her…\n\nDer Spion beugt sich zu ihm.\n\n„Was? Wirklich?“\n\nDann schaut er euch an:\n\n„Der Elefant hat alles gesehen…“\n\nEr denkt kurz nach.\n\n„Moment…“\n\n„Das war nicht nur ein Versteck…“\n\n„Das war ihr Treffpunkt…\nund sie haben ihn mit diesem Tier markiert…“\n\nEr nickt langsam.\n\n„Das ist wichtig…“",
    hint1Title: "Wir kommen nicht weiter",
    hint1Text:
      "Schaut euch an, wo man sich gut verstecken könnte…",
    hint1Image: null,
    hint2Title: "Hinweis zum Treffpunkt",
    hint2Text:
      "Der Spion flüstert…\n\n„Nicht nur das Versteck ist wichtig…\nschaut euch auch darum herum um…“",
    hint2Image: "/hinweis6-treffpunkt-1.jpeg",
    hint2Image2: "/hinweis6-treffpunkt-2.jpeg",
    solutionText: "Die richtige Lösung ist: Elefant",
    answerKey: "tier",
    correctAnswers: ["elefant", "Elefant"],
    placeholder: "Tier eingeben",
    nextMapHint: {
      lat: 48.28955781804192,
      lng: 7.742026111057529,
      radius: 60,
      title: "ORIENTIERUNGSHILFE ZUR EIERKÖNIGIN",
    },
    nextHintImage: "/hinweis6.jpeg",
    nextHintText:
      "Der Spion flüstert:\n\n„Meister der Krümel ist zurück ins Wohngebiet geflüchtet.“\n\n„Der Elefant hat gehört, wie er etwas von einer Königin gemurmelt hat…\nund von Eiern.“\n\nFolgt seiner Spur zurück und haltet Ausschau nach der Eierkönigin.",
  },

  {
    id: "station7",
    type: "riddle",
    taskMode: "choice",
    title: "STATION 7:",
    titleLine2: "DIE KÖNIGIN",
    image: "/station7.jpeg",
    storyBox:
      "Ihr seid wieder beim Haus mit der Eierkönigin angekommen.\n\nDer Spion bleibt stehen…\n\n„Das muss es sein…“\n\nEr schaut sich das Haus genau an.\n\n„Hier war er… ganz sicher.“\n\nEr wird leiser.\n\n„Wenn etwas schiefgeht…\nhinterlässt der Meister manchmal ein Zeichen…“\n\nEr schaut sich suchend um.\n\n„Nicht offen… sondern gut versteckt…“\n\n„Nur, wenn man ganz genau hinschaut…“\n\nDann sieht er euch an.\n\n„Vielleicht hat er auch hier etwas zurückgelassen…“",
    taskTitle: "DAS NOTFALLZEICHEN",
    taskText:
      "Seht euch hier ganz genau um.\n\nFindet heraus,\nob der Meister hier ein Zeichen hinterlassen hat.\n\nWenn ja…\nwelches ist es?",
    choiceOptions: [
      {
        value: "sonne",
        label: "☀️ Sonne",
        resultBox:
          "Ja!\n\nIhr habt das geheime Zeichen gefunden.\n\nDer Spion nickt euch zu.\n\n„Das ist es…“\n\nEr schaut sich noch einmal um.\n\n„Ab hier wird es zu gefährlich für mich…“\n\n„Ich muss zurück auf meinen Posten,\nbevor der Meister merkt, dass ich verschwunden bin…“\n\nEr tritt einen Schritt zurück.\n\n„Ihr seid jetzt auf euch allein gestellt.“\n\nDann flüstert er:\n\n„Der Meister weiß, dass ihr ihm dicht auf den Fersen seid…“\n\n„Er hat keine Zeit mehr…\ner ist panisch aus dem Ort geflohen…“\n\n„Los! Hinterher!“\n\nUnd plötzlich ist er verschwunden.",
      },
      { value: "stern", label: "⭐ Stern" },
      { value: "herz", label: "❤️ Herz" },
      { value: "blume", label: "🌼 Blume" },
    ],
    answerKey: "symbol",
    nextMapHint: {
      lat: 48.288146724406005,
      lng: 7.747724653451934,
      radius: 100,
      title: "ORIENTIERUNGSHILFE ZUR KEKSDOSE",
    },
    nextHintImage: "/hinweis7.jpeg",
    nextHintText:
      "Folgt seiner Spur aus dem Ort heraus.\n\nBeeilt euch…\n\nIhr seid ihm ganz nah!",
  },

  {
    id: "finale",
    type: "finale",
    title: "STATION 8:",
    titleLine2: "DIE VERSCHLOSSENE KEKSDOSE",
    image: "/finale.jpeg",
    storyBox:
      "Ihr seid Meister der Krümel bis zum Ortsrand gefolgt…\n\nEr ist ganz nah.\n\nLauscht genau hin…",
    taskTitle: "KNACKT DAS SCHLOSS",
    audio: "/meister-flucht.mp3",
    audioTitle: "🎧 Lauscht Meister der Krümel",
    taskText:
      "Auf der Dose ist ein besonderes Schloss.\n\nNur wer die richtige Kombination kennt,\nkann die Dose öffnen!\n\nErinnert euch an die drei wichtigsten Hinweise:\n\ndie Zahl, das Tier und das Zeichen.",
    successBox:
      "KLICK...\n\nDas Schloss springt auf!\n\nIhr öffnet vorsichtig die Dose...\n\n😳\n\nHIER IST SIE!\n\nDie geheime Keksformel!\n\nMeister der Krümel ist zwar entkommen...\n\naber das Wichtigste habt ihr gerettet!\n\n🎉 Glückwunsch, Detektive!",
  },
  {
    id: "recipe",
    type: "recipe",
    title: "",
    titleLine2: "",
    outroText:
      "Ihr habt die geheime Keksformel gerettet und Meister der Krümel bis zum Schluss verfolgt.\n\nEr ist zwar entkommen…\n\naber ohne das geheime Rezept!\n\nJetzt kann er nie wieder seine leckeren Kekse backen.\n\nDer Club der Keksliebhaber bedankt sich bei euch für eure Hilfe!",
    photoText:
      "📸 Wenn ihr möchtet, teilt euer Teamfoto gerne auf Instagram oder Facebook.\n\nMarkiert uns oder nutzt den Hashtag:\n#geheimekeksformel\n\nSo sehen wir, welche starken Detektiv-Teams Meister der Krümel auf den Fersen waren.",
    reviewText:
      "⭐ Wenn euch die Mission gefallen hat, freuen wir uns riesig über eine Bewertung.\n\nDas hilft anderen Familien, unser kleines Abenteuer zu entdecken – und vielleicht gibt es dann bald den nächsten Einsatz.",
    returnText:
      "Ihr steht jetzt fast wieder am Startpunkt.\n\nWenn ihr zurück zur Kirche möchtet, folgt einfach dem Weg zurück Richtung Ortsmitte – von hier aus ist es nur ein kurzes Stück.",
    finalText:
      "Bis zum nächsten Abenteuer, Detektive!\n\n🕵️‍♀️🍪🕵️",
  },
];

const initialAnswers = {
  helfer: "",
  kraftprobe: "",
  schleichmission: "",
  untergrund: "",
  spion: "",
  tier: "",
  symbol: "",
};

const lockAnimals = [
  { label: "Katze", emoji: "🐱" },
  { label: "Fuchs", emoji: "🦊" },
  { label: "Elefant", emoji: "🐘" },
  { label: "Hund", emoji: "🐶" },
  { label: "Maus", emoji: "🐭" },
  { label: "Löwe", emoji: "🦁" },
  { label: "Affe", emoji: "🐵" },
  { label: "Bär", emoji: "🐻" },
  { label: "Frosch", emoji: "🐸" },
];

const lockSymbols = [
  { label: "Ei", emoji: "🥚" },
  { label: "Stern", emoji: "⭐" },
  { label: "Herz", emoji: "❤️" },
  { label: "Blume", emoji: "🌼" },
  { label: "Sonne", emoji: "☀️" },
  { label: "Wurst", emoji: "🌭" },
  { label: "Ball", emoji: "⚽" },
  { label: "Buch", emoji: "📘" },
  { label: "Baum", emoji: "🌳" },
];

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

export default function App() {
  const savedGame = loadSavedGame();
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
  const correctLeft = Number(answers.helfer) || 3;
  const correctAnimalLabel = normalize(answers.tier) === "elefant" ? "Elefant" : "Elefant";
  const correctSymbolLabel = normalize(answers.symbol) === "sonne" ? "Sonne" : "Sonne";
  const lockHintLevel = Math.min(lockAttempts, 3);
  const shouldShowTaskCard = !page.planImage || showPlan;
  const currentResultBox = selectedChoiceData?.resultBox || page.resultBox;

  const resetGameForTesting = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const handleSecretResetTouch = (event) => {
    if (event.touches.length !== 3) return;

    setSecretResetTapCount((prev) => {
      const next = prev + 1;

      if (next >= 2) {
        if (window.confirm("Testmodus: Spiel wirklich neu starten?")) {
          localStorage.removeItem(STORAGE_KEY);
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
    const subject = encodeURIComponent("Problem bei der Schnitzeljagd-App");
    const body = encodeURIComponent(
      `Station / Seite: ${problemStation || "-"}\n\n` +
        `Gerät / Browser: ${problemDevice || "-"}\n\n` +
        `Was ist passiert?\n${problemText || "-"}`
    );

    window.location.href = `mailto:info@der-spielzeugladen.de?subject=${subject}&body=${body}`;
  };

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          accessGranted,
          currentPage,
          answers,
          planAssembled,
        })
      );
    } catch {
      // Speicherung ist nicht verfügbar – die App läuft trotzdem weiter.
    }
  }, [accessGranted, currentPage, answers, planAssembled]);

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

    if (page.id === "station7" && value !== "sonne") {
      const wrongOption = page.choiceOptions?.find((option) => option.value === value);
      const wrongLabel = wrongOption?.label?.replace(/[⭐❤️🌼☀️]/g, "").trim() || "Dieses Zeichen";
      setWrongChoice(value);
      setChoiceError(`${wrongLabel} ist leider falsch. Schaut noch einmal genauer hin.`);
      return;
    }

    if (page.id === "station4" && value !== "fluchtplan") {
      setChoiceError("Schaut euch den geheimen Fluchtplan noch einmal ganz genau an.");
      return;
    }

    if (page.id === "station5" && !photoPreview) {
      setChoiceError("Macht zuerst ein Teamfoto mit dem Spion.");
      return;
    }

    setChoiceError("");
    setWrongChoice("");
    setAnswers((prev) => ({ ...prev, [page.answerKey]: value }));

    if (page.id === "station4" && value === "fluchtplan") {
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
    const isCorrect =
      lockLeft === correctLeft &&
      currentAnimal.label === correctAnimalLabel &&
      currentSymbol.label === correctSymbolLabel;

    if (isCorrect) {
      vibrate([80, 40, 120]);
      setTimeout(() => { playSound("/unlock.mp3", 0.7); }, 120);
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

      setAccessError(result.message || "Der Einsatz-Code ist leider nicht korrekt.");
    } catch {
      setAccessError("Die Code-Prüfung ist gerade nicht erreichbar. Bitte versucht es erneut.");
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

        {page.type === "access" ? (
          <>
            <div style={styles.headerImageWrap}>
              <img
                src="/header.png"
                alt="Die verschwundene Keksformel"
                style={styles.headerImage}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div style={styles.startTitleWrap}>
              <div style={styles.startMissionLabel}>{page.title}</div>
              <h1 style={styles.startMainTitle}>{page.titleLine2}</h1>
              <h1 style={styles.startMainTitleBig}>{page.titleLine3}</h1>
            </div>

            <div style={styles.accessCard}>
              <div style={styles.accessTitle}>NUR FÜR ECHTE DETEKTIVE</div>
              <div style={styles.accessText}>
                Gebt euren Einsatz-Code ein, um die Mission freizuschalten.
              </div>

              <input
                style={styles.input}
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Einsatz-Code eingeben"
                disabled={isRedeemingCode}
              />

              <div style={styles.readyText}>
                Seid ihr bereit, Meister der Krümel aufzuhalten?
              </div>

              <button
                style={{
                  ...styles.startButton,
                  ...(isRedeemingCode ? styles.primaryButtonDisabled : {}),
                }}
                onClick={unlockMission}
                disabled={isRedeemingCode}
              >
                {isRedeemingCode ? "⏳ CODE WIRD GEPRÜFT..." : "🔓 MISSION FREISCHALTEN"}
              </button>

              {accessError ? <div style={styles.accessErrorBox}>{accessError}</div> : null}
            </div>

            {page.mapHint ? (
              <MapHint
                lat={page.mapHint.lat}
                lng={page.mapHint.lng}
                radius={page.mapHint.radius}
                title={page.mapHint.title}
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
                  <div style={styles.startLocationTitle}>VOR DER MISSION</div>

                  <div style={styles.startLocationText}>
                    📍 Kirche in Kappel-Grafenhausen (Kappel)
                  </div>

                  <div style={styles.startLocationAddress}>
                    Rathausstraße 52, 77966
                  </div>

                  <div style={styles.startLocationHint}>
                    Begebt euch zuerst zu diesem Ort.
                    <br />
                    Sobald ihr dort angekommen seid, tippt auf:
                  </div>

                  <button
                    style={styles.primaryButton}
                    onClick={() => setArrivedAtStart(true)}
                  >
                    📍 Wir sind am Startpunkt
                  </button>
                </div>

                <a
                  href={START_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.startLocationLinkSmall}
                >
                  Startpunkt nicht gefunden? Route in Google Maps öffnen
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
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>

                <div style={styles.mostWantedCard}>
                  <img
                    src="/wanted.jpg"
                    alt="Meister der Krümel Most Wanted"
                    style={styles.mostWantedImage}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
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
                  ➜ STARTET JETZT EURE MISSION!
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
                    e.currentTarget.style.display = "none";
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
                      e.currentTarget.style.display = "none";
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
                        onClick={() => openZoom(page.planImage, "Fluchtplan")}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div style={styles.zoomHint}>Zum Vergrößern antippen</div>
                  </div>
                ) : null}

                {shouldShowTaskCard ? (
                  <div style={styles.taskCard}>
                    <div style={styles.taskTitle}>{page.taskTitle}</div>
                    <TextLines text={page.taskText} style={styles.taskText} />
                    {page.mapHint && !effectiveSolved && page.id !== "station4" ? (
                      <>
                        <button
                          style={styles.secondaryButton}
                          onClick={() => setShowTaskMap((prev) => !prev)}
                        >
                          {showTaskMap
                            ? "Orientierungshilfe ausblenden"
                            : "🧭 Orientierungshilfe anzeigen"}
                        </button>

                        {showTaskMap ? (
                          <MapHint
                            lat={page.mapHint.lat}
                            lng={page.mapHint.lng}
                            radius={page.mapHint.radius}
                            title={page.mapHint.title}
                          />
                        ) : null}
                      </>
                    ) : null}

                    {isChoiceTask ? (
                      !effectiveSolved ? (
                        page.id === "station4" ? (
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

                            <div style={styles.optionalHelpWrap}>
                              {hintLevel === 0 ? (
                                <>
                                  <div style={styles.subtleHintIntro}>
                                    Nur anklicken, wenn ihr wirklich nicht weiterkommt:
                                  </div>
                                  <button
                                    style={styles.secondaryButton}
                                    onClick={() => setHintLevel(1)}
                                  >
                                    👀 Wir brauchen Hilfe beim Fluchtplan
                                  </button>
                                </>
                              ) : null}

                              {hintLevel >= 1 ? (
                                <HintCard
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
                                  👀 Noch ein Tipp zum Fluchtplan
                                </button>
                              ) : null}

                              {hintLevel >= 2 ? (
                                <HintCard
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
                                  {showTaskMap
                                    ? "Orientierungshilfe ausblenden"
                                    : "🧭 Orientierungshilfe anzeigen"}
                                </button>

                                {showTaskMap ? (
                                  <MapHint
                                    lat={page.mapHint.lat}
                                    lng={page.mapHint.lng}
                                    radius={page.mapHint.radius}
                                    title={page.mapHint.title}
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
                          📷 Das Foto bleibt nur auf eurem Gerät. Die App zeigt es nur als Vorschau.
                          <br />
                          Tipp: Nach dem Foto könnt ihr es zusätzlich speichern/herunterladen.
                        </div>

                        {!effectiveSolved ? (
                          <>
                            <label style={styles.uploadButton}>
                              📸 Teamfoto aufnehmen oder auswählen
                          <input
  type="file"
  accept="image/*"
  capture="user"
  style={styles.hiddenFileInput}
  onChange={handlePhotoChange}
/>

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
                                  💾 Foto auf Gerät speichern
                                </a>

                                <button style={styles.secondaryButton} onClick={removePhoto}>
                                  Foto nochmal machen
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
                                  💾 Foto auf Gerät speichern
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
                            Antwort prüfen
                          </button>
                        ) : null}

                        {answerError && !effectiveSolved ? (
                          <div style={styles.inlineErrorBox}>
                            Hmm… das scheint noch nicht ganz zu stimmen.
                          </div>
                        ) : null}

                        {answerError && !effectiveSolved && hintLevel === 0 ? (
                          <button
                            style={styles.secondaryButton}
                            onClick={() => setHintLevel(1)}
                          >
                            👀 Ein kleiner Hinweis
                          </button>
                        ) : null}

                        {hintLevel >= 1 && !effectiveSolved ? (
                          <HintCard
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
                            👀 Noch ein Tipp zum Fluchtplan
                          </button>
                        ) : null}

                        {hintLevel >= 2 && !effectiveSolved ? (
                          <HintCard
                            title={page.hint2Title}
                            text={page.hint2Text}
                            image={page.hint2Image}
                            image2={page.hint2Image2}
                          />
                        ) : null}

                        {hintLevel >= 2 && !effectiveSolved ? (
                          <button style={styles.secondaryButton} onClick={revealSolution}>
                            Lösung anzeigen
                          </button>
                        ) : null}

                        {showSolution ? <div style={styles.solutionBox}>{page.solutionText}</div> : null}
                      </>
                    ) : null}
                  </div>
                ) : null}

                {effectiveSolved && currentResultBox ? (
                  <TextLines text={currentResultBox} style={styles.resultBox} />
                ) : null}

                {effectiveSolved && page.id === "station5" ? (
                  <PlanAssembly
                    part1={page.planPart1}
                    part2={page.planPart2}
                    completeImage={page.planCompleteImage}
                    assembled={planAssembled}
                    onAssemble={() => setPlanAssembled(true)}
                    onZoom={openZoom}
                  />
                ) : null}

                {effectiveSolved &&
                page.nextHintImage &&
                (page.id !== "station5" || planAssembled) ? (
                  <div style={styles.nextHintBox}>
                    <img
                      src="/fussabdruecke.png"
                      alt=""
                      style={styles.footprintsTop}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
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
                            ? () => openZoom(page.nextHintImage, "Geheimer Hinweis")
                            : undefined
                        }
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {page.nextHintZoomable ? (
                        <div style={styles.zoomHint}>Zum Vergrößern antippen</div>
                      ) : null}
                    </div>

                    <TextLines text={page.nextHintText} style={styles.nextHintText} />

                    {page.nextMapHint ? (
                      <>
                        <button
                          style={styles.secondaryButton}
                          onClick={() => setShowNextMap((prev) => !prev)}
                        >
                          {showNextMap
                            ? "Orientierungshilfe ausblenden"
                            : "🧭 Orientierungshilfe anzeigen"}
                        </button>

                        {showNextMap ? (
                          <MapHint
                            lat={page.nextMapHint.lat}
                            lng={page.nextMapHint.lng}
                            radius={page.nextMapHint.radius}
                            title={page.nextMapHint.title}
                          />
                        ) : null}
                      </>
                    ) : null}

                    <img
                      src="/fussabdruecke.png"
                      alt=""
                      style={styles.footprintsBottom}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
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
                      text={"Plötzlich wird es still…\n\nWas war das?"}
                      style={styles.storyBox}
                    />

                    <button
                      style={styles.primaryButton}
                      onClick={() => setFinaleRevealShown(true)}
                    >
                      🔎 Nachsehen
                    </button>
                  </>
                ) : null}

                {finaleRevealShown && !finaleLockShown ? (
                  <>
                    <div style={styles.heroCard}>
                      <div style={styles.heroImageInner}>
                        <img
                          src="/keksdose.png"
                          alt="Keksdose auf dem Weg"
                          style={styles.heroImage}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    </div>

                    <TextLines
                      text={"Da liegt etwas…\n\nEine alte Keksdose.\n\nSie ist verschlossen."}
                      style={styles.storyBox}
                    />

                    <button
                      style={styles.primaryButton}
                      onClick={() => setFinaleLockShown(true)}
                    >
                      🔒 Schloss untersuchen
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
                          setLockLeft((prev) => stepNumber(prev, "down"));
                        }}
                        onDown={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockLeft((prev) => stepNumber(prev, "up"));
                        }}
                      />

                      <LockWheel
                        topValue={`${getItemAbove(lockAnimals, lockAnimalIndex).emoji} ${getItemAbove(lockAnimals, lockAnimalIndex).label}`}
                        value={`${currentAnimal.emoji} ${currentAnimal.label}`}
                        bottomValue={`${getItemBelow(lockAnimals, lockAnimalIndex).emoji} ${getItemBelow(lockAnimals, lockAnimalIndex).label}`}
                        onUp={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockAnimalIndex((prev) => stepList(prev, "down", lockAnimals));
                        }}
                        onDown={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockAnimalIndex((prev) => stepList(prev, "up", lockAnimals));
                        }}
                      />

                      <LockWheel
                        topValue={`${getItemAbove(lockSymbols, lockSymbolIndex).emoji} ${getItemAbove(lockSymbols, lockSymbolIndex).label}`}
                        value={`${currentSymbol.emoji} ${currentSymbol.label}`}
                        bottomValue={`${getItemBelow(lockSymbols, lockSymbolIndex).emoji} ${getItemBelow(lockSymbols, lockSymbolIndex).label}`}
                        onUp={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockSymbolIndex((prev) => stepList(prev, "down", lockSymbols));
                        }}
                        onDown={() => {
                          playSound("/wheel.mp3", 0.25);
                          setLockSymbolIndex((prev) => stepList(prev, "up", lockSymbols));
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
                      {lockOpened ? "🔓 Schloss geöffnet" : "🔒 Schloss öffnen"}
                    </button>

                    {!lockOpened && lockAttempts >= 1 ? (
                      <div style={styles.inlineErrorBox}>
                        Das ist leider nicht ganz richtig. Versucht es noch einmal.
                      </div>
                    ) : null}

                    {!lockOpened && lockAttempts >= 1 && !showLockHint1 ? (
                      <button
                        style={styles.secondaryButton}
                        onClick={() => setShowLockHint1(true)}
                      >
                        👀 Hinweis 1 anzeigen
                      </button>
                    ) : null}

                    {!lockOpened && showLockHint1 ? (
                      <div style={styles.lockHintBox}>
                        <div style={styles.lockHintTitle}>Hinweis 1</div>
                        <div>
                          Erinnert euch:
                          <br />
                          Ihr braucht die erste Zahl, das geheime Tier und das geheime Zeichen.
                          <br />
                          Denkt an die kleinen Helfer, das Tier vom Spielplatz und das Zeichen von Meister der Krümel.
                        </div>
                      </div>
                    ) : null}

                    {!lockOpened && lockAttempts >= 2 && !showLockHint2 ? (
                      <button
                        style={styles.secondaryButton}
                        onClick={() => setShowLockHint2(true)}
                      >
                        👀 Hinweis 2 anzeigen
                      </button>
                    ) : null}

                    {!lockOpened && showLockHint2 ? (
                      <div style={styles.lockHintBox}>
                        <div style={styles.lockHintTitle}>Hinweis 2</div>
                        <div>
                          Die erste Zahl ist die Anzahl der kleinen Helfer.
                          <br />
                          In der Mitte gehört das Tier, das alles beobachtet hat.
                          <br />
                          Rechts gehört das Zeichen, das Meister der Krümel bei der Eierkönigin hinterlassen hat.
                        </div>
                      </div>
                    ) : null}

                    {!lockOpened && lockAttempts >= 3 && !showLockSolution ? (
                      <button
                        style={styles.secondaryButton}
                        onClick={() => setShowLockSolution(true)}
                      >
                        🔐 Lösung anzeigen
                      </button>
                    ) : null}

                    {!lockOpened && showLockSolution ? (
                      <div style={styles.lockSolutionBox}>
                        <div style={styles.lockHintTitle}>Lösung</div>
                        <div>
                          Die richtige Kombination ist:
                          <br />
                          <strong>3 – 🐘 Elefant – ☀️ Sonne</strong>
                        </div>
                      </div>
                    ) : null}

                    {lockOpened ? (
                      <>
                        <TextLines text={page.successBox} style={styles.lockSuccessBox} />

                        <div style={styles.formulaRevealCard}>
                          <div style={styles.formulaRevealTitle}>🍪 DIE GEHEIME KEKSFORMEL</div>
                          <div style={styles.formulaImageWrap}>
                            <img
                              src="/keksformel.png"
                              alt="Die geheime Keksformel"
                              style={styles.formulaImage}
                              onClick={() => openZoom("/keksformel.png", "Die geheime Keksformel")}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                          <div style={styles.zoomHint}>Zum Vergrößern antippen</div>

                          <a href="/keksformel.pdf" download style={styles.downloadButton}>
                            📄 Keksformel herunterladen
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
                  <div style={styles.outroTitle}>Mission abgeschlossen!</div>
                  <TextLines text={page.outroText} style={styles.outroText} />
                </div>

                <div style={styles.outroCard}>
                  <div style={styles.outroCardTitle}>Euer Teamfoto</div>
                  <TextLines text={page.photoText} style={styles.outroSmallText} />

                  <div style={styles.socialButtonGrid}>
                    <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" style={styles.socialButton}>
                      📸 Instagram öffnen
                    </a>
                    <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" style={styles.socialButton}>
                      👍 Facebook öffnen
                    </a>
                  </div>

                  <div style={styles.hashtagBox}>
                    Hashtag zum Kopieren:<br />
                    <strong>#geheimekeksformel</strong>
                  </div>
                </div>

                <div style={styles.outroCard}>
                  <div style={styles.outroCardTitle}>Hat euch die Mission gefallen?</div>
                  <TextLines text={page.reviewText} style={styles.outroSmallText} />

                  <a
                    href="https://g.page/r/DEIN-GOOGLE-BEWERTUNGSLINK/review"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.reviewButton}
                  >
                    ⭐ Bewertung bei Google abgeben
                  </a>
                </div>

                <div style={styles.outroCard}>
                  <div style={styles.outroCardTitle}>Zurück zum Startpunkt</div>
                  <TextLines text={page.returnText} style={styles.outroSmallText} />
                </div>

                <div style={styles.outroRestartCard}>
                  <TextLines text={page.finalText} style={styles.outroRestartText} />
                  <button type="button" style={styles.restartMissionButton} onClick={resetGameForTesting}>
                    🔁 Diese Mission nochmal starten
                  </button>
                </div>
              </div>
            ) : null}

            <div style={styles.navRow}>
              {currentPage < pages.length - 1 &&
              (page.type === "finale"
                ? lockOpened
                : page.id === "station5"
                ? effectiveSolved && planAssembled
                : page.type !== "riddle" || effectiveSolved) ? (
                <button style={styles.primaryButton} onClick={nextPage}>
                  Weiter
                </button>
              ) : null}
            </div>
          </>
        )}
        <div style={styles.footerLinks}>
          <button type="button" onClick={() => openInfo("impressum")} style={styles.footerLink}>
            Impressum
          </button>
          <span> | </span>
          <button type="button" onClick={() => openInfo("datenschutz")} style={styles.footerLink}>
            Datenschutz
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
                  ? "Menü"
                  : activeInfoPage === "impressum"
                  ? "Impressum"
                  : activeInfoPage === "datenschutz"
                  ? "Datenschutz"
                  : activeInfoPage === "faq"
                  ? "FAQ"
                  : "Problem melden"}
              </div>
            </div>

            {activeInfoPage === "menu" ? (
              <div style={styles.infoMenuList}>
                <button style={styles.infoMenuItem} onClick={() => setActiveInfoPage("faq")}>
                  ❓ FAQs
                </button>
                <button style={styles.infoMenuItem} onClick={() => setActiveInfoPage("problem")}>
                  🛠 Problem melden
                </button>
              </div>
            ) : null}

            {activeInfoPage === "impressum" ? (
              <div style={styles.infoContent}>
                <p><strong>Impressum</strong></p>
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
                <p><strong>Datenschutzhinweis</strong></p>
                <p>
                  Diese App speichert den Spielfortschritt lokal auf dem Gerät, damit die Mission
                  bei einem versehentlichen Schließen fortgesetzt werden kann.
                </p>
                <p>
                  Das Teamfoto bleibt auf dem jeweiligen Gerät und wird nicht automatisch an uns übertragen.
                </p>
                <p>Hier kannst du später deine vollständige Datenschutzerklärung einfügen.</p>
              </div>
            ) : null}

            {activeInfoPage === "faq" ? (
              <div style={styles.infoContent}>
                <p><strong>Häufige Fragen</strong></p>
                <p><strong>Was tun, wenn wir nicht weiterkommen?</strong><br />
                Nutzt zuerst die Hinweise in der jeweiligen Station.</p>
                <p><strong>Was passiert mit dem Teamfoto?</strong><br />
                Das Foto bleibt auf eurem Gerät. Die App zeigt es nur als Vorschau.</p>
                <p><strong>Wie lange dauert die Mission?</strong><br />
                Plant ungefähr 60 Minuten ein.</p>
              </div>
            ) : null}

            {activeInfoPage === "problem" ? (
              <div style={styles.infoContent}>
                <p><strong>Problem melden</strong></p>
                <p>
                  Wenn etwas nicht funktioniert, könnt ihr uns hier direkt eine kurze Meldung vorbereiten.
                </p>

                <label style={styles.infoFormLabel}>
                  Station / Seite
                  <input
                    style={styles.infoFormInput}
                    value={problemStation}
                    onChange={(e) => setProblemStation(e.target.value)}
                    placeholder="z. B. Station 5 / Schloss / Startseite"
                  />
                </label>

                <label style={styles.infoFormLabel}>
                  Gerät / Browser
                  <input
                    style={styles.infoFormInput}
                    value={problemDevice}
                    onChange={(e) => setProblemDevice(e.target.value)}
                    placeholder="z. B. iPhone Safari, Android Chrome"
                  />
                </label>

                <label style={styles.infoFormLabel}>
                  Was ist passiert?
                  <textarea
                    style={styles.infoFormTextarea}
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    placeholder="Beschreibt kurz, was nicht funktioniert hat."
                  />
                </label>

                <button
                  type="button"
                  style={styles.problemSendButton}
                  onClick={sendProblemReport}
                >
                  ✉️ Problem per E-Mail melden
                </button>

                <p style={styles.infoSmallNote}>
                  Hinweis: Es öffnet sich euer E-Mail-Programm. Die Nachricht wird erst versendet,
                  wenn ihr sie dort abschickt.
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
    wordBreak: "break-word",
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
    wordBreak: "break-word",
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
