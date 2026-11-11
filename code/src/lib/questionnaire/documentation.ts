/**
 * Génère docs/QUESTIONNAIRE.md depuis la définition et les textes, pour que
 * le document lu par le propriétaire ne puisse pas diverger du code
 * (`npm run doc:questionnaire` ; un test vérifie qu'il est à jour).
 */
import { questionnaire } from "@content/questionnaire";
import { typographie } from "@/lib/typographie";
import { accorder, rendreTexte, type ContexteAccord } from "./accords";
import { EXCEPTIONS_COUVERTURE, couvertureDesDimensions } from "./couverture";
import {
  champsParCle,
  DIMENSIONS_REPLI_COEUR,
  ECRANS,
  MIN_REPONSES_OBSERVATION,
  OBSERVATION,
  PLAFOND_CONFIANCE_DIRIGER,
  QUESTIONS,
  SEUIL_PASSEES_MESSAGE_DOUX,
  VERSION_QUESTIONNAIRE,
} from "./definition";
import { dureeEstimeeSecondes, parcours, PARCOURS_TYPES } from "./parcours";
import { aideDe, contenuDe, contenuOption, titreDe } from "./textes";
import { CLES_TEXTES_LIBRES } from "./textes-libres";
import type {
  Champ,
  Condition,
  CritereMetier,
  Effet,
  EffetOrdreFormations,
  Effets,
  IdChapitre,
  LienPasser,
  Option,
  Question,
  RegleCitation,
  TexteSelonPrenom,
  Variante,
} from "./types";

const GARCON: ContexteAccord = { genre: "il", prenom: "Lucas" };
const FILLE: ContexteAccord = { genre: "elle", prenom: "Anaïs" };
const SANS_PRENOM: ContexteAccord = { genre: "il", prenom: null };

/** Nombre à la française : 0,9 → « 0,90 » (valeur), 1,2 → « 1,2 » (poids). */
const valeur = (n: number) => n.toFixed(2).replace(".", ",");
const poids = (n: number) => String(n).replace(".", ",");

export function formaterDuree(secondes: number): string {
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  return `${minutes} min ${String(reste).padStart(2, "0")} s`;
}

const CRITERES: Record<CritereMetier, string> = {
  independant_possible: "métiers qu'on peut exercer à son compte (`independant_possible`)",
  secteur_public: "métiers du secteur public (`secteur_public`)",
  formation_en_apprentissage: "métiers qui ont au moins une formation reliée en apprentissage",
  formations_toutes_en_apprentissage:
    "métiers dont toutes les formations restantes ne se font qu'en apprentissage (la carte le dit)",
  aucune_formation_un_an_au_plus: "métiers sans formation compatible d'un an ou moins",
  etudes_au_dela_de_3_ans: "métiers qui demandent plus de 3 ans d'études",
  aucune_formation_dans_la_region:
    "métiers sans aucune formation dans la région (la carte dit où est la plus proche)",
};

const ORDRES: Record<EffetOrdreFormations["regle"], string> = {
  apprentissage_d_abord: "formations en apprentissage d'abord",
  hors_apprentissage_d_abord: "formations hors apprentissage d'abord",
  professionnalisantes_d_abord:
    "formations professionnalisantes d'abord (BTS, BUT, DEUST, CS et FCIL, BPJEPS, titres professionnels, apprentissage), avant les licences générales",
  encadrees_d_abord:
    "formations en petits groupes et suivies d'abord (BTS, BUT, DN MADE, diplômes d'État, apprentissage), avant les licences générales",
  bts_d_abord: "BTS avant les licences",
  selectives_apres: "formations très sélectives (taux d'accès Parcoursup < 20 %) après les autres",
  courtes_d_abord: "formations les plus courtes d'abord",
};

