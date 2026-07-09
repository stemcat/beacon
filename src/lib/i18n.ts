/**
 * Minimal i18n. English strings ARE the keys: `t("Save")` returns the
 * translation for the active language, or the English text itself when no
 * translation exists — so untranslated corners degrade gracefully instead of
 * breaking. Language preference lives in localStorage only.
 *
 * Registry content (trial titles, summaries, criteria) remains in English —
 * translating medical source material automatically would risk meaning; the
 * UI instead sets expectations with a per-language note.
 */

import { useSyncExternalStore } from "react";

export type Lang = "en" | "fr" | "es";

const STORAGE_KEY = "beacon.lang";

type Dict = Record<string, string>;

const FR: Dict = {
  "Search": "Recherche",
  "Saved": "Enregistrés",
  "About": "À propos",
  "Somewhere, a trial is looking": "Quelque part, un essai clinique cherche",
  "for you.": "vous.",
  "Every year, promising treatments stall because trials can't find participants — while patients never hear about studies recruiting nearby. Beacon searches all {n} studies in the official registry and explains them in plain language. Free, for everyone, forever.":
    "Chaque année, des traitements prometteurs stagnent faute de participants — pendant que des patients ignorent tout des études qui recrutent près de chez eux. Beacon interroge les {n} études du registre officiel et les explique en langage clair. Gratuit, pour tous, pour toujours.",
  "Condition": "Condition",
  "About you": "À propos de vous",
  "Location": "Lieu",
  "What condition are you looking into?": "Quelle condition médicale vous intéresse ?",
  "This can be for yourself or someone you care for. Type a condition, or pick a common one below.":
    "Pour vous-même ou pour un proche. Écrivez une condition, ou choisissez-en une ci-dessous.",
  "Next": "Suivant",
  "Back": "Retour",
  "A little about the patient": "Quelques mots sur le patient",
  "Optional — this helps us flag trials whose age or sex requirements don't match. Nothing you enter leaves your device except to run the search.":
    "Facultatif — cela nous aide à signaler les essais dont les critères d'âge ou de sexe ne correspondent pas. Rien ne quitte votre appareil, sauf pour lancer la recherche.",
  "Age": "Âge",
  "Sex assigned at birth": "Sexe assigné à la naissance",
  "Prefer not to say": "Je préfère ne pas répondre",
  "Female": "Femme",
  "Male": "Homme",
  "Where should we look?": "Où chercher ?",
  "Trials often require regular visits, so distance matters.":
    "Les essais exigent souvent des visites régulières : la distance compte.",
  "How far could you travel?": "Jusqu'où pourriez-vous vous déplacer ?",
  "Within 25 miles": "Dans un rayon de 40 km",
  "Within 50 miles": "Dans un rayon de 80 km",
  "Within 100 miles": "Dans un rayon de 160 km",
  "Within 250 miles": "Dans un rayon de 400 km",
  "Anywhere in the world": "Partout dans le monde",
  "📍 Use my current location & search": "📍 Utiliser ma position et chercher",
  "or": "ou",
  "City or postal code, e.g. Montreal": "Ville ou code postal, ex. Montréal",
  "Find": "Trouver",
  "Search everywhere": "Chercher partout",
  "Working…": "Un instant…",
  "Trials for": "Essais pour",
  "Change search": "Modifier la recherche",
  "No recruiting trials found.": "Aucun essai en recrutement trouvé.",
  "Searching the registry…": "Recherche dans le registre…",
  "Show more trials": "Afficher plus d'essais",
  "Loading…": "Chargement…",
  "☆ Save": "☆ Enregistrer",
  "★ Saved": "★ Enregistré",
  "☆ Save this trial": "☆ Enregistrer cet essai",
  "🔔 Watch this search": "🔔 Surveiller cette recherche",
  "🔔 Watching": "🔔 Surveillée",
  "View details": "Voir les détails",
  "Recruiting now": "Recrute actuellement",
  "Opening soon": "Ouverture prochaine",
  "← Back to results": "← Retour aux résultats",
  "View official record ↗": "Dossier officiel ↗",
  "What this study is about": "L'objet de cette étude",
  "At a glance": "En bref",
  "Can I join? Things the study team will check": "Puis-je participer ? Ce que l'équipe vérifiera",
  "Who to contact": "Qui contacter",
  "Questions to bring to your doctor": "Questions à poser à votre médecin",
  "Copy questions": "Copier les questions",
  "True for me": "Vrai pour moi",
  "Not true for me": "Pas vrai pour moi",
  "Not sure": "Incertain",
  "🖨 Print my checklist": "🖨 Imprimer ma liste",
  "Reset marks": "Réinitialiser",
  "Your saved trials": "Vos essais enregistrés",
  "🖨 Print for your appointment": "🖨 Imprimer pour votre rendez-vous",
  "No saved trials yet": "Aucun essai enregistré",
  "Start a search": "Lancer une recherche",
  "Remove": "Retirer",
  "Searches you're watching": "Recherches surveillées",
  "Stop watching": "Ne plus surveiller",
  "Beacon is an information tool, not medical advice.": "Beacon est un outil d'information, pas un avis médical.",
  "Whether a trial is right for you is a decision for you, your doctor, and the study team. Joining a trial is always voluntary, and you can leave one at any time. Trial details come from the official U.S. registry, ClinicalTrials.gov, and may change — always confirm with the study team.":
    "La décision de participer à un essai vous appartient, à vous, à votre médecin et à l'équipe de l'étude. La participation est toujours volontaire et vous pouvez vous retirer à tout moment. Les détails proviennent du registre officiel américain ClinicalTrials.gov et peuvent changer — confirmez toujours auprès de l'équipe.",
  "Your privacy is absolute.": "Votre vie privée est absolue.",
  "Beacon runs entirely in your browser. Your condition, age, and location are sent only to the public registry to run your search — never to us. We have no servers, no accounts, and no tracking.":
    "Beacon fonctionne entièrement dans votre navigateur. Votre condition, votre âge et votre lieu ne sont transmis qu'au registre public pour effectuer la recherche — jamais à nous. Pas de serveurs, pas de comptes, pas de pistage.",
  "Trial information from the registry is shown in English.":
    "Les informations des essais issues du registre sont affichées en anglais.",
};

