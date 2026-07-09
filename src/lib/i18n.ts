/**
 * Minimal i18n. English strings ARE the keys: `t("Save")` returns the
 * translation for the active language, or the English text itself when no
 * translation exists — so untranslated corners degrade gracefully instead of
 * breaking. Language preference lives in localStorage only.
 *
 * Registry content (trial titles, summaries, criteria) remains in English —
 * translating medical source material automatically would risk meaning; the
 * UI instead sets expectations with a per-language note.
 *
 * Translation status: French reviewed; Spanish drafted and pending native
 * review before being promoted in any launch material.
 */

import { useSyncExternalStore } from "react";

export type Lang = "en" | "fr" | "es";

const STORAGE_KEY = "beacon.lang";

type Dict = Record<string, string>;

const FR: Dict = {
  // Navigation & footer
  "Search": "Recherche",
  "Saved": "Enregistrés",
  "About": "À propos",
  "free clinical trial finder": "outil gratuit de recherche d'essais cliniques",
  "data live from": "données en direct de",
  "not medical advice": "ne constitue pas un avis médical",
  "no tracking, ever": "aucun pistage, jamais",
  "embed Beacon on your site": "intégrez Beacon à votre site",

  // Home hero (two parts: the second is highlighted)
  "Somewhere, a trial is looking": "Quelque part, un essai clinique vous",
  "for you.": "cherche.",
  "Every year, promising treatments stall because trials can't find participants — while patients never hear about studies recruiting nearby. Beacon searches all {n} studies in the official registry and explains them in plain language. Free, for everyone, forever.":
    "Chaque année, des traitements prometteurs stagnent faute de participants — pendant que des patients ignorent tout des études qui recrutent près de chez eux. Beacon interroge les {n} études du registre officiel et les explique en langage clair. Gratuit, pour tous, pour toujours.",

  // Wizard
  "Condition": "Condition",
  "About you": "À propos de vous",
  "Location": "Lieu",
  "What condition are you looking into?": "Quelle condition médicale vous intéresse ?",
  "This can be for yourself or someone you care for. Type a condition, or pick a common one below.":
    "Pour vous-même ou pour un proche. Écrivez une condition (en français ou en anglais), ou choisissez-en une ci-dessous.",
  "e.g. breast cancer, type 2 diabetes, ALS…": "ex. cancer du sein, diabète, sclérose en plaques…",
  "Interventional": "Interventionnel",
  "Observational": "Observationnel",
  "Expanded Access": "Accès élargi",
  "Next": "Suivant",
  "Back": "Retour",
  "A little about the patient": "Quelques mots sur le patient",
  "Optional — this helps us flag trials whose age or sex requirements don't match. Nothing you enter leaves your device except to run the search.":
    "Facultatif — cela nous aide à signaler les essais dont les critères d'âge ou de sexe ne correspondent pas. Rien de ce que vous saisissez ne quitte votre appareil, sauf pour lancer la recherche.",
  "Age": "Âge",
  "Sex assigned at birth": "Sexe assigné à la naissance",
  "Prefer not to say": "Je préfère ne pas répondre",
  "Female": "Femme",
  "Male": "Homme",
  "Where should we look?": "Où devons-nous chercher ?",
  "Trials often require regular visits, so distance matters.":
    "Les essais exigent souvent des visites régulières : la distance compte.",
  "How far could you travel?": "Jusqu'où pourriez-vous vous déplacer ?",
  "Within 25 miles": "Dans un rayon de 40 km",
  "Within 50 miles": "Dans un rayon de 80 km",
  "Within 100 miles": "Dans un rayon de 160 km",
  "Within 250 miles": "Dans un rayon de 400 km",
  "Anywhere in the world": "Partout dans le monde",
  "📍 Use my current location & search": "📍 Utiliser ma position et lancer la recherche",
  "or": "ou",
  "City or postal code, e.g. Montreal": "Ville ou code postal, ex. Montréal",
  "Find": "Trouver",
  "Search everywhere": "Chercher partout",
  "Working…": "Un instant…",
  "We couldn't find that place. Try a city name or postal code.":
    "Nous n'avons pas trouvé cet endroit. Essayez un nom de ville ou un code postal.",
  "Location search failed.": "La recherche de lieu a échoué.",
  "Something went wrong getting your location.": "Un problème est survenu lors de la géolocalisation.",

  // Geolocation errors
  "Location services aren't available in this browser.":
    "La géolocalisation n'est pas offerte dans ce navigateur.",
  "We couldn't get your location. You can type a city or postal code instead.":
    "Impossible d'obtenir votre position. Vous pouvez plutôt saisir une ville ou un code postal.",
  "Location search is unavailable right now. Please try again.":
    "La recherche de lieu est indisponible pour le moment. Veuillez réessayer.",

  // Results
  "Trials for": "Essais pour",
  "within {r} miles of {place}": "à moins de {r} mi de {place}",
  "worldwide": "partout dans le monde",
  "you (as in: near you)": "vous",
  "your location": "votre position",
  "{n} recruiting trials found.": "{n} essais en recrutement trouvés.",
  "{n} recruiting trial found.": "{n} essai en recrutement trouvé.",
  "No recruiting trials found.": "Aucun essai en recrutement trouvé.",
  "Change search": "Modifier la recherche",
  "Also searching related medical terms:": "Recherche élargie aux termes médicaux associés :",
  "doctors often register trials under these names.":
    "les médecins enregistrent souvent les essais sous ces noms.",
  "Trial information from the registry is shown in English.":
    "Les informations des essais issues du registre sont affichées en anglais.",
  "Searching the registry…": "Recherche dans le registre…",
  "Show more trials": "Afficher plus d'essais",
  "Loading…": "Chargement…",
  "No search yet.": "Aucune recherche pour l'instant.",
  "Start a search": "Lancer une recherche",
  "No trials matched — but don't stop here.": "Aucun essai trouvé — mais ne vous arrêtez pas là.",
  "Try a broader search radius, or search anywhere in the world.":
    "Élargissez le rayon de recherche, ou cherchez partout dans le monde.",
  "Try a broader condition name (e.g. “lung cancer” instead of a subtype).":
    "Essayez un nom de condition plus général (ex. « cancer du poumon » plutôt qu'un sous-type).",
  "New trials open every week — check back, and ask your doctor about trials too.":
    "De nouveaux essais ouvrent chaque semaine — revenez régulièrement, et parlez-en aussi à votre médecin.",
  "Tip: save trials that look promising (☆), then open":
    "Astuce : enregistrez les essais prometteurs (☆), puis ouvrez",
  "to print a summary you can bring to your doctor.":
    "pour imprimer un résumé à apporter à votre médecin.",

  // Trial card
  "☆ Save": "☆ Enregistrer",
  "★ Saved": "★ Enregistré",
  "May not match your details — this trial accepts":
    "Pourrait ne pas correspondre à votre profil — cet essai accepte",
  "ages {r}": "{r}",
  "{s} only": "{s} seulement",

  // Statuses
  "Recruiting now": "Recrute actuellement",
  "Opening soon": "Ouvre bientôt",
  "By invitation only": "Sur invitation seulement",
  "Active, not recruiting": "En cours, sans recrutement",
  "Completed": "Terminé",
  "Paused": "Suspendu",
  "Stopped early": "Arrêté prématurément",
  "Withdrawn": "Retiré",
  "Status unknown": "Statut inconnu",

  // Ages & sex
  "All ages": "Tous les âges",
  "{a} and older": "{a} et plus",
  "Up to {a}": "Jusqu'à {a}",
  "{a} to {b}": "{a} à {b}",
  "Men": "Hommes",
  "Women": "Femmes",
  "All sexes": "Tous les sexes",
  "{n} participants": "{n} participants",
  "{n} participant": "{n} participant",

  // Trial detail
  "← Back to results": "← Retour aux résultats",
  "Loading study details…": "Chargement des détails de l'étude…",
  "Run by": "Mené par",
  "started": "commencé en",
  "updated": "mis à jour en",
  "unknown sponsor": "commanditaire inconnu",
  "☆ Save this trial": "☆ Enregistrer cet essai",
  "View official record ↗": "Dossier officiel ↗",
  "What this study is about": "L'objet de cette étude",
  "At a glance": "En bref",
  "Who can join": "Qui peut participer",
  "Conditions": "Conditions",
  "What's being tested": "Ce qui est testé",
  "Study size": "Taille de l'étude",
  "Main results expected": "Résultats principaux attendus",
  "accepts healthy volunteers": "accepte les volontaires en bonne santé",
  "Can I join? Things the study team will check": "Puis-je participer ? Ce que l'équipe vérifiera",
  "Where this trial is running": "Où se déroule cet essai",
  "{n} sites": "{n} sites",
  "{n} site": "{n} site",
  "No site locations are listed yet. Contact the study team below.":
    "Aucun site n'est encore répertorié. Contactez l'équipe de l'étude ci-dessous.",
  "Study site": "Site de l'étude",
  "+ {n} more sites — see the": "+ {n} autres sites — voir le",
  "official record": "dossier officiel",
  "Who to contact": "Qui contacter",
  "It's completely normal to call and ask questions before deciding anything. Mention the study ID:":
    "Il est tout à fait normal d'appeler pour poser des questions avant de prendre une décision. Mentionnez le numéro de l'étude :",
  "Questions to bring to your doctor": "Questions à poser à votre médecin",
  "Copy questions": "Copier les questions",

  // Doctor questions
  "Based on my health history, do you think I might qualify for this trial?":
    "D'après mon dossier médical, pensez-vous que je pourrais être admissible à cet essai ?",
  "How would this trial compare to my current treatment options?":
    "Comment cet essai se compare-t-il à mes options de traitement actuelles ?",
  "What are the possible risks and side effects for someone like me?":
    "Quels sont les risques et effets secondaires possibles pour une personne comme moi ?",
  "How often would I need to visit, and for how long?":
    "À quelle fréquence devrais-je me déplacer, et pendant combien de temps ?",
  "Could I receive a placebo instead of the study treatment, and what happens if I do?":
    "Pourrais-je recevoir un placebo au lieu du traitement à l'étude, et que se passerait-il dans ce cas ?",
  "This is an early-phase trial focused on safety — what is known about this treatment so far?":
    "Il s'agit d'un essai de phase précoce axé sur la sécurité — que sait-on de ce traitement jusqu'à maintenant ?",
  "Would I need to stop any of my current medicines before joining, and is that safe for me?":
    "Devrais-je arrêter certains de mes médicaments actuels avant de participer, et est-ce sécuritaire pour moi ?",
  "If the treatment helps me, can I keep receiving it after the trial ends?":
    "Si le traitement m'aide, pourrai-je continuer à le recevoir après la fin de l'essai ?",
  "What costs, if any, would I or my insurance be responsible for?":
    "Quels coûts, le cas échéant, seraient à ma charge ou à celle de mon assurance ?",

  // Eligibility self-check
  "You may be able to join if…": "Vous pourriez être admissible si…",
  "You may not be able to join if…": "Vous pourriez ne pas être admissible si…",
  "Criteria": "Critères",
  "Go through each point and mark what's true for you — it turns a wall of medical text into a focused conversation. Only the study team can confirm whether you qualify.":
    "Parcourez chaque point et indiquez ce qui est vrai pour vous — un mur de texte médical devient une conversation ciblée. Seule l'équipe de l'étude peut confirmer votre admissibilité.",
  "This study lists its criteria in its own format — read through it and discuss anything unclear with the study team:":
    "Cette étude présente ses critères dans son propre format — lisez-les et discutez de tout point flou avec l'équipe de l'étude :",
  "True for me": "Vrai pour moi",
  "Not true for me": "Pas vrai pour moi",
  "Not sure": "Incertain",
  "{done} of {total} points reviewed": "{done} points sur {total} passés en revue",
  '{n} marked "not sure" — those are exactly the questions to bring to the study team':
    "{n} marqués « incertain » — ce sont exactement les questions à poser à l'équipe de l'étude",
  "{n} exclusion points may apply to you — worth asking about; some exclusions have exceptions":
    "{n} critères d'exclusion pourraient s'appliquer à vous — cela vaut la peine d'en discuter ; certaines exclusions comportent des exceptions",
  "{n} exclusion point may apply to you — worth asking about; some exclusions have exceptions":
    "{n} critère d'exclusion pourrait s'appliquer à vous — cela vaut la peine d'en discuter ; certaines exclusions comportent des exceptions",
  "🖨 Print my checklist": "🖨 Imprimer ma liste",
  "Reset marks": "Réinitialiser mes réponses",
  "Dotted-underlined words have plain-language explanations — tap or hover to see them. Your marks are saved only on this device.":
    "Les mots soulignés en pointillé ont une explication en langage clair — touchez-les ou survolez-les. Vos réponses ne sont enregistrées que sur cet appareil.",

  // Saved trials
  "Your saved trials": "Vos essais enregistrés",
  "🖨 Print for your appointment": "🖨 Imprimer pour votre rendez-vous",
  "No saved trials yet": "Aucun essai enregistré pour l'instant",
  "When a trial looks promising, tap ☆ Save. Your list lives only on this device and makes a tidy printout to bring to your next appointment.":
    "Quand un essai semble prometteur, touchez « ☆ Enregistrer ». Votre liste reste uniquement sur cet appareil et s'imprime proprement pour votre prochain rendez-vous.",
  "Stored only on this device. Print this page — it includes each trial's registry ID so your doctor can look them up instantly.":
    "Conservé uniquement sur cet appareil. Imprimez cette page — elle inclut le numéro de registre de chaque essai pour que votre médecin puisse les retrouver instantanément.",
  "View details": "Voir les détails",
  "Remove": "Retirer",

  // Watched searches
  "🔔 Watch this search": "🔔 Surveiller cette recherche",
  "🔔 Watching": "🔔 Recherche surveillée",
  "Searches you're watching": "Recherches que vous surveillez",
  "Beacon re-checks these when you visit — right here in your browser, so nobody else knows what you're watching. New trials open every week.":
    "Beacon les revérifie à chacune de vos visites — directement dans votre navigateur, donc personne d'autre ne sait ce que vous surveillez. De nouveaux essais ouvrent chaque semaine.",
  "{n} new trials": "{n} nouveaux essais",
  "{n} new trial": "{n} nouvel essai",
  "Stop watching": "Ne plus surveiller",

  // Disclaimer & privacy
  "Beacon is an information tool, not medical advice.": "Beacon est un outil d'information, pas un avis médical.",
  "Whether a trial is right for you is a decision for you, your doctor, and the study team. Joining a trial is always voluntary, and you can leave one at any time. Trial details come from the official U.S. registry, ClinicalTrials.gov, and may change — always confirm with the study team.":
    "La décision de participer à un essai vous appartient, à vous, à votre médecin et à l'équipe de l'étude. La participation est toujours volontaire et vous pouvez vous retirer à tout moment. Les détails proviennent du registre officiel américain ClinicalTrials.gov et peuvent changer — confirmez toujours auprès de l'équipe de l'étude.",
  "Your privacy is absolute.": "Votre vie privée est absolue.",
  "Beacon runs entirely in your browser. Your condition, age, and location are sent only to the public registry to run your search — never to us. We have no servers, no accounts, and no tracking.":
    "Beacon fonctionne entièrement dans votre navigateur. Votre condition, votre âge et votre position ne sont transmis qu'au registre public pour effectuer la recherche — jamais à nous. Aucun serveur, aucun compte, aucun pistage.",

  // About page
  "Why Beacon exists": "Pourquoi Beacon existe",
  "Roughly 80% of clinical trials are delayed because they can't recruit enough participants, and fewer than 5% of eligible cancer patients ever join one. That's not a lack of trials or a lack of willing patients — it's a discovery problem. The official registry, ClinicalTrials.gov, is public and complete, but it was built for researchers, not for a person who just got a diagnosis.":
    "Environ 80 % des essais cliniques sont retardés faute de participants, et moins de 5 % des patients atteints de cancer admissibles y participent un jour. Ce n'est ni un manque d'essais ni un manque de patients volontaires — c'est un problème de découverte. Le registre officiel, ClinicalTrials.gov, est public et complet, mais il a été conçu pour les chercheurs, pas pour une personne qui vient de recevoir un diagnostic.",
  "Beacon is the missing translation layer: the same official data, reshaped around the questions patients actually have. Is there a trial for my condition near me? Could I qualify? What would it involve? Who do I call?":
    "Beacon est la couche de traduction qui manquait : les mêmes données officielles, réorganisées autour des questions que les patients se posent vraiment. Y a-t-il un essai pour ma condition près de chez moi ? Pourrais-je être admissible ? Qu'est-ce que cela impliquerait ? Qui dois-je appeler ?",
  "Every patient matched is a trial accelerated — and every trial accelerated is a treatment that arrives sooner for everyone.":
    "Chaque patient jumelé à un essai, c'est un essai accéléré — et chaque essai accéléré, c'est un traitement qui arrive plus tôt pour tout le monde.",
  "Our promises": "Nos engagements",
  "Free for patients, forever.": "Gratuit pour les patients, pour toujours.",
  "No accounts, no paywalls.": "Pas de compte, pas de barrière payante.",
  "Beacon has no servers. Your searches go directly from your browser to the public registry and nowhere else.":
    "Beacon n'a aucun serveur. Vos recherches vont directement de votre navigateur au registre public, et nulle part ailleurs.",
  "No editorializing.": "Aucun parti pris.",
  "We translate jargon; we never hype a treatment or hide a risk. Every trial links to its official record.":
    "Nous traduisons le jargon ; nous ne vantons jamais un traitement et ne cachons jamais un risque. Chaque essai renvoie à son dossier officiel.",
  "Your doctor stays in charge.": "Votre médecin garde la main.",
  "Beacon prepares you for a conversation — it never replaces one.":
    "Beacon vous prépare à une conversation — il ne la remplace jamais.",
  "Data source": "Source des données",
  "All trial data comes live from ClinicalTrials.gov, the registry run by the U.S. National Library of Medicine, covering studies in more than 200 countries. Location search is powered by OpenStreetMap Nominatim.":
    "Toutes les données des essais proviennent en direct de ClinicalTrials.gov, le registre géré par la National Library of Medicine des États-Unis, qui couvre des études dans plus de 200 pays. La recherche de lieux est assurée par OpenStreetMap Nominatim.",

  // Canadian positioning
  "🍁 Made in Canada · English & French · includes trials on both sides of the border":
    "🍁 Fait au Canada · français et anglais · inclut les essais des deux côtés de la frontière",
  "Beacon is built in Canada, in both official languages. Trials don't stop at the border — searches near you include sites on both sides, because the closest option for a Canadian patient is sometimes across it.":
    "Beacon est conçu au Canada, dans les deux langues officielles. Les essais ne s'arrêtent pas à la frontière — les recherches près de chez vous incluent les sites des deux côtés, parce que l'option la plus proche pour un patient canadien se trouve parfois de l'autre côté.",
  "Because Beacon collects zero personal data, it is compliant by design with Quebec's Law 25 and PIPEDA — there is nothing for your privacy officer to assess.":
    "Parce que Beacon ne collecte aucune donnée personnelle, il est conforme dès la conception à la Loi 25 du Québec et à la LPRPDE — votre responsable de la protection des renseignements personnels n'a rien à évaluer.",

  // Partners page
  "Put a trial finder on your site — free, in one minute":
    "Ajoutez un outil de recherche d'essais à votre site — gratuit, en une minute",
  "If you run a patient advocacy organization, clinic, or health community, you can embed Beacon's live trial list for your condition. It updates itself from ClinicalTrials.gov, costs nothing, and — because it collects zero data about your visitors (no cookies, no accounts, no analytics) — there's nothing for your privacy or legal team to review.":
    "Si vous gérez une association de patients, une clinique ou une communauté en santé, vous pouvez intégrer la liste d'essais en direct de Beacon pour votre condition. Elle se met à jour d'elle-même depuis ClinicalTrials.gov, ne coûte rien, et — parce qu'elle ne collecte aucune donnée sur vos visiteurs (pas de témoins, pas de comptes, pas d'analytique) — votre équipe juridique n'a rien à examiner.",
  "Condition to feature": "Condition à mettre en avant",
  "Copy this into your page's HTML where the widget should appear:":
    "Copiez ceci dans le code HTML de votre page, là où le widget doit apparaître :",
  "Copy snippet": "Copier le code",
  "✓ Copied": "✓ Copié",
  "Live preview:": "Aperçu en direct :",
};