function decrireEffet(effet: Effet): string {
  switch (effet.type) {
    case "cible":
      return `\`${effet.dim}\` ${valeur(effet.valeur)} (×${poids(effet.poids)})`;
    case "seuil":
      return `\`${effet.dim}\` ≥ ${valeur(effet.valeur)} (seuil, ×${poids(effet.poids)})`;
    case "plafond":
      return `\`${effet.dim}\` ≤ ${valeur(effet.valeur)} (plafond, ×${poids(effet.poids)})`;
    case "coeur":
      return `dimension de cœur : \`${effet.dim}\``;
    case "filtre_drapeau":
      return `**filtre** : aucun métier avec le drapeau \`${effet.drapeau}\``;
    case "etudes":
      return effet.maxAnnees === null
        ? "aucun plafond d'études"
        : `**filtre** : métiers et formations de ${effet.maxAnnees} ans d'études au plus`;
    case "prive":
      return {
        tout: "toutes les formations, privées comprises",
        public_et_6_types:
          "**filtre** : formations publiques, et privées sous contrat des types BTS, BUT, CPGE, CS et FCIL, DN MADE, diplômes d'État ; un métier sans formation restante n'est pas proposé",
        plus_apprentissage:
          "**filtre** : comme « Non », plus toute formation privée en apprentissage",
        public_d_abord: "toutes les formations, le public d'abord",
      }[effet.regle];
    case "bonus_metier":
      return `bonus (×${poids(effet.poids)}) aux ${CRITERES[effet.critere]}`;
    case "malus_metier":
      return `malus (×${poids(effet.poids)}) aux ${CRITERES[effet.critere]}`;
    case "penalite_moteur":
      return `pénalité « ${effet.penalite === "salaire_debut_bas" ? "salaire de début bas" : "recrute peu"} » multipliée par ${poids(effet.facteur)}`;
    case "ordre_formations":
      return ORDRES[effet.regle];
    case "rayon":
      return {
        departement_et_voisins: "formations du département et des départements voisins d'abord",
        region: "formations de la région d'abord",
        france: "toute la France, les plus proches d'abord",
      }[effet.rayon];
    case "contexte":
      return `contexte (\`${effet.cle}\`)`;
  }
}

function decrireEffets(effets: Effets): string {
  return effets === "neutre" ? "aucun effet" : effets.map(decrireEffet).join(" · ");
}

// ---------------------------------------------------------------------------
// Conditions, en clair
// ---------------------------------------------------------------------------

const INDEX_CHAMPS = champsParCle();

function libelleOption(cle: string, optionId: string): string {
  const entree = INDEX_CHAMPS.get(cle);
  if (entree === undefined) return optionId;
  const variante = entree.question.variantes[entree.question.variantes.length - 1];
  const texte = contenuOption(entree.question, variante, optionId);
  return texte === undefined ? optionId : `« ${accorder(texte.libelle, GARCON)} »`;
}

function decrireCondition(condition: Condition): string {
  if ("tous" in condition) return condition.tous.map(decrireCondition).join(", et ");
  if ("non" in condition) return `sauf si ${decrireCondition(condition.non)}`;
  const entree = INDEX_CHAMPS.get(condition.cle);
  const numero = entree === undefined ? "?" : `Q${entree.question.numero}`;
  const options = condition.parmi.map((id) => libelleOption(condition.cle, id));
  return `${numero} = ${options.join(" ou ")}`;
}

