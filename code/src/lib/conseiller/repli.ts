/**
 * Les gabarits (conseiller-ia.md §7.3) : les textes du calcul seul, et ceux
 * qui remplacent un texte du LLM refusé par le validateur. Ils passent le
 * même validateur : chaque lien qui échoue est retiré.
 */
import { conseiller as textes } from "@content/conseiller";
import { CONSTANTES } from "@/lib/moteur/constantes";
import { accorder } from "@/lib/questionnaire/accords";
import type { Genre } from "@/lib/questionnaire/types";
import { accorderLibelle, composerPourquoi, eliderDe, traitSansDeuxPoints } from "./composer";
import { nettoyerPreuve } from "./raisons";
import { contientExpression, minusculeInitiale, mots, normaliser, resserrer } from "./texte";
import type {
  CandidatInterne,
  Charge,
  LienEnfant,
  LienParent,
  PisteSortie,
  ReponseEnvoyee,
  SortieLlm,
} from "./types";
import { echecsPiste } from "./validateur";
import { definitionCorrigee, decouperDefinition } from "./charge";

// ---------------------------------------------------------------------------
// « Le métier, simplement » (§7.3.2)
// ---------------------------------------------------------------------------

function remplacerSujet(d1: string, candidat: CandidatInterne, genre: Genre): string {
  const brut = candidat.metier.libelle;
  const formes = new Set<string>([
    accorderLibelle(brut, "il"),
    accorderLibelle(brut, "elle"),
    brut,
  ]);
  const pronom = genre === "il" ? "Il" : "Elle";
  const article = /^(?:Le|La|L['’]) ?/u.exec(d1);
  if (!article) return d1;
  const reste = d1.slice(article[0].length);
  const resteMinuscule = reste.toLocaleLowerCase("fr");
  for (const forme of [...formes].sort((a, b) => b.length - a.length)) {
    if (!resteMinuscule.startsWith(forme.toLocaleLowerCase("fr"))) continue;
    const suite = /^(?:\s*,\s*|\s+)(?=\p{Ll})/u.exec(reste.slice(forme.length));
    if (!suite) continue;
    let phrase = `${pronom} ${reste.slice(forme.length + suite[0].length)}`;
    if (genre === "elle") phrase = phrase.replace(/(?<!\p{L})il(?!\p{L})/gu, "elle");
    return phrase;
  }
  return d1;
}

/** Infinitifs que le ROME écrit sans accent en majuscule (« Elaborer ») : rendus accentués. */
const ACCENTS_INITIAUX: Readonly<Record<string, string>> = {
  etre: "être",
  elaborer: "élaborer",
  etablir: "établir",
  evaluer: "évaluer",
  etudier: "étudier",
  echanger: "échanger",
  ecouter: "écouter",
  ecrire: "écrire",
  eduquer: "éduquer",
  equiper: "équiper",
  emettre: "émettre",
  eviter: "éviter",
  elever: "élever",
  etiqueter: "étiqueter",
  elargir: "élargir",
  eclairer: "éclairer",
  economiser: "économiser",
  editer: "éditer",
  epauler: "épauler",
  etayer: "étayer",
  enoncer: "énoncer",
  evacuer: "évacuer",
  elaguer: "élaguer",
};

/** Première lettre en minuscule, accent rendu aux infinitifs du ROME (« Elaborer » → « élaborer »). */
export function preuveEnMinuscule(preuve: string): string {
  const m = preuve.match(/^(\p{L}+)(.*)$/su);
  if (m) {
    const remplace = ACCENTS_INITIAUX[m[1].toLowerCase()];
    if (remplace !== undefined && /^E/.test(m[1])) return remplace + m[2];
  }
  return minusculeInitiale(preuve);
}

function activite(texte: string): string {
  return preuveEnMinuscule(nettoyerPreuve(texte).replace(/[.;,\s]+$/u, ""));
}

/**
 * Première phrase de fiche écrite comme une plaquette (passe qualité de 2.4) :
 * « joue un rôle clé », « un professionnel essentiel », « garantissant une
 * expérience culinaire remarquable ». 74 fiches éligibles sur 545.
 */
const PLAQUETTE =
  /essentiel|rôle (?:clé|crucial|majeur|central)|garantissant|remarquable|incontournable|au cœur d|indispensable|primordial|crucial|optimal|excellence|un élément|un maillon|expert dédié/iu;

/** Gabarit depuis la définition ROME (§7.3.2, critique 2 R4 : `d1` seul est gardé tel quel). */
export function metierSimplementGabarit(candidat: CandidatInterne, genre: Genre): string {
  const [d1Brut, ...activites] = decouperDefinition(definitionCorrigee(candidat.metier));
  const d1Seul = resserrer(d1Brut ?? "");
  // Une définition sans point après sa première phrase : on le pose.
  const d1 = remplacerSujet(/[.?!…]$/u.test(d1Seul) ? d1Seul : `${d1Seul}.`, candidat, genre);
  const actes = activites
    .slice(0, 3)
    .map(activite)
    .filter((a) => a !== "");
  if (PLAQUETTE.test(d1) && actes.length >= 2) {
    // Une seule phrase : trois activités seulement si elle reste lisible.
    for (const [n, max] of [
      [3, 260],
      [2, 420],
    ]) {
      const liste = actes.slice(0, n);
      const texte = accorder(textes.metierSimplement.activites, {
        genre,
        prenom: null,
        variables: { activites: `${liste.slice(0, -1).join(", ")} et ${liste[liste.length - 1]}` },
      });
      if (texte.length <= max) return texte;
    }
  }
  for (const n of [3, 2]) {
    if (actes.length < n) continue;
    const liste = actes.slice(0, n);
    const reunies = `${liste.slice(0, -1).join(", ")} et ${liste[liste.length - 1]}`;
    const phrase2 = accorder(textes.metierSimplement.concretement, {
      genre,
      prenom: null,
      variables: { activites: reunies },
    });
    const texte = `${d1} ${phrase2}`;
    if (texte.length <= 420) return texte;
  }
  return d1;
}

// ---------------------------------------------------------------------------
// Liens (§7.3.3, §7.3.4)
// ---------------------------------------------------------------------------

const VERBE_INFINITIF = /^[A-ZÉÈÀ][a-zéèêàâîôûç]+(?:er|ir|re|oir)\b/u;

/**
 * Compétences de fiche trop administratives pour un parent (passe qualité de
 * 2.4) : « assurer l'interface avec les différentes parties prenantes »,
 * « accéder directement en écriture sur des machines ». Expressions normalisées.
 */
const PREUVES_ADMINISTRATIVES: readonly string[] = [
  "parties prenantes",
  "interface",
  "en ecriture",
  "conformement",
  "dans le respect",
  "reglementation",
  "reglementaire",
  "procedure",
  "procedures",
  "dispositif",
  "dispositifs",
  "mise en oeuvre",
  "politique",
  "indicateurs",
  "reporting",
  "processus",
  "cahier des charges",
];

/**
 * « Fabriqué ou réparé de ses mains », « il bricole » (dimension `fabriquer`)
 * ne se relient qu'à un geste : préfixes de verbes manuels (passe qualité de 2.4).
 */
const GESTES_MANUELS: readonly string[] = [
  "fabriqu",
  "repar",
  "monter",
  "montag",
  "demont",
  "assembl",
  "soud",
  "usin",
  "decoup",
  "poser",
  "pose",
  "install",
  "regl",
  "entreten",
  "maintenance",
  "depann",
  "construi",
  "cabl",
  "raccord",
  "brancher",
  "peindre",
  "percer",
  "faconn",
  "ajust",
  "remplac",
  "changer",
  "coudre",
  "tailler",
  "sculpt",
  "cuisin",
  "decor",
  "restaur",
  "renov",
  "manipul",
];

/** Une compétence lisible par un parent pour cette dimension ? */
function preuveLisible(preuve: string, dimension: string): boolean {
  const n = normaliser(preuve);
  if (PREUVES_ADMINISTRATIVES.some((x) => contientExpression(n, x))) return false;
  if (dimension === "fabriquer")
    return mots(preuve).some((m) => GESTES_MANUELS.some((g) => m.startsWith(g)));
  return true;
}

type Brique = { reponse: ReponseEnvoyee; preuve: string; fait: string };

function citableIci(r: ReponseEnvoyee, candidat: CandidatInterne): boolean {
  if (r.citable === true) return true;
  if (r.citable === false) return false;
  return candidat.envoye.drapeaux.includes(r.citable.si_metier);
}

/** Liens citables du moteur, réduits à une réponse, une preuve et son fait (§7.3.3, points 1 et 2). */
function briques(candidat: CandidatInterne, charge: Charge): Brique[] {
  const resultat: Brique[] = [];
  const faitsPris = new Set<string>();
  for (const l of candidat.preselection.liens) {
    if (!l.citable) continue;
    const valeurHaute = l.metier.valeur >= CONSTANTES.liens.metierHaut;
    if (!(l.type === "seuil" || (l.type === "cible" && valeurHaute))) continue;
    const premiere = l.reponses[0];
    if (!premiere) continue;
    const reponse = charge.reponses.get(`${premiere.cle}=${premiere.option}`);
    if (!reponse || !reponse.citation || reponse.contrainte || !citableIci(reponse, candidat))
      continue;
    for (const brute of l.metier.preuves) {
      const propre = nettoyerPreuve(brute);
      if (!VERBE_INFINITIF.test(propre) || propre.length > 110 || /[:;]/.test(propre)) continue;
      if (!preuveLisible(propre, l.dimension)) continue;
      const fait = candidat.envoye.faits.find((f) => f.texte === brute);
      if (!fait || faitsPris.has(fait.id)) continue;
      faitsPris.add(fait.id);
      resultat.push({ reponse, preuve: preuveEnMinuscule(propre), fait: fait.id });
      break;
    }
  }
  return resultat;
}

function remplir(gabarit: string, preuve: string, genre: Genre): string {
  return accorder(gabarit.replace("{de_preuve}", eliderDe(preuve)).replace("{preuve}", preuve), {
    genre,
    prenom: null,
  });
}

function fragmentEtudes(t: typeof textes.pourquoiParent, candidat: CandidatInterne): string {
  const n = candidat.bacPlus;
  if (n >= 1) {
    return candidat.bacPlusMax !== null
      ? t.etudesJusqua.replace("{n}", String(n)).replace("{max}", String(candidat.bacPlusMax))
      : t.etudesBacPlus.replace("{n}", String(n));
  }
  return n === 0 ? t.etudesBac : t.etudesSansDiplome;
}

/** Réponse « contrainte » citable pour le lien d'études (§7.3.3, point 4), ou `null`. */
function reponseEtudes(candidat: CandidatInterne, charge: Charge): ReponseEnvoyee | null {
  const etudes = candidat.envoye.etudes;
  if (etudes.condition_experience !== null || etudes.voie_courte_incertaine) return null;
  const c = candidat.preselection.contraintes.find((k) => k.type === "etudes");
  if (!c || c.type !== "etudes") return null;
  const r = charge.reponses.get(`${c.reponse.cle}=${c.reponse.option}`);
  return r && r.citation && citableIci(r, candidat) ? r : null;
}

export type OptionsLiens = {
  /** Réponses déjà citées dans deux pistes (T15) : à ne plus citer. */
  interdites?: ReadonlySet<string>;
};

/** « Pourquoi ça lui ressemble », parent, en gabarit (§7.3.3). */
export function liensParentGabarit(
  candidat: CandidatInterne,
  charge: Charge,
  options: OptionsLiens = {},
): LienParent[] {
  const t = textes.pourquoiParent;
  const vues = new Set<string>();
  const choisies = briques(candidat, charge).filter((b) => {
    if (vues.has(b.reponse.id) || options.interdites?.has(b.reponse.id)) return false;
    vues.add(b.reponse.id);
    return true;
  });
  const etudesBrut = reponseEtudes(candidat, charge);
  const etudes = etudesBrut && !options.interdites?.has(etudesBrut.id) ? etudesBrut : null;
  const fabriquer = (liste: Brique[], avecEtudes: boolean): LienParent[] => {
    const liens: LienParent[] = liste.slice(0, 3).map((b, i) => ({
      reponses: [b.reponse.id],
      rappel: b.reponse.citation as string,
      metier: remplir(t.liens[i] ?? t.liens[t.liens.length - 1], b.preuve, charge.genre),
      faits: [b.fait],
    }));
    if (avecEtudes && etudes) {
      liens.push({
        reponses: [etudes.id],
        rappel: etudes.citation as string,
        metier: fragmentEtudes(t, candidat),
        faits: [`${candidat.envoye.code}.e`],
      });
    }
    return liens;
  };
  return filtrerParValidateur(choisies, etudes !== null, fabriquer, candidat, charge, "parent");
}

/** Version enfant, en gabarit (§7.3.4) : le trait vient de la table. */
export function liensEnfantGabarit(candidat: CandidatInterne, charge: Charge): LienEnfant[] {
  const t = textes.pourquoiEnfant;
  const vues = new Set<string>();
  const choisies = briques(candidat, charge).filter((b) => {
    if (!b.reponse.enfant || !b.reponse.trait_enfant || vues.has(b.reponse.id)) return false;
    vues.add(b.reponse.id);
    return true;
  });
  const etudesBrut = reponseEtudes(candidat, charge);
  const etudes = etudesBrut?.enfant && etudesBrut.trait_enfant ? etudesBrut : null;
  const trait = (r: ReponseEnvoyee) => minusculeInitiale(traitSansDeuxPoints(r.trait_enfant ?? ""));
  const fabriquer = (liste: Brique[], avecEtudes: boolean): LienEnfant[] => {
    const liens: LienEnfant[] = liste.slice(0, 3).map((b, i) => ({
      reponses: [b.reponse.id],
      trait: trait(b.reponse),
      metier: remplir(t.liens[i] ?? t.liens[t.liens.length - 1], b.preuve, charge.genre),
      faits: [b.fait],
    }));
    if (avecEtudes && etudes && liens.length < 3) {
      liens.push({
        reponses: [etudes.id],
        trait: trait(etudes),
        metier: fragmentEtudes(t, candidat),
        faits: [`${candidat.envoye.code}.e`],
      });
    }
    return liens;
  };
  return filtrerParValidateur(choisies, etudes !== null, fabriquer, candidat, charge, "enfant");
}

/**
 * Retire chaque brique dont le lien échoue au validateur, puis raccourcit
 * jusqu'à tenir dans la longueur composée (T11).
 */
function filtrerParValidateur<L extends LienParent | LienEnfant>(
  depart: Brique[],
  avecEtudes: boolean,
  fabriquer: (liste: Brique[], avecEtudes: boolean) => L[],
  candidat: CandidatInterne,
  charge: Charge,
  version: "parent" | "enfant",
): L[] {
  let liste = [...depart];
  let etudes = avecEtudes;
  const champ = version === "parent" ? "pourquoi_parent" : "pourquoi_enfant";
  for (let essai = 0; essai < 12; essai++) {
    const liens = fabriquer(liste, etudes);
    const piste: PisteSortie = {
      code: candidat.envoye.code,
      raison_du_choix: "",
      metier_simplement: "",
      ia_phrase: "",
      pourquoi_parent: version === "parent" ? (liens as LienParent[]) : [],
      pourquoi_enfant: version === "enfant" ? (liens as LienEnfant[]) : [],
    };
    const echecs = echecsPiste(piste, 0, charge, { gabarit: true });
    const fautifs = new Set<number>();
    for (const e of echecs) {
      const m = e.champ.match(new RegExp(`^pistes\\[0\\]\\.${champ}\\[(\\d+)\\]`));
      if (m) fautifs.add(Number(m[1]));
    }
    if (fautifs.size > 0) {
      const nbBriques = Math.min(liste.length, 3);
      const sansEtudes = [...fautifs].some((k) => k >= nbBriques);
      if (sansEtudes) etudes = false;
      liste = liste.filter((_, k) => !(k < nbBriques && fautifs.has(k)));
      continue;
    }
    const tropLong =
      version === "parent"
        ? composerPourquoi(liens as LienParent[]).length > 700
        : echecs.some((e) => e.code === "T11");
    if (tropLong) {
      if (Math.min(liste.length, 3) > 2) liste = liste.slice(0, Math.min(liste.length, 3) - 1);
      else if (etudes) etudes = false;
      else liste = liste.slice(0, -1);
      continue;
    }
    return liens;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Pistes et sortie complètes
// ---------------------------------------------------------------------------

/** Raison du choix des pistes du calcul seul (jamais montrée). */
export const RAISON_CALCUL_SEUL =
  "Piste retenue par le calcul seul, sans lecture des réponses écrites.";

/** Analyse de la sortie des gabarits (jamais montrée). */
export const ANALYSE_GABARITS =
  "Sortie des gabarits : les pistes sont celles du calcul seul, les textes viennent des réponses fermées et des fiches officielles.";

/** Une piste entièrement écrite par les gabarits. */
export function pisteGabarit(
  candidat: CandidatInterne,
  charge: Charge,
  options: OptionsLiens = {},
): PisteSortie {
  return {
    code: candidat.envoye.code,
    raison_du_choix: RAISON_CALCUL_SEUL,
    metier_simplement:
      candidat.simplementPreRedige ?? metierSimplementGabarit(candidat, charge.genre),
    ia_phrase: "",
    pourquoi_parent: liensParentGabarit(candidat, charge, options),
    pourquoi_enfant: liensEnfantGabarit(candidat, charge),
  };
}

/** Réponses citées dans le `pourquoi_parent` d'au moins deux des pistes données (T15). */
export function reponsesSaturees(pistes: readonly PisteSortie[]): Set<string> {
  const compte = new Map<string, number>();
  for (const p of pistes) {
    for (const id of new Set(p.pourquoi_parent.flatMap((l) => l.reponses))) {
      compte.set(id, (compte.get(id) ?? 0) + 1);
    }
  }
  return new Set([...compte].filter(([, n]) => n >= 2).map(([id]) => id));
}

/**
 * Sortie complète des gabarits, au format du LLM : pistes du calcul seul (ou
 * les codes donnés). Sert au repli total et au fournisseur mock « gabarits ».
 */
export function sortieGabarits(charge: Charge, codes?: readonly string[]): SortieLlm {
  const choisis = codes ?? charge.preselection.repli.pistes.map((p) => p.code_rome);
  const pistes: PisteSortie[] = [];
  for (const code of choisis) {
    const candidat = charge.candidats.get(code);
    if (!candidat) throw new Error(`Piste ${code} absente de la présélection`);
    pistes.push(pisteGabarit(candidat, charge, { interdites: reponsesSaturees(pistes) }));
  }
  return { analyse: ANALYSE_GABARITS, pistes };
}
