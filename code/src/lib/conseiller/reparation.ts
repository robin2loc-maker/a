/**
 * Réparation par le code (passe qualité de 2.4) : ce que le validateur
 * refuse, le code le corrige quand il le peut sans rien écrire lui-même,
 * avant de passer au gabarit ou de relancer le modèle.
 *
 * - un lien fautif est retiré, s'il reste assez de liens ; un lien qui colle
 *   deux réponses (« A et B ») est d'abord coupé en deux, et la moitié qui
 *   passe seule le validateur est gardée (T30) ;
 * - un texte composé trop long perd son dernier lien de trait (T11), un lien
 *   répété ou mal placé est retiré ou remis en dernier (T14) ;
 * - une réponse citée dans trois pistes est retirée de l'une d'elles (T15) ;
 * - un choix fautif (V02 à V09) garde les pistes compatibles du modèle et
 *   complète par le candidat le mieux placé du calcul (trio partiel).
 *
 * Seul un champ que le code ne sait pas réparer passe au gabarit. Rien de ce
 * qui sort d'ici n'a échappé au validateur : chaque lien gardé l'a passé.
 */
import { composerPourquoi } from "./composer";
import {
  liensEnfantGabarit,
  liensParentGabarit,
  metierSimplementGabarit,
  reponsesSaturees,
} from "./repli";
import { LONGUEURS, MARGE_LONGUEUR } from "./schema";
import { traitSansDeuxPoints } from "./composer";
import { minusculeInitiale, mots, phrases } from "./texte";
import type {
  Charge,
  Echec,
  LienEnfant,
  LienParent,
  Origine,
  PisteSortie,
  SortieLlm,
} from "./types";
import { echecsDuChoix, echecsEnsemble, echecsPiste } from "./validateur";

export type PisteTravail = {
  code: string;
  metierSimplement: { texte: string; origine: Origine };
  iaPhrase: string;
  parent: { liens: LienParent[]; origine: "llm" | "gabarit" };
  enfant: { liens: LienEnfant[]; origine: "llm" | "gabarit" };
  raisonDuChoix: string | null;
};

export type Mixte = {
  pistes: PisteTravail[];
  /** Champs touchés (`<code>.<champ>`), et `<code>.piste` pour une piste complétée par le calcul. */
  remplaces: string[];
  /** Pistes ajoutées par le calcul au trio du modèle (trio partiel). */
  completees: string[];
  /** L'analyse est fautive : elle n'est pas gardée. */
  analyseFautive: boolean;
};

export function versSortie(p: PisteTravail): PisteSortie {
  return {
    code: p.code,
    raison_du_choix: p.raisonDuChoix ?? "",
    metier_simplement: p.metierSimplement.texte,
    ia_phrase: p.iaPhrase,
    pourquoi_parent: p.parent.liens,
    pourquoi_enfant: p.enfant.liens,
  };
}

export function metierSimplementDe(
  charge: Charge,
  code: string,
): { texte: string; origine: Origine } {
  const c = charge.candidats.get(code);
  if (!c) throw new Error(`Piste ${code} absente de la présélection`);
  if (c.simplementPreRedige) return { texte: c.simplementPreRedige, origine: "pre_redige" };
  return { texte: metierSimplementGabarit(c, charge.genre), origine: "gabarit" };
}

// ---------------------------------------------------------------------------
// Trio partiel
// ---------------------------------------------------------------------------

function* combinaisons<T>(liste: readonly T[], k: number, debut = 0): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  for (let i = debut; i <= liste.length - k; i++) {
    for (const reste of combinaisons(liste, k - 1, i + 1)) yield [liste[i], ...reste];
  }
}

/**
 * Trio partiel : le plus grand sous-ensemble des pistes du modèle (les
 * premières d'abord, il les range de la plus convaincante à la moins
 * convaincante), complété par les candidats les mieux placés du calcul, qui
 * tienne toutes les règles du choix. `exclues` : pistes du modèle ou candidats
 * sans deux liens expliquables. `null` : aucune piste du modèle ne peut être gardée.
 */
