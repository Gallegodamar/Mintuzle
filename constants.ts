
import { GameEntry, HieroglyphEntry } from './types';

export const GAME_WORDS_LVL1: GameEntry[] = [
  { text: "HAIZPEA", egoera: "ondo dago" },
  { text: "HALTEROFILIA", egoera: "ondo dago" },
  { text: "HIEROGLIFIKOA", egoera: "ondo dago" },
  { text: "HUSADIOA", egoera: "gaizki dago" },
  { text: "HURKOA", egoera: "ondo dago" },
  { text: "HARPA", egoera: "ondo dago" },
  { text: "HATABALA", egoera: "gaizki dago" },
  { text: "HOZBERA", egoera: "ondo dago" },
  { text: "HOMOPLATOA", egoera: "gaizki dago" },
  { text: "HARMAILA", egoera: "ondo dago" },
  { text: "HELIZEA", egoera: "ondo dago" }
];

export const GAME_WORDS_LVL2: GameEntry[] = [
  { text: "HIERARKIA", egoera: "ondo dago" },
  { text: "HAUTSA", egoera: "ondo dago" },
  { text: "ZIHUR", egoera: "gaizki dago" },
  { text: "HUMOREA", egoera: "ondo dago" },
  { text: "HERESERKIA", egoera: "gaizki dago" },
  { text: "UHINA", egoera: "ondo dago" },
  { text: "HAUTSI", egoera: "ondo dago" },
  { text: "ZEHAR", egoera: "ondo dago" },
  { text: "LEIHOA", egoera: "ondo dago" },
  { text: "HIBERNATU", egoera: "ondo dago" },
  { text: "HESTEA", egoera: "ondo dago" }
];

export const ATSOTITZAK: GameEntry[] = [
  { text: "AZAROA BERO, NEGUA GERO", egoera: "ondo dago" },
  { text: "APIRILAK BELAR, GAUAK NEGAR", egoera: "gaizki dago" },
  { text: "GOIZ GORRI, ARRATS EURI", egoera: "ondo dago" },
  { text: "EGUZKI ARGITAN, HAUTSA IZAN", egoera: "gaizki dago" },
  { text: "ELUR URTE, EZKUR URTE", egoera: "ondo dago" },
  { text: "GOIZEAN OSKORRI, GAUEAN ITURRI", egoera: "ondo dago" },
  { text: "HAIZEA NORA, ZAPIAK HARA", egoera: "ondo dago" },
  { text: "OTSAILEKO EURI, URTEKO ONGARRI", egoera: "ondo dago" },
  { text: "ILARGI BERRIA, SORGINEN HERRIA", egoera: "gaizki dago" },
  { text: "OTEA LORETSU, NEGUA ELURTSU", egoera: "ondo dago" },
  { text: "EKAINA EDER, UDA HALABER", egoera: "ondo dago" }
];

export const HIEROGLYPHS: HieroglyphEntry[] = [
  {
    imageUrl: "ero_00001.png",
    imageText: "Zure anaia da",
    solution: "BITXIA",
    explanation: "(Bi + Chia)"
  },
  {
    imageUrl: "ero_00002.png",
    imageText: "Film horretan agertzen da",
    solution: "APATXE",
    explanation: ""
  }
];

export const UI_STRINGS = {
  title: "Begiluze",
  menuSubtitle: "Aukeratu joko modu bat zure euskara maila neurtzeko.",
  wordsSubtitle: "Sakatu hitzak ondo ala gaizki idatzita dauden jakiteko.",
  proverbsSubtitle: "Sakatu atsotitzak ondo ala gaizki idatzita dauden jakiteko.",
  hieroglyphsSubtitle: "Asmatu eroglifikoaren esanahia.",
  playAgain: "BERRIRO HASI",
  backMenu: "MENURA ITZULI",
  nextLevel: "HURRENGO ZERRENDA",
  nextHiero: "HURRENGO EROGLIFIKOA",
  correctCount: "Ondo:",
  wrongCount: "Gaizki:",
  score: "Puntuazioa",
  modeWords: "Zuzen idatzita",
  modeProverbs: "Atsotitzak",
  modeHieroglyphs: "Eroglifikoak",
  solution: "EMAITZA IKUSI",
  hiddenSolution: "Ezkutuko emaitza:",
  timerPrefix: "Itxaron segundo batzuk: ",
  dictionary: "Hiztegia",
  guessPlaceholder: "Idatzi zure erantzuna...",
  checkButton: "Egiaztatu",
  correctFeedback: "Biba zu! Asmatu duzu!",
  wrongFeedback: "Ez da hori... Saiatu berriro!"
};