function decrireCitation(regle: RegleCitation): string {
  if (regle === "toujours") return "";
  if ("siMetier" in regle)
    return ` (seulement pour un métier avec le drapeau \`${regle.siMetier}\`)`;
  return ` (seulement si ${decrireCondition(regle.si)})`;
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

const PASSER: Record<LienPasser, string> = {
  je_ne_sais_pas: "lien « Je ne sais pas, passer »",
  prefere_ne_pas_repondre: "lien « Je préfère ne pas répondre »",
  aucun: "pas de lien pour passer",
};

function typeDeChamp(champ: Champ): string {
  switch (champ.type) {
    case "choix_unique":
      return "choix unique";
    case "choix_multiple":
      return champ.max === null
        ? "choix multiple, sans limite"
        : `choix multiple, ${champ.max} au plus`;
    case "texte":
      return `texte libre facultatif, ${champ.longueurMax} caractères au plus`;
    case "departement":
      return "liste des 101 départements, avec recherche";
    case "metiers":
      return `jusqu'à ${champ.max} champs courts facultatifs, avec suggestions (appellations ROME)`;
  }
}

function texte(t: TexteSelonPrenom, contexte: ContexteAccord): string {
  return rendreTexte(t, contexte);
}

/** Lignes « version elle » et « sans prénom » quand elles diffèrent. */
function declinaisons(t: TexteSelonPrenom, prefixe: string): string[] {
  const lignes: string[] = [];
  const garcon = texte(t, GARCON);
  const fille = texte(t, FILLE);
  if (fille !== garcon.replace("Lucas", "Anaïs"))
    lignes.push(`${prefixe}version « elle » : *${fille}*`);
  if (typeof t !== "string") lignes.push(`${prefixe}sans prénom : *${texte(t, SANS_PRENOM)}*`);
  return lignes;
}

function optionsDuChamp(question: Question, variante: Variante, champ: Champ): string[] {
  if (champ.type !== "choix_unique" && champ.type !== "choix_multiple") return [];
  const lignes = [
    "",
    "| Option (telle qu'affichée) | Citation possible (« Vous avez dit qu’… ») |",
    "|---|---|",
  ];
  for (const option of champ.options) {
    const contenu = contenuOption(question, variante, option.id);
    const libelle = contenu === undefined ? option.id : accorder(contenu.libelle, GARCON);
    const marques = [
      option.si !== undefined ? `affichée seulement si ${decrireCondition(option.si)}` : "",
      option.exclusive ? "décoche les autres" : "",
    ].filter((m) => m !== "");
    const suffixe = marques.length > 0 ? ` *(${marques.join(" ; ")})*` : "";
    const citation =
      option.citation !== undefined && contenu?.citation !== undefined
        ? `${accorder(contenu.citation, GARCON)}${decrireCitation(option.citation)}`
        : "—";
    lignes.push(`| ${libelle}${suffixe} | ${citation} |`);
  }
  return lignes;
}

/** Options dont le libellé ou la citation change dans cette variante. */
function remplacements(question: Question, variante: Variante, champ: Champ): string[] {
  if (champ.type !== "choix_unique" && champ.type !== "choix_multiple") return [];
  const propres = contenuDe(question).variantes?.[variante.id]?.options ?? {};
  const lignes: string[] = [];
  for (const option of champ.options) {
    const propre = propres[option.id];
    const contenu = contenuOption(question, variante, option.id);
    if (propre === undefined || contenu === undefined) continue;
    if (propre.libelle !== undefined)
      lignes.push(`- option : « ${accorder(propre.libelle, GARCON)} »`);
    if (propre.citation !== undefined) {
      lignes.push(
        `- citation de « ${accorder(contenu.libelle, GARCON)} » : ${accorder(propre.citation, GARCON)}`,
      );
    }
  }
  return lignes;
}

function sectionVariante(
  question: Question,
  variante: Variante,
  reference: Variante | null,
): string[] {
  const contenu = contenuDe(question);
  const lignes: string[] = [];
  const titre = titreDe(question, variante);
  if (reference !== null || question.variantes.length > 1) {
    const condition =
      variante.si === undefined ? "par défaut" : `si ${decrireCondition(variante.si)}`;
    lignes.push("", `**Variante \`${variante.id}\`**, ${condition}`);
  }
  const titreReference = reference === null ? undefined : titreDe(question, reference);
  if (titre !== undefined && titre !== titreReference) {
    lignes.push("", `**${texte(titre, GARCON)}**`, ...declinaisons(titre, "- "));
  } else if (titre !== undefined) {
    lignes.push("- même question");
  }
  const aide = aideDe(question, variante);
  const aideReference = reference === null ? undefined : aideDe(question, reference);
  if (aide !== undefined && aide !== aideReference) {
    lignes.push(`- aide, sous la question : « ${accorder(aide, GARCON)} »`);
  }
  lignes.push(
    `- ${variante.champs.map(typeDeChamp).join(" + ")} ; ${PASSER[variante.passer]} ; ${
      variante.avanceAuto ? "avance automatique au toucher" : "bouton « Continuer »"
    } ; durée estimée ${variante.dureeSecondes} s`,
  );
  // Mêmes champs que la variante par défaut : on ne redonne que ce qui change.
  const memesChamps =
    reference !== null &&
    variante.champs.length === reference.champs.length &&
    variante.champs.every((c, i) => c === reference.champs[i]);
  if (memesChamps) {
    const changes = variante.champs.flatMap((c) => remplacements(question, variante, c));
    lignes.push(changes.length === 0 ? "- mêmes options" : "- mêmes options, sauf :", ...changes);
    return lignes;
  }
  for (const champ of variante.champs) {
    const textes = contenu.champs?.[champ.cle];
    if (textes?.libelle !== undefined) {
      lignes.push(
        "",
        `*${accorder(textes.libelle, GARCON)}*${champ.type === "texte" ? ` (${typeDeChamp(champ)})` : ""}`,
      );
    }
    if (champ.si !== undefined) {
      lignes.push(
        "non" in champ.si
          ? `- masqué si ${decrireCondition(champ.si.non)} (sa réponse est alors ignorée)`
          : `- affiché seulement si ${decrireCondition(champ.si)}`,
      );
    }
    if (textes?.exemple !== undefined) {
      lignes.push(`- exemple grisé : « ${accorder(textes.exemple, GARCON)} »`);
    }
    if (CLES_TEXTES_LIBRES.has(champ.cle)) {
      lignes.push(`- sous le champ, en petit : « ${questionnaire.textesLibres.consigneSante} »`);
    }
    if (textes?.citation !== undefined) {
      const il = accorder(textes.citation, GARCON);
      const elle = accorder(textes.citation, FILLE);
      lignes.push(
        `- amorce de citation, jamais affichée, complétée par le LLM avec les mots du parent : « ${il} »${elle === il ? "" : ` (elle : « ${elle} »)`}`,
      );
    }
    lignes.push(...optionsDuChamp(question, variante, champ));
  }
  return lignes;
}

function sectionQuestion(question: Question): string[] {
  const contenu = contenuDe(question);
  const lignes = [
    "",
    `### Q${question.numero} · \`${question.id}\`${question.pageDeVente ? " · question de la page de vente, mot pour mot" : ""}`,
  ];
  if (question.si !== undefined)
    lignes.push("", `*Posée seulement si ${decrireCondition(question.si)}.*`);
  if (contenu.surtitre !== undefined) {
    lignes.push(
      "",
      `Surtitre, au-dessus de la question : « ${accorder(contenu.surtitre, GARCON)} »`,
    );
  }
  // La variante par défaut d'abord (sauf pour Q3, posée sous condition), puis les autres
  // en ne redonnant que ce qui change.
  const parDefaut = question.variantes[question.variantes.length - 1];
  const ordre =
    question.si === undefined
      ? [parDefaut, ...question.variantes.slice(0, -1)]
      : [...question.variantes];
  for (const variante of ordre) {
    const reference = question.si === undefined && variante !== parDefaut ? parDefaut : null;
    lignes.push(...sectionVariante(question, variante, reference));
  }
  lignes.push("", `Pourquoi : ${question.raison}`);
  return lignes;
}

// ---------------------------------------------------------------------------
// Annexes
// ---------------------------------------------------------------------------

function annexeEffets(): string[] {
  const lignes: string[] = [];
  for (const question of QUESTIONS) {
    lignes.push(
      "",
      `**Q${question.numero} · \`${question.id}\`**`,
      "",
      "| Option | Effets |",
      "|---|---|",
    );
    const vus = new Set<Option>();
    for (const variante of question.variantes) {
      for (const champ of variante.champs) {
        if (champ.type === "choix_unique" || champ.type === "choix_multiple") {
          for (const option of champ.options) {
            if (vus.has(option)) continue;
            vus.add(option);
            const contenu = contenuOption(question, variante, option.id);
            const libelle = contenu === undefined ? option.id : accorder(contenu.libelle, GARCON);
            lignes.push(`| ${libelle} (\`${option.id}\`) | ${decrireEffets(option.effets)} |`);
          }
        } else if (!lignes.includes(`| *${champ.cle}* | ${decrireEffets(champ.effets)} |`)) {
          lignes.push(`| *${champ.cle}* | ${decrireEffets(champ.effets)} |`);
        }
      }
    }
  }
  return lignes;
}

function annexeCouverture(): string[] {
  const lignes = [
    "",
    "| Dimension | Questions (poids le plus fort d'une option) | Vues de tous | dont poids ≥ 0,5 | dont poids ≥ 0,8 |",
    "|---|---|---:|---:|---:|",
  ];
  for (const c of couvertureDesDimensions()) {
    const questions = c.questions
      .map(
        (q) =>
          `Q${q.numero}${q.variante ? " (var.)" : ""} ${poids(q.poidsMax)}${q.sensUnique ? " (seuil ou plafond)" : ""}`,
      )
      .join(", ");
    lignes.push(
      `| \`${c.dim}\` | ${questions} | ${c.vuesDeTous} | ${c.vuesDeTousPoids05} | ${c.vuesDeTousPoids08} |`,
    );
  }
  lignes.push(
    "",
    "« (var.) » : vue par une partie des parents seulement (Q3, une variante, ou une option conditionnelle) ; elle n'entre pas dans les comptes.",
    "",
    "Dimensions qui reposent sur une seule question vue de tous, et pourquoi c'est accepté :",
  );
  for (const [dim, raison] of Object.entries(EXCEPTIONS_COUVERTURE))
    lignes.push(`- \`${dim}\` : ${raison}`);
  return lignes;
}

function annexeEcarts(): string[] {
  const r = questionnaire.raisonsEcart;
  const trous = { genre: "il" as const, variables: { n: "{n}", reponse: "{reponse}" } };
  return [
    "",
    "Une phrase par métier écarté à cause d'une réponse (SPEC §5.6 : seuls 3 à 5 métiers bien classés sont signalés). Au masculin ; `{n}` et `{reponse}` sont remplis par les explications (2.3).",
    "",
    `- Durée d'études, niveau du métier : « ${accorder(r.niveauMetier, trous)} »`,
    `- Durée d'études, « Je ne sais pas » : « ${accorder(r.etudesNeSaitPas, trous)} »`,
    `- Durée des formations : « ${accorder(r.dureeFormations, trous)} » (\`{n}\` : la plus courte)`,
    `- Privé : « ${accorder(r.prive, trous)} »`,
    ...Object.entries(r.refus).map(
      ([drapeau, t]) => `- Refus \`${drapeau}\` : « ${accorder(t, trous)} »`,
    ),
    "",
    `Réponses citées dans \`{reponse}\` : ${Object.values(r.reponsesCitees)
      .map((t) => `« ${t} »`)
      .join(", ")}.`,
  ];
}

function annexeSynonymes(appellations: ReadonlyMap<number, string>): string[] {
  return [
    "",
    "Saisies courantes de Q30 et appellations ROME proposées (`content/questionnaire.ts`, `synonymesMetiers`) :",
    "",
    ...Object.entries(questionnaire.synonymesMetiers).map(
      ([saisie, codes]) =>
        `- « ${saisie} » → ${codes.map((c) => `${appellations.get(c) ?? "?"} (${c})`).join(", ")}`,
    ),
  ];
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

/**
 * @param appellations libellés des appellations ROME par code OGR
 *   (data/processed/metiers.json), pour l'annexe des synonymes.
 */
export function genererDocumentation(appellations: ReadonlyMap<number, string>): string {
  const e = questionnaire.ecrans;
  const nombres = PARCOURS_TYPES.map((p) => ({
    nom: p.nom,
    questions: parcours(p.reponses).length,
    duree: dureeEstimeeSecondes(p.reponses),
  }));
  const chapitres = Object.entries(questionnaire.chapitres) as Array<[IdChapitre, string]>;
  const ecrans = ECRANS.map((ecran) => ecran.dureeSecondes).reduce((a, b) => a + b, 0);

  const lignes: string[] = [
    "# Questionnaire parent",
    "",
    "> **Document généré, ne pas modifier à la main.** Il est produit par `npm run doc:questionnaire` depuis la définition typée, `src/lib/questionnaire/definition.ts` (ordre, conditions, effets, durées), et les textes, `content/questionnaire.ts`. **Ces deux fichiers font foi.** Pour changer un mot, modifiez `content/questionnaire.ts`, puis relancez la commande : un test vérifie que ce document est à jour.",
    ">",
    "> Conception : `docs/conception/questionnaire.md` (version 2), critique : `docs/conception/questionnaire-critique-2.md` (réserves R1 à R9 et améliorations 1 et 2 appliquées). Version 3 : `docs/conception/questions-ouvertes.md` (trois phrases libres sous Q5, Q6 et Q20 ; Q7 et Q14 retirées, leurs numéros restent des trous), critique : `docs/conception/questions-ouvertes-critique-2.md` (réserves R1 à R4 appliquées).",
    "",
    "Les textes sont montrés tels qu'affichés, au masculin, pour un enfant appelé Lucas ; les versions « elle » et « sans prénom » sont données quand elles diffèrent. Les apostrophes, espaces insécables et points de suspension sont posés au rendu.",
    "",
    "## 1. Parcours",
    "",
    "| Situation (Q2) | Questions | Durée estimée |",
    "|---|---:|---:|",
    ...nombres.map((n) => `| ${n.nom} | ${n.questions} | ${formaterDuree(n.duree)} |`),
    "",
    `Durée : somme des durées estimées de chaque question (lecture à 3,5 mots par seconde, réflexion, gestes ; conception §7) et ${ecrans} s d'écrans hors questions. L'accueil annonce « environ 10 minutes », comme la page de vente : la méthode est prudente (les parents simulés ont été plus rapides qu'elle).`,
    "",
    "| Chapitre | Questions |",
    "|---|---|",
    ...chapitres.map(
      ([id, nom]) =>
        `| ${nom} | ${QUESTIONS.filter((q) => q.chapitre === id)
          .map((q) => `Q${q.numero}`)
          .join(", ")} |`,
    ),
    "",
    "Règles d'écran :",
    `- en-tête : le chapitre, « ${questionnaire.interface.enTete} » et une barre de progression ; le total vaut ${QUESTIONS.length}, ou ${QUESTIONS.length - 1} dès que Q2 rend Q3 inutile ;`,
    `- « ${questionnaire.interface.passer} » sur toutes les questions d'observation ; un seul « je ne sais pas » par écran (Q23, Q24, Q25 et Q27 ont leur propre option, et pas de lien) ;`,
    `- choix multiple : au-delà de la limite, la case ne se coche pas, et ce message s'affiche : « ${accorder(questionnaire.interface.limiteAtteinte, { genre: "il", variables: { max: 3 } })} » ;`,
    "- retour arrière sur tous les écrans sauf l'accueil ; sauvegarde à chaque réponse ; une réponse devenue sans objet (Q2 modifiée) est gardée mais ignorée ;",
    `- phrases libres (Q5, Q6, Q20) : facultatives, ${CLES_TEXTES_LIBRES.get("fierte_recit") ?? 140} caractères au plus (compteur « ${accorder(questionnaire.textesLibres.compteur, { genre: "il", variables: { n: 124, max: 140 } })} » à partir de 120) ; « Continuer » est actif dès qu'une option est cochée ou qu'un caractère est saisi, et le lien pour passer disparaît alors ; la touche « Entrée » vaut « Continuer » ;`,
    `- un passage qui semble parler de santé est signalé pendant la saisie (« ${questionnaire.textesLibres.santeDetectee} ») et retiré avant de quitter le navigateur, puis à nouveau côté serveur ; une non-réponse (« je ne sais pas », « rien »…) est ramenée à vide (\`src/lib/questionnaire/textes-libres.ts\`).`,
    "",
    "## 2. Écrans hors questions",
    "",
    "**Accueil**, avant Q1",
    "",
    `> **${e.accueil.titre}**`,
    ...e.accueil.paragraphes.map((p) => `> ${p}`),
    `> Bouton : « ${e.accueil.bouton} »`,
    "",
    "**Transition**, avant Q4",
    "",
    `> **${texte(e.transitionObservation.titre, GARCON)}**`,
    `> ${accorder(e.transitionObservation.texte, GARCON)}`,
    `> ${accorder(e.transitionObservation.phrasesLibres, GARCON)}`,
    `> Bouton : « ${e.transitionObservation.bouton} »`,
    "",
    ...declinaisons(e.transitionObservation.titre, "- titre, "),
    "",
    "**Transition**, avant Q21",
    "",
    `> **${e.transitionPratique.titre}**`,
    `> ${accorder(e.transitionPratique.texte, GARCON)}`,
    `> Bouton : « ${e.transitionPratique.bouton} »`,
    "",
    `**Fin**, après Q30. Trois cas, selon les réponses aux questions d'observation (Q${OBSERVATION.premier} à Q${OBSERVATION.dernier}) :`,
    "",
    `1. Cas général : **${e.fin.titre}** Bouton « ${texte(e.fin.voirLesPistes, GARCON)} » (sans prénom : « ${texte(e.fin.voirLesPistes, SANS_PRENOM)} »).`,
    `2. ${SEUIL_PASSEES_MESSAGE_DOUX} questions passées ou plus, mais au moins ${MIN_REPONSES_OBSERVATION} réponses : « ${texte(e.fin.messageDoux, { ...GARCON, variables: { n: 6 } })} » Bouton principal « ${texte(e.fin.voirLesPistes, GARCON)} », bouton secondaire « ${e.fin.revoirLesQuestions} ».`,
    `3. Moins de ${MIN_REPONSES_OBSERVATION} réponses : **${e.fin.titreFerme}** « ${texte(e.fin.messageFerme, { ...GARCON, variables: { minimum: MIN_REPONSES_OBSERVATION, manque: 3 } })} » Bouton principal « ${e.fin.revoirLesQuestions} », lien secondaire « ${e.fin.voirQuandMeme} ».`,
    "",
    `Sans prénom, « sur Lucas » devient « sur votre enfant ». Pourquoi ${MIN_REPONSES_OBSERVATION} : chaque piste cite 3 ou 4 réponses (SPEC §5.7), et trois pistes de familles différentes ne s'appuient pas sur les mêmes.`,
    "",
    "## 3. Les questions",
  ];

  for (const [id, nom] of chapitres) {
    lignes.push("", `## Chapitre « ${nom} »`);
    for (const question of QUESTIONS.filter((q) => q.chapitre === id))
      lignes.push(...sectionQuestion(question));
  }

  lignes.push(
    "",
    "## Annexe A. Effets de chaque option",
    "",
    `Version des réponses : ${VERSION_QUESTIONNAIRE}. Notation : \`organiser\` 0,90 (×1,2) = cible 0,90 sur \`organiser\`, poids 1,2 ; « seuil » = les métiers en dessous sont pénalisés, ceux au-dessus ne sont pas favorisés ; « plafond » = l'inverse ; **filtre** = exclusion dure. La dimension de cœur de Q20 désigne une dimension que l'une des 3 pistes doit porter à 0,6 ou plus ; sans elle, le moteur prend le repli, parmi ${DIMENSIONS_REPLI_COEUR.map((d) => `\`${d}\``).join(", ")} (conception §5.5). La confiance de \`diriger\` est plafonnée à ${poids(PLAFOND_CONFIANCE_DIRIGER.confianceMax)}, sauf si Q10 = « prend les choses en main » et Q20 = « on lui a confié une responsabilité ».`,
    ...annexeEffets(),
    "",
    "## Annexe B. Couverture des 21 dimensions",
    ...annexeCouverture(),
    "",
    "## Annexe C. Raisons d'écart",
    ...annexeEcarts(),
    "",
    "## Annexe D. Métiers évoqués (Q30)",
    ...annexeSynonymes(appellations),
    "",
  );

  return lignes.map(typographieMarkdown).join("\n");
}

/**
 * Typographie d'une ligne Markdown : sur la ligne entière (« **filtre** : »),
 * puis entre les marques d'emphase, sans quoi « ? » ou « : » collés à « ** »
 * ne reçoivent pas leur espace insécable (« enfant ?** »). `typographie` est
 * idempotente : la deuxième passe ne fait qu'ajouter ce qui manquait.
 */
function typographieMarkdown(ligne: string): string {
  return typographie(ligne)
    .split(/(\*+)/)
    .map((morceau, i) => (i % 2 === 1 ? morceau : typographie(morceau)))
    .join("");
}