export function trioPartiel(
  charge: Charge,
  codesLlm: readonly string[],
  exclues: ReadonlySet<string> = new Set(),
): { garder: string[]; ajouter: string[] } | null {
  const n = charge.envoi.nombre_de_pistes;
  const valides = codesLlm.filter(
    (c, k) => charge.candidats.has(c) && codesLlm.indexOf(c) === k && !exclues.has(c),
  );
  const ordre = charge.envoi.candidats.map((c) => c.code).filter((c) => !exclues.has(c));
  for (let taille = Math.min(valides.length, n); taille >= 1; taille--) {
    for (const garder of combinaisons(valides, taille)) {
      const libres = ordre.filter((c) => !garder.includes(c));
      for (const ajouter of combinaisons(libres, n - taille)) {
        if (echecsDuChoix([...garder, ...ajouter], charge).length === 0) return { garder, ajouter };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Liens
// ---------------------------------------------------------------------------

type Version = "parent" | "enfant";
type Lien<V extends Version> = V extends "parent" ? LienParent : LienEnfant;

const CHAMP_LIEN = /^pistes\[(\d+)\]\.(pourquoi_parent|pourquoi_enfant)\[(\d+)\]/;
const CHAMP_PISTE =
  /^pistes\[(\d+)\]\.(metier_simplement|ia_phrase|pourquoi_parent|pourquoi_enfant|raison_du_choix)/;

const nomChamp = (v: Version) => (v === "parent" ? "pourquoi_parent" : "pourquoi_enfant");

/** Échecs d'un lien (`j`) de la piste `i`. */
function echecsDuLien(echecs: readonly Echec[], i: number, v: Version, j: number): Echec[] {
  return echecs.filter((e) => {
    const m = CHAMP_LIEN.exec(e.champ);
    return m !== null && Number(m[1]) === i && m[2] === nomChamp(v) && Number(m[3]) === j;
  });
}

/** Échecs d'un champ de la piste `i` (ses liens compris). */
function echecsDuChamp(echecs: readonly Echec[], i: number, champ: string): Echec[] {
  return echecs.filter((e) => {
    const m = CHAMP_PISTE.exec(e.champ);
    return m !== null && Number(m[1]) === i && m[2] === champ;
  });
}

function pisteAvec(code: string, v: Version, liens: (LienParent | LienEnfant)[]): PisteSortie {
  return {
    code,
    raison_du_choix: "",
    metier_simplement: "",
    ia_phrase: "",
    pourquoi_parent: v === "parent" ? (liens as LienParent[]) : [],
    pourquoi_enfant: v === "enfant" ? (liens as LienEnfant[]) : [],
  };
}

/** Le lien, seul dans sa piste, passe-t-il le validateur ? */
function lienValide(code: string, v: Version, lien: LienParent | LienEnfant, charge: Charge) {
  const echecs = echecsPiste(pisteAvec(code, v, [lien]), 0, charge, { gabarit: true });
  return echecsDuLien(echecs, 0, v, 0).length === 0;
}

/**
 * Un lien qui cite deux réponses et échoue : on garde le texte entier avec
 * une seule d'entre elles s'il passe ainsi (une précision citée pour rien),
 * sinon on coupe le rappel (ou le trait) qui colle deux réponses, « A et B »,
 * et on garde la plus longue moitié qui passe seule le validateur avec une
 * seule réponse (T30). `null` : rien ne passe.
 */
export function scinderLien<V extends Version>(
  code: string,
  v: V,
  lien: Lien<V>,
  charge: Charge,
): Lien<V> | null {
  if (lien.reponses.length !== 2) return null;
  const cle = v === "parent" ? "rappel" : "trait";
  const texte = (lien as Record<string, unknown>)[cle] as string;
  const min = v === "parent" ? LONGUEURS.rappel.min : LONGUEURS.trait.min;
  const [a, b] = lien.reponses;
  // Le texte entier avec une seule des deux réponses (l'autre était citée pour rien), puis les coupes.
  const essais: { partie: string; id: string }[] = [
    { partie: texte, id: a },
    { partie: texte, id: b },
  ];
  for (const m of texte.matchAll(/,?\s+et\s+/gu)) {
    const i = m.index ?? 0;
    const gauche = texte.slice(0, i).trim();
    const droite = texte.slice(i + m[0].length).trim();
    essais.push(
      { partie: gauche, id: a },
      { partie: droite, id: b },
      { partie: gauche, id: b },
      { partie: droite, id: a },
    );
  }
  const valides = essais
    .filter((e) => e.partie.length >= min && /^\p{Ll}/u.test(e.partie))
    .map((e) => ({ ...lien, reponses: [e.id], [cle]: e.partie }) as Lien<V>)
    .filter((l) => lienValide(code, v, l, charge));
  if (valides.length === 0) return null;
  const longueur = (l: Lien<V>) => ((l as Record<string, unknown>)[cle] as string).length;
  return valides.reduce((x, y) => (longueur(y) > longueur(x) ? y : x));
}

/** Liens gardés : sans échec, ou coupés (T30) ; les autres sont retirés. */
function liensSains<V extends Version>(
  p: PisteSortie,
  i: number,
  v: V,
  echecs: readonly Echec[],
  charge: Charge,
): { liens: Lien<V>[]; touche: boolean } {
  const depart = (v === "parent" ? p.pourquoi_parent : p.pourquoi_enfant) as Lien<V>[];
  let touche = false;
  const liens: Lien<V>[] = [];
  depart.forEach((l, j) => {
    const fautes = echecsDuLien(echecs, i, v, j);
    if (fautes.length === 0) {
      liens.push(l);
      return;
    }
    touche = true;
    const coupe = scinderLien(p.code, v, l, charge);
    if (coupe) liens.push(coupe);
  });
  return { liens, touche };
}

/**
 * « Pourquoi ça lui ressemble » du parent, réparé : une réponse une seule
 * fois par piste, un lien d'études au plus et en dernier, au plus 700
 * caractères composés en retirant les derniers liens de traits.
 */
function ordonnerParent(liens: LienParent[], charge: Charge): LienParent[] {
  const vus = new Set<string>();
  const uniques = liens.filter((l) => {
    if (l.reponses.some((id) => vus.has(id))) return false;
    for (const id of l.reponses) vus.add(id);
    return true;
  });
  const estContrainte = (l: LienParent) =>
    l.reponses.some((id) => charge.reponses.get(id)?.contrainte === true);
  const traits = uniques.filter((l) => !estContrainte(l));
  const etudes = uniques.filter(estContrainte).slice(0, 1);
  while (
    traits.length > 2 &&
    composerPourquoi([...traits, ...etudes]).length > 700 + MARGE_LONGUEUR
  )
    traits.pop();
  return [...traits, ...etudes];
}

/**
 * Ponctuation rendue (passe qualité de 2.4) : le modèle recopie la citation
 * sans ses virgules (« sa plus grande fierté c'est… », « tu aimes bricoler
 * construire réparer »). Quand le rappel (ou le trait) commence par tous les
 * mots de la citation (ou du trait de la table), ce début est remplacé par le
 * texte d'origine, ponctuation comprise. Aucun mot n'est ajouté ni retiré.
 */
export function reponctuer<L extends LienParent | LienEnfant>(
  lien: L,
  cle: "rappel" | "trait",
  charge: Charge,
): L {
  const texte = (lien as Record<string, unknown>)[cle] as string;
  const sources = lien.reponses
    .map((id) => charge.reponses.get(id))
    .map((r) => (cle === "rappel" ? r?.citation : r?.trait_enfant))
    .filter((t): t is string => t !== undefined)
    .map((t) => minusculeInitiale(traitSansDeuxPoints(t)))
    .sort((a, b) => b.length - a.length);
  const motsTexte = [...texte.matchAll(/[\p{L}\p{N}]+/gu)];
  for (const source of sources) {
    const n = mots(source).length;
    if (n === 0 || motsTexte.length < n) continue;
    if (mots(texte).slice(0, n).join(" ") !== mots(source).join(" ")) continue;
    const dernier = motsTexte[n - 1];
    const fin = (dernier.index ?? 0) + dernier[0].length;
    const suite = texte.slice(fin);
    // La source finit par sa propre ponctuation éventuelle ; la suite garde la sienne.
    return { ...lien, [cle]: `${source}${suite}` };
  }
  return lien;
}

// ---------------------------------------------------------------------------
// Une piste, puis le bilan
// ---------------------------------------------------------------------------

/**
 * `parentAuGabarit` : le « pourquoi » parent réparé n'a pas deux liens de
 * traits ; le gabarit est essayé, et le meilleur des deux gardé (plus de
 * liens de traits ; à égalité, le texte du modèle).
 */
type PisteReparee = { piste: PisteTravail; touches: string[]; parentAuGabarit: boolean };

/** Liens de traits (hors lien sur la durée des études). */
export function traits(liens: readonly LienParent[], charge: Charge): number {
  return liens.filter((l) => !l.reponses.some((id) => charge.reponses.get(id)?.contrainte === true))
    .length;
}

/** Répare une piste du modèle ; le « pourquoi » parent au gabarit est écrit plus tard (T15). */
function reparerPiste(p: PisteSortie, i: number, charge: Charge): PisteReparee {
  const candidat = charge.candidats.get(p.code);
  if (!candidat) throw new Error(`Piste ${p.code} absente de la présélection`);
  const echecs = echecsPiste(p, i, charge);
  const touches: string[] = [];

  const parent = liensSains(p, i, "parent", echecs, charge);
  const parentLiens = ordonnerParent(parent.liens, charge).map((l) =>
    reponctuer(l, "rappel", charge),
  );
  const enfantSain = liensSains(p, i, "enfant", echecs, charge);
  const enfant = {
    ...enfantSain,
    liens: enfantSain.liens.map((l) => reponctuer(l, "trait", charge)),
  };
  const essai: PisteSortie = { ...p, pourquoi_parent: parentLiens, pourquoi_enfant: enfant.liens };
  const apres = echecsPiste(essai, i, charge);
  const parentAuGabarit = echecsDuChamp(apres, i, "pourquoi_parent").length > 0;
  // Sans l'exigence de deux liens (règle des gabarits), le texte réparé du modèle passe-t-il ?
  const parentSouple =
    traits(parentLiens, charge) >= 1 &&
    echecsDuChamp(echecsPiste(essai, i, charge, { gabarit: true }), i, "pourquoi_parent").length ===
      0;
  const enfantAuGabarit =
    enfant.liens.length < 2 || echecsDuChamp(apres, i, "pourquoi_enfant").length > 0;
  const parentTouche = parent.touche || parentLiens.length !== parent.liens.length;
  if (parentTouche || parentAuGabarit) touches.push(`${p.code}.pourquoi_parent`);
  if (enfant.touche || enfantAuGabarit) touches.push(`${p.code}.pourquoi_enfant`);

  const msFautif = echecsDuChamp(echecs, i, "metier_simplement").length > 0;
  const iaFautive = echecsDuChamp(echecs, i, "ia_phrase").length > 0;
  if (msFautif) touches.push(`${p.code}.metier_simplement`);
  if (iaFautive) touches.push(`${p.code}.ia_phrase`);

  const msRepare = msFautif ? sansPhraseFautive(p, i, charge) : p.metier_simplement;
  const piste: PisteTravail = {
    code: p.code,
    metierSimplement: candidat.simplementPreRedige
      ? { texte: candidat.simplementPreRedige, origine: "pre_redige" }
      : msRepare === null
        ? metierSimplementDe(charge, p.code)
        : { texte: msRepare, origine: "llm" },
    iaPhrase: iaFautive ? "" : p.ia_phrase,
    parent: { liens: parentAuGabarit && !parentSouple ? [] : parentLiens, origine: "llm" },
    enfant: enfantAuGabarit
      ? { liens: liensEnfantGabarit(candidat, charge), origine: "gabarit" }
      : { liens: enfant.liens, origine: "llm" },
    raisonDuChoix:
      echecsDuChamp(echecs, i, "raison_du_choix").length > 0 ? null : p.raison_du_choix,
  };
  return { piste, touches, parentAuGabarit };
}

/**
 * « Le métier, simplement » fautif : le texte du modèle sans l'une de ses
 * phrases (la dernière d'abord), s'il passe ainsi le validateur (deux phrases
 * et 140 caractères au moins). `null` : aucune ne suffit.
 */
function sansPhraseFautive(p: PisteSortie, i: number, charge: Charge): string | null {
  const liste = phrases(p.metier_simplement);
  for (let k = liste.length - 1; k >= 0; k--) {
    const texte = liste.filter((_, j) => j !== k).join(" ");
    const essai = { ...p, metier_simplement: texte };
    if (echecsDuChamp(echecsPiste(essai, i, charge), i, "metier_simplement").length === 0)
      return texte;
  }
  return null;
}

/** Une piste ajoutée par le calcul (trio partiel) : tout au gabarit. */
function pisteDuCalcul(code: string, charge: Charge): PisteReparee {
  const candidat = charge.candidats.get(code);
  if (!candidat) throw new Error(`Piste ${code} absente de la présélection`);
  return {
    piste: {
      code,
      metierSimplement: metierSimplementDe(charge, code),
      iaPhrase: "",
      parent: { liens: [], origine: "gabarit" },
      enfant: { liens: liensEnfantGabarit(candidat, charge), origine: "gabarit" },
      raisonDuChoix: null,
    },
    touches: [`${code}.piste`],
    parentAuGabarit: true,
  };
}

/**
 * Le conseil réparé à partir d'une sortie validée (§7.2, passe qualité) :
 * trio partiel si le choix est fautif, réparation de chaque piste, puis
 * contrôle d'ensemble (T15, T28, T33). Une piste qui ne garde pas deux liens
 * expliquables, même au gabarit, est remplacée par un candidat du calcul
 * (trio partiel), tant qu'il reste une piste du modèle. `null` : repli total.
 */
export function reparer(charge: Charge, sortie: SortieLlm, echecs: readonly Echec[]): Mixte | null {
  // D'abord des pistes du calcul qui ont un lien de trait ; à défaut, comme le calcul seul.
  return (
    essaiReparation(charge, sortie, echecs, true) ?? essaiReparation(charge, sortie, echecs, false)
  );
}

function essaiReparation(
  charge: Charge,
  sortie: SortieLlm,
  echecs: readonly Echec[],
  traitExigeDuCalcul: boolean,
): Mixte | null {
  const codes = sortie.pistes.map((p) => p.code);
  const exclues = new Set<string>();
  const tours = charge.envoi.candidats.length + charge.envoi.nombre_de_pistes;
  for (let tour = 0; tour < tours; tour++) {
    let gardees: PisteSortie[] = sortie.pistes;
    let ajoutees: string[] = [];
    if (exclues.size > 0 || echecs.some((e) => e.nature === "choix")) {
      const trio = trioPartiel(charge, codes, exclues);
      if (trio === null) return null;
      gardees = trio.garder.map((c) => sortie.pistes[codes.indexOf(c)]);
      ajoutees = trio.ajouter;
    }
    const essai = assemblerPistes(charge, gardees, ajoutees, codes, traitExigeDuCalcul);
    if (typeof essai === "string") {
      exclues.add(essai);
      continue;
    }
    return {
      ...essai,
      completees: ajoutees,
      analyseFautive: echecs.some((e) => e.champ === "analyse"),
    };
  }
  return null;
}

/** Les pistes réparées, ou le code d'une piste sans deux liens expliquables. */
function assemblerPistes(
  charge: Charge,
  gardees: readonly PisteSortie[],
  ajoutees: readonly string[],
  codes: readonly string[],
  traitExigeDuCalcul: boolean,
): { pistes: PisteTravail[]; remplaces: string[] } | string {
  const reparees = [
    ...gardees.map((p) => reparerPiste(p, codes.indexOf(p.code), charge)),
    ...ajoutees.map((c) => pisteDuCalcul(c, charge)),
  ];
  const pistes = reparees.map((r) => r.piste);
  const remplaces = reparees.flatMap((r) => r.touches);

  // Les « pourquoi » parent au gabarit évitent les réponses déjà citées deux fois ailleurs (T15).
  // Un lien de trait au moins, du modèle ou du gabarit : sinon la piste est remplacée.
  for (const [k, r] of reparees.entries()) {
    if (!r.parentAuGabarit) continue;
    const candidat = charge.candidats.get(r.piste.code);
    if (!candidat) return r.piste.code;
    const autres = pistes.filter((_, j) => j !== k && !reparees[j].parentAuGabarit).map(versSortie);
    const liens = liensParentGabarit(candidat, charge, { interdites: reponsesSaturees(autres) });
    const duModele = traits(r.piste.parent.liens, charge);
    const duCalcul = ajoutees.includes(r.piste.code);
    if (traits(liens, charge) > duModele || duCalcul)
      r.piste.parent = { liens, origine: "gabarit" };
    if (traits(r.piste.parent.liens, charge) === 0 && (!duCalcul || traitExigeDuCalcul))
      return r.piste.code;
  }

  const fautive = ensembleRepare(charge, pistes, remplaces);
  if (fautive !== null) return fautive;
  return { pistes, remplaces: [...new Set(remplaces)] };
}

/** Contrôle d'ensemble après le mélange (T15, T28, T33). Le code d'une piste irréparable, ou `null`. */
function ensembleRepare(
  charge: Charge,
  pistes: PisteTravail[],
  remplaces: string[],
): string | null {
  for (let tour = 0; tour < 12; tour++) {
    const ensemble = echecsEnsemble(pistes.map(versSortie));
    if (ensemble.length === 0) return null;
    const t15 = ensemble.find((e) => e.code === "T15");
    if (t15) {
      const fautive = retirerT15(charge, pistes, remplaces, t15);
      if (fautive !== null) return fautive;
      continue;
    }
    let change = false;
    for (const e of ensemble) {
      const m = CHAMP_PISTE.exec(e.champ);
      if (!m) continue;
      const p = pistes[Number(m[1])];
      const candidat = charge.candidats.get(p.code);
      if (!candidat) continue;
      let fait = false;
      if (e.code === "T33" && p.iaPhrase !== "") {
        p.iaPhrase = "";
        fait = true;
      } else if (m[2] === "metier_simplement" && p.metierSimplement.origine === "llm") {
        p.metierSimplement = metierSimplementDe(charge, p.code);
        fait = true;
      } else if (m[2] === "pourquoi_enfant" && p.enfant.origine === "llm") {
        p.enfant = { liens: liensEnfantGabarit(candidat, charge), origine: "gabarit" };
        fait = true;
      } else if (m[2] === "pourquoi_parent" && p.parent.origine === "llm") {
        const autres = pistes.filter((x) => x !== p).map(versSortie);
        const liens = liensParentGabarit(candidat, charge, {
          interdites: reponsesSaturees(autres),
        });
        if (traits(liens, charge) === 0) return p.code;
        p.parent = { liens, origine: "gabarit" };
        fait = true;
      }
      if (fait) {
        change = true;
        remplaces.push(`${p.code}.${m[2]}`);
      }
    }
    // T28 entre deux gabarits : gardé (§7.3, critique 2, R4).
    if (!change) return null;
  }
  return null;
}

/**
 * T15 : la réponse est retirée de la piste qui a le plus de liens, en partant
 * de la fin, s'il lui reste deux liens de traits, ou à défaut un ; sinon la
 * dernière piste du modèle qui la cite passe au gabarit. Le code d'une piste
 * irréparable, ou `null`.
 */
function retirerT15(
  charge: Charge,
  pistes: PisteTravail[],
  remplaces: string[],
  e: Echec,
): string | null {
  const id = e.reponse;
  const citant = pistes
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => id !== undefined && p.parent.liens.some((l) => l.reponses.includes(id)))
    .sort((a, b) => b.p.parent.liens.length - a.p.parent.liens.length || b.i - a.i);
  if (id === undefined || citant.length === 0) return pistes[pistes.length - 1].code;
  const restants = (p: PisteTravail) =>
    traits(
      p.parent.liens.filter((l) => !l.reponses.includes(id)),
      charge,
    );
  const choix =
    citant.find(({ p }) => restants(p) >= 2) ?? citant.find(({ p }) => restants(p) >= 1);
  if (choix) {
    const p = choix.p;
    p.parent = {
      liens: p.parent.liens.filter((l) => !l.reponses.includes(id)),
      origine: p.parent.origine,
    };
    remplaces.push(`${p.code}.pourquoi_parent`);
    return null;
  }
  const derniere = citant.find(({ p }) => p.parent.origine === "llm")?.p ?? citant[0].p;
  const candidat = charge.candidats.get(derniere.code);
  if (!candidat || derniere.parent.origine === "gabarit") return derniere.code;
  const autres = pistes.filter((p) => p !== derniere).map(versSortie);
  const liens = liensParentGabarit(candidat, charge, { interdites: reponsesSaturees(autres) });
  if (traits(liens, charge) === 0) return derniere.code;
  derniere.parent = { liens, origine: "gabarit" };
  remplaces.push(`${derniere.code}.pourquoi_parent`);
  return null;
}

/** Nombre de champs visibles au gabarit (« pourquoi » parent et enfant, « Le métier, simplement »). */
export function champsAuGabarit(m: Mixte): number {
  return m.pistes.reduce(
    (n, p) =>
      n +
      Number(p.parent.origine === "gabarit") +
      Number(p.enfant.origine === "gabarit") +
      Number(p.metierSimplement.origine === "gabarit"),
    0,
  );
}

/**
 * Le meilleur de deux conseils réparés : un trio du modèle plutôt qu'un trio
 * partiel, puis le moins de champs au gabarit, puis le plus de liens du modèle.
 */
export function meilleur(a: Mixte | null, b: Mixte | null): Mixte | null {
  if (a === null) return b;
  if (b === null) return a;
  const cout = (m: Mixte) => [
    m.completees.length,
    champsAuGabarit(m),
    -m.pistes.reduce(
      (n, p) =>
        n +
        (p.parent.origine === "llm" ? p.parent.liens.length : 0) +
        (p.enfant.origine === "llm" ? p.enfant.liens.length : 0),
      0,
    ),
  ];
  const [x, y] = [cout(a), cout(b)];
  for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) return x[k] < y[k] ? a : b;
  return a;
}