const ES: Dict = {
  "Search": "Buscar",
  "Saved": "Guardados",
  "About": "Acerca de",
  "Somewhere, a trial is looking": "En algún lugar, un ensayo clínico busca",
  "for you.": "a usted.",
  "Every year, promising treatments stall because trials can't find participants — while patients never hear about studies recruiting nearby. Beacon searches all {n} studies in the official registry and explains them in plain language. Free, for everyone, forever.":
    "Cada año, tratamientos prometedores se estancan porque los ensayos no encuentran participantes — mientras los pacientes nunca se enteran de los estudios que reclutan cerca. Beacon busca en los {n} estudios del registro oficial y los explica en lenguaje sencillo. Gratis, para todos, para siempre.",
  "Condition": "Condición",
  "About you": "Sobre usted",
  "Location": "Ubicación",
  "What condition are you looking into?": "¿Qué condición médica le interesa?",
  "This can be for yourself or someone you care for. Type a condition, or pick a common one below.":
    "Puede ser para usted o para un ser querido. Escriba una condición o elija una común abajo.",
  "Next": "Siguiente",
  "Back": "Atrás",
  "A little about the patient": "Un poco sobre el paciente",
  "Optional — this helps us flag trials whose age or sex requirements don't match. Nothing you enter leaves your device except to run the search.":
    "Opcional — nos ayuda a señalar ensayos cuyos requisitos de edad o sexo no coinciden. Nada sale de su dispositivo, salvo para ejecutar la búsqueda.",
  "Age": "Edad",
  "Sex assigned at birth": "Sexo asignado al nacer",
  "Prefer not to say": "Prefiero no decirlo",
  "Female": "Femenino",
  "Male": "Masculino",
  "Where should we look?": "¿Dónde buscamos?",
  "Trials often require regular visits, so distance matters.":
    "Los ensayos suelen requerir visitas regulares: la distancia importa.",
  "How far could you travel?": "¿Qué tan lejos podría viajar?",
  "Within 25 miles": "Hasta 40 km",
  "Within 50 miles": "Hasta 80 km",
  "Within 100 miles": "Hasta 160 km",
  "Within 250 miles": "Hasta 400 km",
  "Anywhere in the world": "En cualquier parte del mundo",
  "📍 Use my current location & search": "📍 Usar mi ubicación y buscar",
  "or": "o",
  "City or postal code, e.g. Montreal": "Ciudad o código postal, ej. Miami",
  "Find": "Buscar",
  "Search everywhere": "Buscar en todas partes",
  "Working…": "Un momento…",
  "Trials for": "Ensayos para",
  "Change search": "Cambiar búsqueda",
  "No recruiting trials found.": "No se encontraron ensayos reclutando.",
  "Searching the registry…": "Buscando en el registro…",
  "Show more trials": "Mostrar más ensayos",
  "Loading…": "Cargando…",
  "☆ Save": "☆ Guardar",
  "★ Saved": "★ Guardado",
  "☆ Save this trial": "☆ Guardar este ensayo",
  "🔔 Watch this search": "🔔 Vigilar esta búsqueda",
  "🔔 Watching": "🔔 Vigilada",
  "View details": "Ver detalles",
  "Recruiting now": "Reclutando ahora",
  "Opening soon": "Abre pronto",
  "← Back to results": "← Volver a los resultados",
  "View official record ↗": "Registro oficial ↗",
  "What this study is about": "De qué trata este estudio",
  "At a glance": "De un vistazo",
  "Can I join? Things the study team will check": "¿Puedo participar? Lo que revisará el equipo",
  "Who to contact": "A quién contactar",
  "Questions to bring to your doctor": "Preguntas para su médico",
  "Copy questions": "Copiar preguntas",
  "True for me": "Cierto para mí",
  "Not true for me": "No aplica a mí",
  "Not sure": "No estoy seguro",
  "🖨 Print my checklist": "🖨 Imprimir mi lista",
  "Reset marks": "Restablecer",
  "Your saved trials": "Sus ensayos guardados",
  "🖨 Print for your appointment": "🖨 Imprimir para su cita",
  "No saved trials yet": "Aún no hay ensayos guardados",
  "Start a search": "Iniciar una búsqueda",
  "Remove": "Quitar",
  "Searches you're watching": "Búsquedas vigiladas",
  "Stop watching": "Dejar de vigilar",
  "Beacon is an information tool, not medical advice.": "Beacon es una herramienta informativa, no un consejo médico.",
  "Whether a trial is right for you is a decision for you, your doctor, and the study team. Joining a trial is always voluntary, and you can leave one at any time. Trial details come from the official U.S. registry, ClinicalTrials.gov, and may change — always confirm with the study team.":
    "La decisión de participar en un ensayo es suya, de su médico y del equipo del estudio. La participación siempre es voluntaria y puede retirarse en cualquier momento. Los datos provienen del registro oficial de EE. UU., ClinicalTrials.gov, y pueden cambiar — confírmelos siempre con el equipo del estudio.",
  "Your privacy is absolute.": "Su privacidad es absoluta.",
  "Beacon runs entirely in your browser. Your condition, age, and location are sent only to the public registry to run your search — never to us. We have no servers, no accounts, and no tracking.":
    "Beacon funciona completamente en su navegador. Su condición, edad y ubicación se envían solo al registro público para ejecutar la búsqueda — nunca a nosotros. Sin servidores, sin cuentas, sin rastreo.",
  "Trial information from the registry is shown in English.":
    "La información de los ensayos del registro se muestra en inglés.",
};

const DICTS: Record<Lang, Dict> = { en: {}, fr: FR, es: ES };

function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in DICTS) return stored;
  } catch { /* storage unavailable */ }
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return nav === "fr" || nav === "es" ? (nav as Lang) : "en";
}

let current: Lang = typeof navigator !== "undefined" ? detectLang() : "en";
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch { /* storage unavailable */ }
  document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}

/** Translate an English string; substitutes {var} placeholders. */
export function t(english: string, vars?: Record<string, string | number>): string {
  let out = DICTS[current][english] ?? english;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
  }
  return out;
}