const ES: Dict = {
  // Navigation & footer
  "Search": "Buscar",
  "Saved": "Guardados",
  "About": "Acerca de",
  "free clinical trial finder": "buscador gratuito de ensayos clínicos",
  "data live from": "datos en vivo de",
  "not medical advice": "no es consejo médico",
  "no tracking, ever": "sin rastreo, nunca",
  "embed Beacon on your site": "integre Beacon en su sitio",

  // Home hero (two parts: the second is highlighted)
  "Somewhere, a trial is looking": "En algún lugar, un ensayo clínico",
  "for you.": "lo busca.",
  "Every year, promising treatments stall because trials can't find participants — while patients never hear about studies recruiting nearby. Beacon searches all {n} studies in the official registry and explains them in plain language. Free, for everyone, forever.":
    "Cada año, tratamientos prometedores se estancan porque los ensayos no encuentran participantes — mientras los pacientes nunca se enteran de los estudios que reclutan cerca. Beacon busca en los {n} estudios del registro oficial y los explica en lenguaje sencillo. Gratis, para todos, para siempre.",

  // Wizard
  "Condition": "Condición",
  "About you": "Sobre usted",
  "Location": "Ubicación",
  "What condition are you looking into?": "¿Qué condición médica le interesa?",
  "This can be for yourself or someone you care for. Type a condition, or pick a common one below.":
    "Puede ser para usted o para un ser querido. Escriba una condición (en español o en inglés) o elija una común abajo.",
  "e.g. breast cancer, type 2 diabetes, ALS…": "p. ej. cáncer de mama, diabetes, esclerosis múltiple…",
  "Interventional": "Intervencional",
  "Observational": "Observacional",
  "Expanded Access": "Acceso expandido",
  "Next": "Siguiente",
  "Back": "Atrás",
  "A little about the patient": "Un poco sobre el paciente",
  "Optional — this helps us flag trials whose age or sex requirements don't match. Nothing you enter leaves your device except to run the search.":
    "Opcional — nos ayuda a señalar los ensayos cuyos requisitos de edad o sexo no coinciden. Nada de lo que escriba sale de su dispositivo, salvo para ejecutar la búsqueda.",
  "Age": "Edad",
  "Sex assigned at birth": "Sexo asignado al nacer",
  "Prefer not to say": "Prefiero no decirlo",
  "Female": "Femenino",
  "Male": "Masculino",
  "Where should we look?": "¿Dónde debemos buscar?",
  "Trials often require regular visits, so distance matters.":
    "Los ensayos suelen requerir visitas regulares, así que la distancia importa.",
  "How far could you travel?": "¿Hasta dónde podría viajar?",
  "Within 25 miles": "Hasta 40 km",
  "Within 50 miles": "Hasta 80 km",
  "Within 100 miles": "Hasta 160 km",
  "Within 250 miles": "Hasta 400 km",
  "Anywhere in the world": "En cualquier parte del mundo",
  "📍 Use my current location & search": "📍 Usar mi ubicación y buscar",
  "or": "o",
  "City or postal code, e.g. Montreal": "Ciudad o código postal, p. ej. Miami",
  "Find": "Buscar",
  "Search everywhere": "Buscar en todas partes",
  "Working…": "Un momento…",
  "We couldn't find that place. Try a city name or postal code.":
    "No encontramos ese lugar. Pruebe con el nombre de una ciudad o un código postal.",
  "Location search failed.": "La búsqueda de ubicación falló.",
  "Something went wrong getting your location.": "Ocurrió un problema al obtener su ubicación.",

  // Geolocation errors
  "Location services aren't available in this browser.":
    "La geolocalización no está disponible en este navegador.",
  "We couldn't get your location. You can type a city or postal code instead.":
    "No pudimos obtener su ubicación. Puede escribir una ciudad o un código postal.",
  "Location search is unavailable right now. Please try again.":
    "La búsqueda de ubicación no está disponible en este momento. Inténtelo de nuevo.",

  // Results
  "Trials for": "Ensayos para",
  "within {r} miles of {place}": "a menos de {r} mi de {place}",
  "worldwide": "en todo el mundo",
  "you (as in: near you)": "usted",
  "your location": "su ubicación",
  "{n} recruiting trials found.": "{n} ensayos en reclutamiento encontrados.",
  "{n} recruiting trial found.": "{n} ensayo en reclutamiento encontrado.",
  "No recruiting trials found.": "No se encontraron ensayos en reclutamiento.",
  "Change search": "Cambiar la búsqueda",
  "Also searching related medical terms:": "También se buscan términos médicos relacionados:",
  "doctors often register trials under these names.":
    "los médicos suelen registrar los ensayos con estos nombres.",
  "Trial information from the registry is shown in English.":
    "La información de los ensayos del registro se muestra en inglés.",
  "Searching the registry…": "Buscando en el registro…",
  "Show more trials": "Mostrar más ensayos",
  "Loading…": "Cargando…",
  "No search yet.": "Aún no hay ninguna búsqueda.",
  "Start a search": "Iniciar una búsqueda",
  "No trials matched — but don't stop here.": "Ningún ensayo coincidió — pero no se detenga aquí.",
  "Try a broader search radius, or search anywhere in the world.":
    "Amplíe el radio de búsqueda, o busque en cualquier parte del mundo.",
  "Try a broader condition name (e.g. “lung cancer” instead of a subtype).":
    "Pruebe un nombre de condición más general (p. ej. «cáncer de pulmón» en lugar de un subtipo).",
  "New trials open every week — check back, and ask your doctor about trials too.":
    "Cada semana se abren nuevos ensayos — vuelva a consultar, y pregunte también a su médico.",
  "Tip: save trials that look promising (☆), then open":
    "Consejo: guarde los ensayos prometedores (☆) y luego abra",
  "to print a summary you can bring to your doctor.":
    "para imprimir un resumen que puede llevar a su médico.",

  // Trial card
  "☆ Save": "☆ Guardar",
  "★ Saved": "★ Guardado",
  "May not match your details — this trial accepts":
    "Podría no coincidir con su perfil — este ensayo acepta",
  "ages {r}": "edades {r}",
  "{s} only": "solo {s}",

  // Statuses
  "Recruiting now": "Reclutando ahora",
  "Opening soon": "Abre pronto",
  "By invitation only": "Solo por invitación",
  "Active, not recruiting": "Activo, sin reclutar",
  "Completed": "Completado",
  "Paused": "En pausa",
  "Stopped early": "Detenido antes de tiempo",
  "Withdrawn": "Retirado",
  "Status unknown": "Estado desconocido",

  // Ages & sex
  "All ages": "Todas las edades",
  "{a} and older": "{a} o más",
  "Up to {a}": "Hasta {a}",
  "{a} to {b}": "{a} a {b}",
  "Men": "Hombres",
  "Women": "Mujeres",
  "All sexes": "Todos los sexos",
  "{n} participants": "{n} participantes",
  "{n} participant": "{n} participante",

  // Trial detail
  "← Back to results": "← Volver a los resultados",
  "Loading study details…": "Cargando los detalles del estudio…",
  "Run by": "Dirigido por",
  "started": "iniciado en",
  "updated": "actualizado en",
  "unknown sponsor": "patrocinador desconocido",
  "☆ Save this trial": "☆ Guardar este ensayo",
  "View official record ↗": "Registro oficial ↗",
  "What this study is about": "De qué trata este estudio",
  "At a glance": "De un vistazo",
  "Who can join": "Quién puede participar",
  "Conditions": "Condiciones",
  "What's being tested": "Qué se está probando",
  "Study size": "Tamaño del estudio",
  "Main results expected": "Resultados principales esperados",
  "accepts healthy volunteers": "acepta voluntarios sanos",
  "Can I join? Things the study team will check": "¿Puedo participar? Lo que revisará el equipo del estudio",
  "Where this trial is running": "Dónde se realiza este ensayo",
  "{n} sites": "{n} centros",
  "{n} site": "{n} centro",
  "No site locations are listed yet. Contact the study team below.":
    "Aún no hay centros registrados. Contacte al equipo del estudio más abajo.",
  "Study site": "Centro del estudio",
  "+ {n} more sites — see the": "+ {n} centros más — consulte el",
  "official record": "registro oficial",
  "Who to contact": "A quién contactar",
  "It's completely normal to call and ask questions before deciding anything. Mention the study ID:":
    "Es completamente normal llamar y hacer preguntas antes de decidir nada. Mencione el número del estudio:",
  "Questions to bring to your doctor": "Preguntas para llevar a su médico",
  "Copy questions": "Copiar las preguntas",

  // Doctor questions
  "Based on my health history, do you think I might qualify for this trial?":
    "Según mi historial médico, ¿cree que podría calificar para este ensayo?",
  "How would this trial compare to my current treatment options?":
    "¿Cómo se compara este ensayo con mis opciones de tratamiento actuales?",
  "What are the possible risks and side effects for someone like me?":
    "¿Cuáles son los posibles riesgos y efectos secundarios para alguien como yo?",
  "How often would I need to visit, and for how long?":
    "¿Con qué frecuencia tendría que acudir, y durante cuánto tiempo?",
  "Could I receive a placebo instead of the study treatment, and what happens if I do?":
    "¿Podría recibir un placebo en lugar del tratamiento del estudio, y qué pasaría en ese caso?",
  "This is an early-phase trial focused on safety — what is known about this treatment so far?":
    "Este es un ensayo de fase temprana centrado en la seguridad — ¿qué se sabe de este tratamiento hasta ahora?",
  "Would I need to stop any of my current medicines before joining, and is that safe for me?":
    "¿Tendría que dejar alguno de mis medicamentos actuales antes de participar, y es eso seguro para mí?",
  "If the treatment helps me, can I keep receiving it after the trial ends?":
    "Si el tratamiento me ayuda, ¿puedo seguir recibiéndolo cuando termine el ensayo?",
  "What costs, if any, would I or my insurance be responsible for?":
    "¿Qué costos, si los hay, tendríamos que cubrir mi seguro o yo?",

  // Eligibility self-check
  "You may be able to join if…": "Podría participar si…",
  "You may not be able to join if…": "Podría no poder participar si…",
  "Criteria": "Criterios",
  "Go through each point and mark what's true for you — it turns a wall of medical text into a focused conversation. Only the study team can confirm whether you qualify.":
    "Revise cada punto y marque lo que es cierto en su caso — un muro de texto médico se convierte en una conversación enfocada. Solo el equipo del estudio puede confirmar si usted califica.",
  "This study lists its criteria in its own format — read through it and discuss anything unclear with the study team:":
    "Este estudio presenta sus criterios en su propio formato — léalos y consulte cualquier duda con el equipo del estudio:",
  "True for me": "Cierto en mi caso",
  "Not true for me": "No aplica en mi caso",
  "Not sure": "No estoy seguro",
  "{done} of {total} points reviewed": "{done} de {total} puntos revisados",
  '{n} marked "not sure" — those are exactly the questions to bring to the study team':
    "{n} marcados como «no estoy seguro» — esas son exactamente las preguntas para el equipo del estudio",
  "{n} exclusion points may apply to you — worth asking about; some exclusions have exceptions":
    "{n} criterios de exclusión podrían aplicarse a usted — vale la pena preguntar; algunas exclusiones tienen excepciones",
  "{n} exclusion point may apply to you — worth asking about; some exclusions have exceptions":
    "{n} criterio de exclusión podría aplicarse a usted — vale la pena preguntar; algunas exclusiones tienen excepciones",
  "🖨 Print my checklist": "🖨 Imprimir mi lista",
  "Reset marks": "Restablecer mis respuestas",
  "Dotted-underlined words have plain-language explanations — tap or hover to see them. Your marks are saved only on this device.":
    "Las palabras con subrayado punteado tienen explicaciones en lenguaje sencillo — tóquelas o pase el cursor para verlas. Sus respuestas se guardan solo en este dispositivo.",

  // Saved trials
  "Your saved trials": "Sus ensayos guardados",
  "🖨 Print for your appointment": "🖨 Imprimir para su cita",
  "No saved trials yet": "Aún no hay ensayos guardados",
  "When a trial looks promising, tap ☆ Save. Your list lives only on this device and makes a tidy printout to bring to your next appointment.":
    "Cuando un ensayo parezca prometedor, toque «☆ Guardar». Su lista permanece solo en este dispositivo y se imprime de forma ordenada para su próxima cita.",
  "Stored only on this device. Print this page — it includes each trial's registry ID so your doctor can look them up instantly.":
    "Se guarda solo en este dispositivo. Imprima esta página — incluye el número de registro de cada ensayo para que su médico pueda consultarlos al instante.",
  "View details": "Ver detalles",
  "Remove": "Quitar",

  // Watched searches
  "🔔 Watch this search": "🔔 Vigilar esta búsqueda",
  "🔔 Watching": "🔔 Búsqueda vigilada",
  "Searches you're watching": "Búsquedas que está vigilando",
  "Beacon re-checks these when you visit — right here in your browser, so nobody else knows what you're watching. New trials open every week.":
    "Beacon las vuelve a revisar en cada visita — directamente en su navegador, así que nadie más sabe qué está vigilando. Cada semana se abren nuevos ensayos.",
  "{n} new trials": "{n} ensayos nuevos",
  "{n} new trial": "{n} ensayo nuevo",
  "Stop watching": "Dejar de vigilar",

  // Disclaimer & privacy
  "Beacon is an information tool, not medical advice.": "Beacon es una herramienta informativa, no consejo médico.",
  "Whether a trial is right for you is a decision for you, your doctor, and the study team. Joining a trial is always voluntary, and you can leave one at any time. Trial details come from the official U.S. registry, ClinicalTrials.gov, and may change — always confirm with the study team.":
    "La decisión de participar en un ensayo les corresponde a usted, a su médico y al equipo del estudio. La participación siempre es voluntaria y puede retirarse en cualquier momento. Los detalles provienen del registro oficial de EE. UU., ClinicalTrials.gov, y pueden cambiar — confírmelos siempre con el equipo del estudio.",
  "Your privacy is absolute.": "Su privacidad es absoluta.",
  "Beacon runs entirely in your browser. Your condition, age, and location are sent only to the public registry to run your search — never to us. We have no servers, no accounts, and no tracking.":
    "Beacon funciona completamente en su navegador. Su condición, edad y ubicación se envían solo al registro público para ejecutar la búsqueda — nunca a nosotros. Sin servidores, sin cuentas, sin rastreo.",

  // About page
  "Why Beacon exists": "Por qué existe Beacon",
  "Roughly 80% of clinical trials are delayed because they can't recruit enough participants, and fewer than 5% of eligible cancer patients ever join one. That's not a lack of trials or a lack of willing patients — it's a discovery problem. The official registry, ClinicalTrials.gov, is public and complete, but it was built for researchers, not for a person who just got a diagnosis.":
    "Alrededor del 80 % de los ensayos clínicos se retrasan porque no logran reclutar suficientes participantes, y menos del 5 % de los pacientes con cáncer elegibles llegan a participar en uno. No faltan ensayos ni pacientes dispuestos — es un problema de descubrimiento. El registro oficial, ClinicalTrials.gov, es público y completo, pero fue construido para investigadores, no para una persona que acaba de recibir un diagnóstico.",
  "Beacon is the missing translation layer: the same official data, reshaped around the questions patients actually have. Is there a trial for my condition near me? Could I qualify? What would it involve? Who do I call?":
    "Beacon es la capa de traducción que faltaba: los mismos datos oficiales, reorganizados en torno a las preguntas que los pacientes realmente tienen. ¿Hay un ensayo para mi condición cerca de mí? ¿Podría calificar? ¿Qué implicaría? ¿A quién llamo?",
  "Every patient matched is a trial accelerated — and every trial accelerated is a treatment that arrives sooner for everyone.":
    "Cada paciente conectado con un ensayo es un ensayo acelerado — y cada ensayo acelerado es un tratamiento que llega antes para todos.",
  "Our promises": "Nuestras promesas",
  "Free for patients, forever.": "Gratis para los pacientes, para siempre.",
  "No accounts, no paywalls.": "Sin cuentas, sin muros de pago.",
  "Beacon has no servers. Your searches go directly from your browser to the public registry and nowhere else.":
    "Beacon no tiene servidores. Sus búsquedas van directamente de su navegador al registro público y a ningún otro lugar.",
  "No editorializing.": "Sin sesgos.",
  "We translate jargon; we never hype a treatment or hide a risk. Every trial links to its official record.":
    "Traducimos la jerga; nunca exageramos un tratamiento ni ocultamos un riesgo. Cada ensayo enlaza a su registro oficial.",
  "Your doctor stays in charge.": "Su médico sigue al mando.",
  "Beacon prepares you for a conversation — it never replaces one.":
    "Beacon lo prepara para una conversación — nunca la reemplaza.",
  "Data source": "Fuente de los datos",
  "All trial data comes live from ClinicalTrials.gov, the registry run by the U.S. National Library of Medicine, covering studies in more than 200 countries. Location search is powered by OpenStreetMap Nominatim.":
    "Todos los datos de los ensayos provienen en vivo de ClinicalTrials.gov, el registro administrado por la Biblioteca Nacional de Medicina de EE. UU., que cubre estudios en más de 200 países. La búsqueda de ubicaciones funciona con OpenStreetMap Nominatim.",

  // Canadian positioning
  "🍁 Made in Canada · English & French · includes trials on both sides of the border":
    "🍁 Hecho en Canadá · inglés y francés · incluye ensayos a ambos lados de la frontera",
  "Beacon is built in Canada, in both official languages. Trials don't stop at the border — searches near you include sites on both sides, because the closest option for a Canadian patient is sometimes across it.":
    "Beacon está hecho en Canadá, en los dos idiomas oficiales. Los ensayos no se detienen en la frontera — las búsquedas cercanas incluyen centros de ambos lados, porque la opción más cercana para un paciente canadiense a veces está al otro lado.",
  "Because Beacon collects zero personal data, it is compliant by design with Quebec's Law 25 and PIPEDA — there is nothing for your privacy officer to assess.":
    "Como Beacon no recopila ningún dato personal, cumple desde el diseño con la Ley 25 de Quebec y con PIPEDA — su responsable de privacidad no tiene nada que evaluar.",

  // Partners page
  "Put a trial finder on your site — free, in one minute":
    "Ponga un buscador de ensayos en su sitio — gratis, en un minuto",
  "If you run a patient advocacy organization, clinic, or health community, you can embed Beacon's live trial list for your condition. It updates itself from ClinicalTrials.gov, costs nothing, and — because it collects zero data about your visitors (no cookies, no accounts, no analytics) — there's nothing for your privacy or legal team to review.":
    "Si dirige una organización de pacientes, una clínica o una comunidad de salud, puede integrar la lista de ensayos en vivo de Beacon para su condición. Se actualiza sola desde ClinicalTrials.gov, no cuesta nada y — como no recopila ningún dato de sus visitantes (sin cookies, sin cuentas, sin analítica) — su equipo legal no tiene nada que revisar.",
  "Condition to feature": "Condición a destacar",
  "Copy this into your page's HTML where the widget should appear:":
    "Copie esto en el HTML de su página, donde deba aparecer el widget:",
  "Copy snippet": "Copiar el código",
  "✓ Copied": "✓ Copiado",
  "Live preview:": "Vista previa en vivo:",
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

/** Pick singular/plural key by count, then translate with {n} substituted. */
export function tn(n: number, singular: string, plural: string, vars?: Record<string, string | number>): string {
  return t(n === 1 ? singular : plural, { n: n.toLocaleString(), ...vars });
}
