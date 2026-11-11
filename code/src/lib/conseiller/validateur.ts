/**
 * Le validateur (conseiller-ia.md §6) : contrôle tout texte du LLM, et les
 * gabarits avec les mêmes règles. Fonction pure, sans réseau.
 *
 * - V01 à V09 : le choix des pistes (un échec après la relance : trio
 *   partiel, ou repli total) ;
 * - T01 à T33 : les textes (après la relance : réparation par le code, ou
 *   repli par champ). T30 à T33 viennent de la passe qualité de 2.4.
 *
 * Les messages sont écrits pour le modèle (§4.3) ; ils ne sont jamais journalisés.
 */
import { CONSTANTES } from "@/lib/moteur/constantes";
import { coeurSatisfait, compatibles } from "@/lib/moteur/selection";
import { detecterSante } from "@/lib/questionnaire/textes-libres";
import { detecterTics } from "@/lib/tics-ia";
import { composerPourquoi, phraseEnfant } from "./composer";
import {
  ATTRIBUTION,
  DETAILS_METIER,
  EQUIVALENTS,
  FORMULES_INTERDITES,
  IA_INTERDITS,
  IA_MOT_REPETITIF,
  LEXIQUE_DIPLOMES,
  LEXIQUE_ORGANISMES,
  MOTS_OUTILS,
  MOTS_TU,
  MOTS_VOUS,
  NOMBRES_EN_LETTRES,
  NOMS_EQUIPE,
  SIGLES_DIPLOMES,
  SIGLES_ORGANISMES,
  SYMBOLES_INTERDITS,
  TRAITS_NEGATIFS_EXPRESSIONS,
  TRAITS_NEGATIFS_PREFIXES,
  UNITES_NOMBRE,
  UNITES_TOUS_LES,
  VERBES_ENCADREMENT,
} from "./lexiques";
import { LONGUEURS, MARGE_LONGUEUR, sortieSchemaPour } from "./schema";
import {
  apostrophes,
  contientExpression,
  contientNegation,
  mots,
  negationTrouvee,
  normaliser,
  phrases,
} from "./texte";
import type {
  CandidatInterne,
  Charge,
  CodeEchec,
  Echec,
  LienEnfant,
  LienParent,
  PisteSortie,
  ReponseEnvoyee,
  SortieLlm,
} from "./types";

export type OptionsValidation = {
  /** `finish_reason` de l'API : « longueur » est un échec V01. */
  fin?: "complete" | "longueur" | "refus";
  /**
   * Sortie des gabarits (calcul seul, critique 2, R4) : pour un texte
   * d'origine gabarit, T11 ne contrôle que la longueur maximale du texte
   * composé ; T14 n'exige pas deux liens ; V08 ne s'applique pas.
   */
  gabarit?: boolean;
};

export type ResultatValidation = { echecs: Echec[]; sortie: SortieLlm | null };

const CHOIX = new Set<CodeEchec>(["V01", "V02", "V03", "V04", "V05", "V06", "V07", "V08", "V09"]);

function echec(
  code: CodeEchec,
  champ: string,
  message: string,
  piste?: string,
  codes?: string[],
): Echec {
  return {
    code,
    nature: CHOIX.has(code) ? "choix" : "texte",
    champ,
    ...(piste !== undefined && { piste }),
    message,
    ...(codes !== undefined && { codes }),
  };
}

const guillemets = (t: string) => `« ${t} »`;

// ---------------------------------------------------------------------------
// Fidélité (T04)
// ---------------------------------------------------------------------------

/** Mots à contrôler : 4 lettres ou plus, hors mots outils. */
export function motsAControler(texte: string): string[] {
  return mots(texte).filter((m) => m.length >= 4 && !MOTS_OUTILS.has(m) && !/^\d+$/.test(m));
}

/** Même mot : mêmes 5 premières lettres, ou identique si l'un des deux en a moins de 5. */
export function memeMot(a: string, b: string): boolean {
  if (a.length < 5 || b.length < 5) return a === b;
  return a.slice(0, 5) === b.slice(0, 5);
}

function retrouve(mot: string, vocabulaire: readonly string[]): boolean {
  return vocabulaire.some((v) => memeMot(mot, v));
}

/** Propositions d'un texte : segments découpés sur `:`, `,` et `;` (critique 2, R3). */
function propositions(texte: string): string[] {
  return texte
    .split(/[:,;]/)
    .map((p) => p.trim())
    .filter((p) => p !== "");
}

/**
 * Vocabulaire d'un lien (§6.3). Pour un rappel sans négation, les
 * propositions négatives des réponses citées sont retirées (polarité dans les
 * deux sens, critique 2, R3). Pour un trait, le champ libre n'apporte que son texte.
 */
export function vocabulaire(
  reponses: readonly ReponseEnvoyee[],
  pour: "rappel" | "trait",
  positifSeul: boolean,
): string[] {
  const sources: string[] = [];
  for (const r of reponses) {
    const libre = r.texte !== undefined && r.reponse === undefined;
    if (pour === "rappel" || !libre) {
      if (r.citation) sources.push(r.citation);
    }
    if (r.reponse) sources.push(r.reponse);
    if (r.texte) sources.push(r.texte);
    if (pour === "trait" && r.trait_enfant) sources.push(r.trait_enfant);
  }
  const textes = positifSeul
    ? sources.flatMap((s) => propositions(s).filter((p) => !contientNegation(p)))
    : sources;
  const vocab = new Set(textes.flatMap((t) => mots(t)));
  for (const m of [...vocab]) for (const e of EQUIVALENTS[m] ?? []) vocab.add(e);
  return [...vocab];
}

/**
 * Mots porteurs d'une réponse écrite repris dans le rappel (ou le trait),
 * hors mots de l'amorce (§6.3) : celle du parent, ou celle de l'enfant.
 */
function porteursRepris(
  rappel: string,
  r: ReponseEnvoyee,
  amorceTexte: string | undefined = r.citation,
): { repris: number; possibles: number } {
  const amorce = amorceTexte ? mots(amorceTexte) : [];
  const texte = motsAControler(r.texte ?? "").filter((m) => !retrouve(m, amorce));
  const repris = new Set(
    motsAControler(rappel).filter((m) => !retrouve(m, amorce) && retrouve(m, texte)),
  );
  return { repris: repris.size, possibles: new Set(texte).size };
}

// ---------------------------------------------------------------------------
// Nombres (T05, T24)
// ---------------------------------------------------------------------------

export type Nombres = { valeurs: number[]; bac: number[]; symboles: string[] };

const BAC_PLUS = /bac\s*\+\s*(\d+)/giu;

/** Nombres d'un texte (§6.3) : chiffres, nombres en lettres devant une unité, « bac + N ». */
export function extraireNombres(texte: string): Nombres {
  const symboles = SYMBOLES_INTERDITS.flatMap((motif) => {
    const m = texte.match(motif);
    return m ? [m[0]] : [];
  });
  const bac = [...texte.matchAll(BAC_PLUS)].map((m) => Number(m[1]));
  const sansBac = texte.replace(BAC_PLUS, " ");
  const valeurs = [...sansBac.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) =>
    Number(m[0].replace(",", ".")),
  );
  const liste = mots(sansBac);
  liste.forEach((m, i) => {
    const n = NOMBRES_EN_LETTRES[m];
    if (n !== undefined && UNITES_NOMBRE.has(liste[i + 1] ?? "")) valeurs.push(n);
  });
  return { valeurs, bac, symboles };
}

function nombresPermis(textes: readonly string[]): Set<number> {
  const permis = new Set<number>();
  for (const t of textes) {
    const n = extraireNombres(t);
    for (const v of [...n.valeurs, ...n.bac]) permis.add(v);
  }
  return permis;
}

// ---------------------------------------------------------------------------
// Lexiques (T06, T07, T08, T10, T20)
// ---------------------------------------------------------------------------

function sigleRegex(sigle: string): RegExp {
  const echappe = sigle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\d])${echappe}(?![\\p{L}\\d])`, "u");
}

/** Termes d'un lexique trouvés dans le texte, hors exception (§6.2). */
function termesInterdits(
  texte: string,
  lexique: readonly string[],
  sigles: readonly string[],
  permisNormalise: string,
): string[] {
  const n = normaliser(texte);
  const trouves = lexique.filter((t) => contientExpression(n, t));
  for (const s of sigles) if (sigleRegex(s).test(texte)) trouves.push(s);
  return trouves.filter((t) => !contientExpression(permisNormalise, normaliser(t)));
}

/** Formules interdites (T10), dont « tous les » hors unité de temps. */
function formulesInterdites(texte: string, permisNormalise: string): string[] {
  const n = normaliser(texte);
  const trouves = FORMULES_INTERDITES.filter((f) => contientExpression(n, f));
  const liste = n.split(" ");
  liste.forEach((m, i) => {
    if ((m === "tous" || m === "toutes") && liste[i + 1] === "les") {
      if (!UNITES_TOUS_LES.has(liste[i + 2] ?? ""))
        trouves.push(`${m} les ${liste[i + 2] ?? ""}`.trim());
    }
  });
  return trouves.filter((f) => !contientExpression(permisNormalise, f));
}

/**
 * Noms propres (T08) : un mot à majuscule initiale hors début de phrase, ou
 * tout sigle de deux capitales ou plus, doit figurer dans la liste permise.
 */
function nomsPropres(
  texte: string,
  permis: ReadonlySet<string>,
  debutEstPhrase: boolean,
): string[] {
  const trouves: string[] = [];
  for (const m of texte.matchAll(/\p{L}+/gu)) {
    const mot = m[0];
    const i = m.index ?? 0;
    const sigle = /^\p{Lu}{2,}$/u.test(mot) || /^\p{Lu}{2,}\p{Ll}*$/u.test(mot);
    const majuscule = /^\p{Lu}/u.test(mot);
    // Une lettre seule n'est pas un nom propre (« de A à Z », « L'IA »).
    if (!majuscule || mot.length === 1) continue;
    const avant = texte.slice(0, i);
    const debut =
      (debutEstPhrase && /^[\s«"(]*$/u.test(avant)) || /[.?…!]\s*[«"(]?\s*$/u.test(avant);
    if (!sigle && debut) continue;
    if (/['’]$/.test(avant) && !sigle) continue; // « L'Hôpital » : la majuscule suit une élision en début de phrase
    if (!permis.has(mot)) trouves.push(mot);
  }
  return trouves;
}

/** « Région » avec sa majuscule hors début de phrase (T07) ; « dans sa région » passe. */
function regionHorsDebut(texte: string, debutEstPhrase: boolean): boolean {
  for (const m of texte.matchAll(/Région/gu)) {
    const avant = texte.slice(0, m.index ?? 0);
    const debut = (debutEstPhrase && /^[\s«"(]*$/u.test(avant)) || /[.?…!]\s*$/u.test(avant);
    if (!debut) return true;
  }
  return false;
}

function motsMajuscules(textes: readonly string[]): Set<string> {
  const ensemble = new Set<string>(["IA"]);
  for (const t of textes)
    for (const m of t.matchAll(/\p{L}+/gu)) if (/^\p{Lu}/u.test(m[0])) ensemble.add(m[0]);
  return ensemble;
}

function contientUnDesMots(
  texte: string,
  liste: readonly string[],
  permis: readonly string[] = [],
): string | null {
  const ensemble = new Set(mots(texte));
  const exceptions = new Set(permis);
  return liste.find((m) => ensemble.has(m) && !exceptions.has(m)) ?? null;
}

// ---------------------------------------------------------------------------
// Contexte d'une piste
// ---------------------------------------------------------------------------

type ContextePiste = {
  i: number;
  code: string;
  candidat: CandidatInterne;
  textesFaits: string[];
  permisFaits: string;
  majusculesFaits: Set<string>;
  nombresFaits: Set<number>;
  nombresPiste: Set<number>;
  niveauxBac: Set<number>;
};

function reponsesDe(ids: readonly string[], charge: Charge): ReponseEnvoyee[] {
  return ids.flatMap((id) => {
    const r = charge.reponses.get(id);
    return r ? [r] : [];
  });
}

function texteReponse(r: ReponseEnvoyee): string {
  return [r.citation, r.reponse, r.texte].filter(Boolean).join(" . ");
}

function contextePiste(piste: PisteSortie, i: number, candidat: CandidatInterne, charge: Charge) {
  const textesFaits = [...candidat.envoye.faits.map((f) => f.texte), candidat.libelle];
  const citees = reponsesDe(
    [...piste.pourquoi_parent, ...piste.pourquoi_enfant].flatMap((l) => l.reponses),
    charge,
  );
  const nombresFaits = nombresPermis(candidat.envoye.faits.map((f) => f.texte));
  const nombresPiste = new Set([...nombresFaits, ...nombresPermis(citees.map(texteReponse))]);
  const niveauxBac = new Set<number>([candidat.bacPlus]);
  if (candidat.bacPlusMax !== null) niveauxBac.add(candidat.bacPlusMax);
  return {
    i,
    code: piste.code,
    candidat,
    textesFaits,
    permisFaits: normaliser(textesFaits.join(" . ")),
    majusculesFaits: motsMajuscules(textesFaits),
    nombresFaits,
    nombresPiste,
    niveauxBac,
  } satisfies ContextePiste;
}

// ---------------------------------------------------------------------------
// Contrôles communs à tout texte du LLM
// ---------------------------------------------------------------------------

type Champ = {
  texte: string;
  champ: string;
  piste?: string;
  /** Texte normalisé où un terme interdit est permis (exception commune). */
  permis: string;
  majuscules: ReadonlySet<string>;
  /** Nombres permis ; `null` : pas de contrôle T05 (seuls les symboles le sont). */
  nombres: ReadonlySet<number> | null;
  niveauxBac: ReadonlySet<number> | null;
  debutEstPhrase: boolean;
};

function controlesCommuns(c: Champ, prenom: string | null, echecs: Echec[]): void {
  const { texte, champ, piste } = c;
  if (texte.trim() === "") return;
  const lieu = piste ? `Piste ${piste}, ${champ}` : champ;
  // T05
  const n = extraireNombres(texte);
  if (n.symboles.length > 0) {
    echecs.push(
      echec(
        "T05",
        champ,
        `${lieu} : ${guillemets(n.symboles[0])} est interdit : pas de montant ni de pourcentage. Retire-le.`,
        piste,
      ),
    );
  } else if (c.nombres !== null) {
    const hors = n.valeurs.filter((v) => !c.nombres?.has(v));
    const bacHors = n.bac.filter((v) => !(c.niveauxBac?.has(v) ?? false));
    if (hors.length > 0 || bacHors.length > 0) {
      echecs.push(
        echec(
          "T05",
          champ,
          `${lieu} : ${guillemets(texte)} contient un nombre absent des données de la piste. Retire-le.`,
          piste,
        ),
      );
    }
  }
  // T06, T07
  const diplomes = termesInterdits(texte, LEXIQUE_DIPLOMES, SIGLES_DIPLOMES, c.permis);
  if (diplomes.length > 0) {
    echecs.push(
      echec(
        "T06",
        champ,
        `${lieu} : ${guillemets(diplomes[0])} nomme un diplôme ou une formation. Le site les affiche lui-même : retire-le.`,
        piste,
      ),
    );
  }
  const organismes = termesInterdits(texte, LEXIQUE_ORGANISMES, SIGLES_ORGANISMES, c.permis);
  const region = regionHorsDebut(texte, c.debutEstPhrase) && !c.majuscules.has("Région");
  if (organismes.length > 0 || region) {
    echecs.push(
      echec(
        "T07",
        champ,
        `${lieu} : ${guillemets(organismes[0] ?? "Région")} nomme un organisme. Retire-le.`,
        piste,
      ),
    );
  }
  // T08
  const propres = nomsPropres(texte, c.majuscules, c.debutEstPhrase);
  if (propres.length > 0) {
    echecs.push(
      echec(
        "T08",
        champ,
        `${lieu} : ${guillemets(propres[0])} est un nom propre ou un sigle absent des données. Retire-le.`,
        piste,
      ),
    );
  }
  // T09
  const tics = detecterTics(texte).filter(
    (t) => !contientExpression(c.permis, normaliser(t.extrait)),
  );
  if (tics.length > 0 || texte.includes("!")) {
    echecs.push(
      echec(
        "T09",
        champ,
        `${lieu} : ${guillemets(tics[0]?.extrait ?? "!")} est interdit par les règles de style. Retire-le.`,
        piste,
      ),
    );
  }
  // T10
  const formules = formulesInterdites(texte, c.permis);
  if (formules.length > 0) {
    echecs.push(
      echec(
        "T10",
        champ,
        `${lieu} : ${guillemets(formules[0])} est une formule interdite. Reformule sans elle.`,
        piste,
      ),
    );
  }
  // T26
  controleCrochetsPrenom(texte, champ, piste, prenom, echecs);
}

function controleCrochetsPrenom(
  texte: string,
  champ: string,
  piste: string | undefined,
  prenom: string | null,
  echecs: Echec[],
): void {
  const lieu = piste ? `Piste ${piste}, ${champ}` : champ;
  const p = prenom ? normaliser(prenom) : "";
  if (/[[\]]/.test(texte) || (p !== "" && contientExpression(normaliser(texte), p))) {
    echecs.push(
      echec(
        "T26",
        champ,
        `${lieu} : n'écris ni crochets ni prénom ; dis « il » ou « elle ».`,
        piste,
      ),
    );
  }
}

function controleSante(
  texte: string,
  champ: string,
  piste: string | undefined,
  echecs: Echec[],
): void {
  if (detecterSante(texte)) {
    echecs.push(
      echec(
        "T29",
        champ,
        `${piste ? `Piste ${piste}, ` : ""}${champ} : ${guillemets(texte)} parle de santé ou ressemble à un diagnostic. Retire-le.`,
        piste,
      ),
    );
  }
}

function controleTics(
  texte: string,
  champ: string,
  piste: string | undefined,
  echecs: Echec[],
): void {
  const tics = detecterTics(texte);
  if (tics.length > 0 || texte.includes("!")) {
    echecs.push(
      echec(
        "T09",
        champ,
        `${champ} : ${guillemets(tics[0]?.extrait ?? "!")} est interdit par les règles de style.`,
        piste,
      ),
    );
  }
}

function longueur(
  texte: string,
  min: number | undefined,
  max: number,
  champ: string,
  piste: string | undefined,
  echecs: Echec[],
): void {
  if (texte.length > max || (min !== undefined && texte.length < min)) {
    echecs.push(
      echec(
        "T11",
        champ,
        `${piste ? `Piste ${piste}, ` : ""}${champ} : ${texte.length} caractères, il en faut ${min ?? 0} à ${max}. Ajuste la longueur.`,
        piste,
      ),
    );
  }
}

function format(
  texte: string,
  champ: string,
  piste: string,
  rappel: boolean,
  echecs: Echec[],
): void {
  const fautes: string[] = [];
  if (!/^\p{Ll}/u.test(texte)) fautes.push("il doit commencer par une minuscule");
  if (/[:;]/.test(texte)) fautes.push("pas de deux-points ni de point-virgule");
  if (/[.,]\s*$/.test(texte)) fautes.push("pas de point ni de virgule à la fin");
  if (rappel && /^(?:que\b|qu['’]|vous\b)/iu.test(apostrophes(texte).trim())) {
    fautes.push("il ne commence ni par « que » ni par « vous »");
  }
  if (fautes.length > 0) {
    echecs.push(echec("T12", champ, `Piste ${piste}, ${champ} : ${fautes.join(", ")}.`, piste));
  }
}

// ---------------------------------------------------------------------------
// Liens
// ---------------------------------------------------------------------------

function citableIci(r: ReponseEnvoyee, candidat: CandidatInterne): boolean {
  if (r.citable === true) return true;
  if (r.citable === false) return false;
  return candidat.envoye.drapeaux.includes(r.citable.si_metier);
}

function controleFidelite(
  texte: string,
  citees: readonly ReponseEnvoyee[],
  pour: "rappel" | "trait",
  champ: string,
  piste: string,
  echecs: Echec[],
): void {
  const negatif = contientNegation(texte);
  const vocab = vocabulaire(citees, pour, pour === "trait" || !negatif);
  const manquants = [...new Set(motsAControler(texte).filter((m) => !retrouve(m, vocab)))];
  const ids = citees.map((r) => r.id).join(", ");
  if (manquants.length > 0) {
    const amorces = citees.flatMap((r) =>
      r.texte !== undefined && r.reponse === undefined && r.citation ? mots(r.citation) : [],
    );
    const viennentDeLAmorce = pour === "trait" && manquants.every((m) => retrouve(m, amorces));
    echecs.push(
      echec(
        "T04",
        champ,
        viennentDeLAmorce
          ? `Piste ${piste}, ${champ} : ${manquants.map(guillemets).join(", ")} viennent du début de phrase de la question, pas des mots du parent. Écris le trait avec ses mots à lui seulement (par exemple « tu démontes des scooters »).`
          : `Piste ${piste}, ${champ} : ${manquants.map(guillemets).join(", ")} ne figurent pas dans les réponses citées (${ids}). Ajoute la réponse qui contient ces mots, ou retire-les.`,
        piste,
      ),
    );
    return;
  }
  if (pour === "rappel" && negatif && !citees.some((r) => contientNegation(texteReponse(r)))) {
    echecs.push(
      echec(
        "T04",
        champ,
        `Piste ${piste}, ${champ} : le rappel est négatif (${guillemets(negationTrouvee(texte) ?? "")}), la réponse citée ne l'est pas. Rapporte la réponse dans son sens.`,
        piste,
      ),
    );
    return;
  }
  // Une réponse écrite : l'amorce seule ne suffit pas, il faut au moins deux mots du parent.
  for (const r of citees) {
    if (r.texte === undefined || r.reponse !== undefined) continue;
    const { repris, possibles } = porteursRepris(
      texte,
      r,
      pour === "rappel" ? r.citation : r.trait_enfant,
    );
    if (repris < Math.min(2, possibles)) {
      echecs.push(
        echec(
          "T04",
          champ,
          `Piste ${piste}, ${champ} : ${pour === "rappel" ? "le rappel" : "le trait"} cite ${r.id} sans reprendre les mots du parent. Reprends au moins deux mots de ce qu'il a écrit.`,
          piste,
        ),
      );
      return;
    }
  }
}

/**
 * T30 (passe qualité de 2.4) : un lien dit une seule chose. Deux réponses ne
 * vont ensemble que si l'une est la précision écrite de la case de l'autre
 * (« temps_libre=bricoler » et « temps_libre_precis »).
 */
function controleUneReponse(
  ids: readonly string[],
  champ: string,
  piste: string,
  charge: Charge,
  echecs: Echec[],
): void {
  if (ids.length < 2) return;
  const [a, b] = ids.map((id) => charge.reponses.get(id));
  const libre = (r: ReponseEnvoyee | undefined) =>
    r?.texte !== undefined && r.reponse === undefined;
  const memeQuestion =
    a !== undefined &&
    b !== undefined &&
    libre(a) !== libre(b) &&
    charge.questions.get(a.id) === charge.questions.get(b.id);
  if (!memeQuestion) {
    echecs.push(
      echec(
        "T30",
        champ,
        `Piste ${piste}, ${champ} : ${ids.join(" et ")} sont deux réponses différentes. Un lien cite une seule réponse : garde la plus parlante pour ce métier.`,
        piste,
      ),
    );
  }
}

/** Le texte nomme-t-il ce détail (mot entier, ou préfixe d'un mot pour un mot seul) ? */
function nomme(motsTexte: readonly string[], normalise: string, expression: string): boolean {
  return expression.includes(" ")
    ? contientExpression(normalise, expression)
    : motsTexte.some((m) => m.startsWith(expression));
}

/**
 * T31 (passe qualité de 2.4) : un lieu, un véhicule, une posture ou un
 * horaire que le texte affirme doit se lire dans un fait de la piste.
 */
function controleDetailsMetier(
  texte: string,
  champ: string,
  ctx: ContextePiste,
  echecs: Echec[],
): void {
  if (texte.trim() === "") return;
  const n = normaliser(texte);
  const motsTexte = n.split(" ");
  const motsFaits = ctx.permisFaits.split(" ");
  for (const d of DETAILS_METIER) {
    if (!d.dit.some((x) => nomme(motsTexte, n, x))) continue;
    if (d.appuis.some((x) => nomme(motsFaits, ctx.permisFaits, x))) continue;
    echecs.push(
      echec(
        "T31",
        champ,
        `Piste ${ctx.code}, ${champ} : « ${d.nom} » n'est dans aucun fait de ce métier. N'ajoute aucun lieu, objet, posture ou horaire absent des faits.`,
        ctx.code,
      ),
    );
    return;
  }
}

/**
 * T32 (passe qualité de 2.4) : un métier est écarté parce qu'on y dirige une
 * équipe ; un lien qui met en avant la direction d'une équipe contredirait
 * cette raison, affichée juste en dessous.
 */
function controleEncadrement(
  texte: string,
  champ: string,
  ctx: ContextePiste,
  charge: Charge,
  echecs: Echec[],
): void {
  if (!charge.ecartes.some((e) => e.motif === "encadrement")) return;
  const liste = mots(texte);
  const trouve = liste.some(
    (m, i) =>
      VERBES_ENCADREMENT.some((v) => m.startsWith(v)) &&
      liste.slice(i + 1, i + 7).some((x) => NOMS_EQUIPE.includes(x)),
  );
  if (trouve) {
    echecs.push(
      echec(
        "T32",
        champ,
        `Piste ${ctx.code}, ${champ} : un métier est écarté parce qu'on y dirige une équipe ; ne mets pas en avant la direction d'une équipe. Choisis un autre fait du métier.`,
        ctx.code,
      ),
    );
  }
}

function controleLienParent(
  lien: LienParent,
  j: number,
  ctx: ContextePiste,
  charge: Charge,
  echecs: Echec[],
): void {
  const base = `pistes[${ctx.i}].pourquoi_parent[${j}]`;
  const { code, candidat } = ctx;
  const inconnues = lien.reponses.filter((id) => !charge.reponses.has(id));
  if (inconnues.length > 0) {
    echecs.push(
      echec(
        "T01",
        `${base}.reponses`,
        `Piste ${code}, lien ${j + 1} : ${inconnues.join(", ")} ne fait pas partie des réponses. Cite uniquement les identifiants de « reponses ».`,
        code,
      ),
    );
    return;
  }
  const citees = reponsesDe(lien.reponses, charge);
  const nonCitables = citees.filter((r) => !citableIci(r, candidat));
  if (nonCitables.length > 0) {
    echecs.push(
      echec(
        "T02",
        `${base}.reponses`,
        `Piste ${code}, lien ${j + 1} : ${nonCitables[0].id} n'est pas citable pour ce métier. Choisis une autre réponse.`,
        code,
      ),
    );
  }
  const fautifs = lien.faits.filter((f) => !f.startsWith(`${code}.`));
  if (fautifs.length > 0) {
    echecs.push(
      echec(
        "T03",
        `${base}.faits`,
        `Piste ${code}, lien ${j + 1} : ${fautifs.join(", ")} n'est pas un fait de ce métier.`,
        code,
      ),
    );
  }
  format(lien.rappel, `${base}.rappel`, code, true, echecs);
  format(lien.metier, `${base}.metier`, code, false, echecs);
  controleUneReponse(lien.reponses, `${base}.reponses`, code, charge, echecs);
  controleFidelite(lien.rappel, citees, "rappel", `${base}.rappel`, code, echecs);
  controleDetailsMetier(lien.metier, `${base}.metier`, ctx, echecs);
  controleEncadrement(lien.metier, `${base}.metier`, ctx, charge, echecs);
  const permisReponses = normaliser(citees.map(texteReponse).join(" . "));
  const majReponses = motsMajuscules([...citees.map(texteReponse), candidat.libelle]);
  controlesCommuns(
    {
      texte: lien.rappel,
      champ: `${base}.rappel`,
      piste: code,
      permis: permisReponses,
      majuscules: majReponses,
      nombres: ctx.nombresPiste,
      niveauxBac: ctx.niveauxBac,
      debutEstPhrase: false,
    },
    charge.prenom,
    echecs,
  );
  controlesCommuns(
    {
      texte: lien.metier,
      champ: `${base}.metier`,
      piste: code,
      permis: ctx.permisFaits,
      majuscules: ctx.majusculesFaits,
      nombres: ctx.nombresPiste,
      niveauxBac: ctx.niveauxBac,
      debutEstPhrase: false,
    },
    charge.prenom,
    echecs,
  );
  longueur(
    lien.rappel,
    LONGUEURS.rappel.min,
    LONGUEURS.rappel.max + MARGE_LONGUEUR,
    `${base}.rappel`,
    code,
    echecs,
  );
  longueur(
    lien.metier,
    LONGUEURS.metierParent.min,
    LONGUEURS.metierParent.max + MARGE_LONGUEUR,
    `${base}.metier`,
    code,
    echecs,
  );
  // T13
  const contrainte = citees.some((r) => r.contrainte);
  const etudes = candidat.envoye.etudes;
  if (contrainte && (etudes.condition_experience !== null || etudes.voie_courte_incertaine)) {
    echecs.push(
      echec(
        "T13",
        `${base}.reponses`,
        `Piste ${code} : la voie courte demande une expérience, ou les formations possibles y mènent mal. Remplace le lien sur les études par un lien sur un trait.`,
        code,
      ),
    );
  }
  controleBacMetier(lien.metier, `${base}.metier`, ctx, echecs);
  // T16
  const pronom =
    contientUnDesMots(lien.rappel, [...MOTS_VOUS, ...MOTS_TU]) ??
    contientUnDesMots(lien.metier, [...MOTS_VOUS, ...MOTS_TU], ctx.permisFaits.split(" "));
  if (pronom !== null) {
    echecs.push(
      echec(
        "T16",
        base,
        `Piste ${code}, lien ${j + 1} : ${guillemets(pronom)} ; dans les textes pour le parent, ni « vous » ni « tu ».`,
        code,
      ),
    );
  }
  controleSante(lien.rappel, `${base}.rappel`, code, echecs);
}

function controleBacMetier(
  texte: string,
  champ: string,
  ctx: ContextePiste,
  echecs: Echec[],
): void {
  const bac = extraireNombres(texte).bac.filter((n) => !ctx.niveauxBac.has(n));
  if (bac.length > 0) {
    echecs.push(
      echec(
        "T13",
        champ,
        `Piste ${ctx.code} : « bac + ${bac[0]} » ne correspond pas au niveau d'accès de ce métier.`,
        ctx.code,
      ),
    );
  }
}

function controleLienEnfant(
  lien: LienEnfant,
  j: number,
  ctx: ContextePiste,
  charge: Charge,
  textesLibres: readonly string[],
  echecs: Echec[],
): void {
  const base = `pistes[${ctx.i}].pourquoi_enfant[${j}]`;
  const { code, candidat } = ctx;
  const inconnues = lien.reponses.filter((id) => !charge.reponses.has(id));
  if (inconnues.length > 0) {
    echecs.push(
      echec(
        "T01",
        `${base}.reponses`,
        `Piste ${code}, lien enfant ${j + 1} : ${inconnues.join(", ")} ne fait pas partie des réponses.`,
        code,
      ),
    );
    return;
  }
  const citees = reponsesDe(lien.reponses, charge);
  const interdites = citees.filter((r) => !r.enfant);
  if (interdites.length > 0) {
    echecs.push(
      echec(
        "T21",
        `${base}.reponses`,
        `Piste ${code}, lien enfant ${j + 1} : ${interdites[0].id} ne doit pas servir dans la version enfant.`,
        code,
      ),
    );
  }
  const nonCitables = citees.filter((r) => !citableIci(r, candidat));
  if (nonCitables.length > 0) {
    echecs.push(
      echec(
        "T02",
        `${base}.reponses`,
        `Piste ${code}, lien enfant ${j + 1} : ${nonCitables[0].id} n'est pas citable pour ce métier.`,
        code,
      ),
    );
  }
  const fautifs = lien.faits.filter((f) => !f.startsWith(`${code}.`));
  if (fautifs.length > 0) {
    echecs.push(
      echec(
        "T03",
        `${base}.faits`,
        `Piste ${code}, lien enfant ${j + 1} : ${fautifs.join(", ")} n'est pas un fait de ce métier.`,
        code,
      ),
    );
  }
  format(lien.trait, `${base}.trait`, code, false, echecs);
  format(lien.metier, `${base}.metier`, code, false, echecs);
  controleUneReponse(lien.reponses, `${base}.reponses`, code, charge, echecs);
  controleFidelite(lien.trait, citees, "trait", `${base}.trait`, code, echecs);
  controleDetailsMetier(lien.metier, `${base}.metier`, ctx, echecs);
  controleEncadrement(lien.metier, `${base}.metier`, ctx, charge, echecs);
  const sourcesReponses = citees.flatMap((r) => [texteReponse(r), r.trait_enfant ?? ""]);
  const permisReponses = normaliser(sourcesReponses.join(" . "));
  const majReponses = motsMajuscules([...sourcesReponses, candidat.libelle]);
  controlesCommuns(
    {
      texte: lien.trait,
      champ: `${base}.trait`,
      piste: code,
      permis: permisReponses,
      majuscules: majReponses,
      nombres: ctx.nombresPiste,
      niveauxBac: ctx.niveauxBac,
      debutEstPhrase: false,
    },
    charge.prenom,
    echecs,
  );
  controlesCommuns(
    {
      texte: lien.metier,
      champ: `${base}.metier`,
      piste: code,
      permis: ctx.permisFaits,
      majuscules: ctx.majusculesFaits,
      nombres: ctx.nombresPiste,
      niveauxBac: ctx.niveauxBac,
      debutEstPhrase: false,
    },
    charge.prenom,
    echecs,
  );
  longueur(
    lien.trait,
    LONGUEURS.trait.min,
    LONGUEURS.trait.max + MARGE_LONGUEUR,
    `${base}.trait`,
    code,
    echecs,
  );
  longueur(
    lien.metier,
    LONGUEURS.metierEnfant.min,
    LONGUEURS.metierEnfant.max + MARGE_LONGUEUR,
    `${base}.metier`,
    code,
    echecs,
  );
  const phrase = phraseEnfant(lien);
  if (phrase.length > 220 + MARGE_LONGUEUR) {
    echecs.push(
      echec(
        "T11",
        base,
        `Piste ${code}, lien enfant ${j + 1} : la phrase composée fait ${phrase.length} caractères, 220 au plus.`,
        code,
      ),
    );
  }
  controleBacMetier(lien.metier, `${base}.metier`, ctx, echecs);
  // T17
  if (contientUnDesMots(lien.trait, MOTS_TU) === null) {
    echecs.push(
      echec(
        "T17",
        `${base}.trait`,
        `Piste ${code}, lien enfant ${j + 1} : le trait doit tutoyer l'enfant.`,
        code,
      ),
    );
  }
  const vous = contientUnDesMots(`${lien.trait} ${lien.metier}`, MOTS_VOUS);
  if (vous !== null) {
    echecs.push(
      echec(
        "T17",
        base,
        `Piste ${code}, lien enfant ${j + 1} : ${guillemets(vous)} ; tutoie l'enfant.`,
        code,
      ),
    );
  }
  // T18
  for (const [nom, texte] of [
    ["trait", lien.trait],
    ["metier", lien.metier],
  ] as const) {
    const neg = negationTrouvee(texte);
    if (neg !== null) {
      echecs.push(
        echec(
          "T18",
          `${base}.${nom}`,
          `Piste ${code}, lien enfant ${j + 1} : ${guillemets(neg)} est une tournure négative. Tourne-la en positif.`,
          code,
        ),
      );
    }
  }
  // T19
  const n = normaliser(`${lien.trait} . ${lien.metier}`);
  const attribution = ATTRIBUTION.find((a) => contientExpression(n, a));
  if (attribution !== undefined) {
    echecs.push(
      echec(
        "T19",
        base,
        `Piste ${code}, lien enfant ${j + 1} : ${guillemets(attribution)} ; ne dis jamais d'où vient l'information, et pas de fierté.`,
        code,
      ),
    );
  }
  // T20
  const motsTrait = mots(lien.trait);
  const nt = normaliser(lien.trait);
  const negatif =
    motsTrait.find((m) => TRAITS_NEGATIFS_PREFIXES.some((p) => m.startsWith(p))) ??
    TRAITS_NEGATIFS_EXPRESSIONS.find((e) => contientExpression(nt, e));
  if (negatif !== undefined && !contientExpression(permisReponses, negatif)) {
    echecs.push(
      echec(
        "T20",
        `${base}.trait`,
        `Piste ${code}, lien enfant ${j + 1} : ${guillemets(negatif)} est un trait négatif. Dis ce qu'il sait faire.`,
        code,
      ),
    );
  }
  // T22
  const motsPhrase = mots(phrase);
  for (const libre of textesLibres) {
    const ml = mots(libre);
    for (let k = 0; k + 6 <= ml.length; k++) {
      const suite = ml.slice(k, k + 6).join(" ");
      if (contientExpression(motsPhrase.join(" "), suite)) {
        echecs.push(
          echec(
            "T22",
            base,
            `Piste ${code}, lien enfant ${j + 1} : la phrase recopie la réponse écrite du parent. Reformule-la.`,
            code,
          ),
        );
        return;
      }
    }
  }
  controleSante(lien.trait, `${base}.trait`, code, echecs);
}

// ---------------------------------------------------------------------------
// Piste
// ---------------------------------------------------------------------------

/** Échecs de texte d'une piste (T01 à T23, T26, T29), sans les contrôles d'ensemble. */
export function echecsPiste(
  piste: PisteSortie,
  i: number,
  charge: Charge,
  options: OptionsValidation = {},
): Echec[] {
  const candidat = charge.candidats.get(piste.code);
  if (!candidat) return [];
  const echecs: Echec[] = [];
  const ctx = contextePiste(piste, i, candidat, charge);
  const { code } = ctx;
  const textesLibres = charge.envoi.reponses.flatMap((r) =>
    r.texte !== undefined && r.reponse === undefined ? [r.texte] : [],
  );

  // « Le métier, simplement »
  const ms = piste.metier_simplement;
  const champMs = `pistes[${i}].metier_simplement`;
  if (candidat.envoye.simplement_pre_redige && !options.gabarit) {
    if (ms.trim() !== "") {
      echecs.push(
        echec(
          "T11",
          champMs,
          `Piste ${code} : « metier_simplement » doit être une chaîne vide, le site a déjà ce texte.`,
          code,
        ),
      );
    }
  } else if (!options.gabarit) {
    const ps = phrases(ms);
    const tropLongue = ps.find((p) => mots(p).length > 32);
    if (ps.length < 2 || ps.length > 4 || ms.length < 140 || ms.length > 420 || tropLongue) {
      echecs.push(
        echec(
          "T11",
          champMs,
          `Piste ${code}, metier_simplement : deux à quatre phrases courtes (32 mots au plus chacune), 140 à 420 caractères en tout. Le texte en fait ${ms.length}, en ${ps.length} phrase(s).`,
          code,
        ),
      );
    }
  }
  const majMs = ctx.majusculesFaits;
  controlesCommuns(
    {
      texte: ms,
      champ: champMs,
      piste: code,
      permis: ctx.permisFaits,
      majuscules: majMs,
      nombres: ctx.nombresFaits,
      niveauxBac: ctx.niveauxBac,
      debutEstPhrase: true,
    },
    charge.prenom,
    echecs,
  );
  if (!options.gabarit) controleDetailsMetier(ms, champMs, ctx, echecs);
  // Exception commune : « le ton » d'une fiche ROME n'est pas un tutoiement.
  const motsFaits = ctx.permisFaits.split(" ");
  const pronomMs = contientUnDesMots(ms, [...MOTS_VOUS, ...MOTS_TU], motsFaits);
  if (pronomMs !== null) {
    echecs.push(
      echec(
        "T16",
        champMs,
        `Piste ${code}, metier_simplement : ${guillemets(pronomMs)} ; ni « vous » ni « tu ».`,
        code,
      ),
    );
  }

  // « Et l'IA ? »
  const ia = piste.ia_phrase;
  const champIa = `pistes[${i}].ia_phrase`;
  if (ia.trim() !== "") {
    if (!candidat.envoye.ia.afficher) {
      echecs.push(
        echec(
          "T23",
          champIa,
          `Piste ${code} : « ia_phrase » doit être une chaîne vide pour ce métier.`,
          code,
        ),
      );
    } else {
      const ps = phrases(ia);
      if (
        !options.gabarit &&
        (ps.length < 1 ||
          ps.length > 2 ||
          ia.length < 40 ||
          ia.length > LONGUEURS.iaPhrase.max + MARGE_LONGUEUR)
      ) {
        echecs.push(
          echec(
            "T11",
            champIa,
            `Piste ${code}, ia_phrase : une ou deux phrases, 40 à 200 caractères.`,
            code,
          ),
        );
      }
      const interdit = IA_INTERDITS.find((x) => {
        const n = normaliser(ia);
        return x.includes(" ")
          ? contientExpression(n, x)
          : n.split(" ").some((m) => m.startsWith(x));
      });
      if (interdit !== undefined) {
        echecs.push(
          echec(
            "T23",
            champIa,
            `Piste ${code}, ia_phrase : ${guillemets(interdit)} ; ni alarme, ni promesse.`,
            code,
          ),
        );
      }
      controlesCommuns(
        {
          texte: ia,
          champ: champIa,
          piste: code,
          permis: ctx.permisFaits,
          majuscules: majMs,
          nombres: ctx.nombresFaits,
          niveauxBac: ctx.niveauxBac,
          debutEstPhrase: true,
        },
        charge.prenom,
        echecs,
      );
      controleDetailsMetier(ia, champIa, ctx, echecs);
      const pronomIa = contientUnDesMots(ia, [...MOTS_VOUS, ...MOTS_TU], motsFaits);
      if (pronomIa !== null) {
        echecs.push(
          echec(
            "T16",
            champIa,
            `Piste ${code}, ia_phrase : ${guillemets(pronomIa)} ; ni « vous » ni « tu ».`,
            code,
          ),
        );
      }
    }
  }

  // Parent
  piste.pourquoi_parent.forEach((lien, j) => controleLienParent(lien, j, ctx, charge, echecs));
  const champPp = `pistes[${i}].pourquoi_parent`;
  const texteParent = composerPourquoi(piste.pourquoi_parent);
  if (texteParent.length > 700 + MARGE_LONGUEUR) {
    echecs.push(
      echec(
        "T11",
        champPp,
        `Piste ${code} : le texte pour le parent fait ${texteParent.length} caractères composé, 700 au plus. Raccourcis les liens.`,
        code,
      ),
    );
  }
  // T14
  const estContrainte = (l: LienParent) => reponsesDe(l.reponses, charge).some((r) => r.contrainte);
  const traits = piste.pourquoi_parent.filter((l) => !estContrainte(l));
  const contraintes = piste.pourquoi_parent.filter(estContrainte);
  const toutes = piste.pourquoi_parent.flatMap((l) => l.reponses);
  const doublons = toutes.filter((id, k) => toutes.indexOf(id) !== k);
  const dernier = piste.pourquoi_parent[piste.pourquoi_parent.length - 1];
  const t14: string[] = [];
  if (!options.gabarit && traits.length < 2)
    t14.push("au moins deux liens sur des traits de l'enfant");
  if (contraintes.length > 1) t14.push("au plus un lien sur la durée des études");
  if (contraintes.length === 1 && dernier !== contraintes[0])
    t14.push("le lien sur les études vient en dernier");
  if (doublons.length > 0) t14.push(`la réponse ${doublons[0]} ne sert qu'une fois par piste`);
  if (t14.length > 0) {
    echecs.push(echec("T14", champPp, `Piste ${code} : ${t14.join(" ; ")}.`, code));
  }

  // Enfant
  piste.pourquoi_enfant.forEach((lien, j) =>
    controleLienEnfant(lien, j, ctx, charge, textesLibres, echecs),
  );

  // Raison du choix (jamais montrée)
  const rc = piste.raison_du_choix;
  const champRc = `pistes[${i}].raison_du_choix`;
  if (!options.gabarit) {
    longueur(rc, LONGUEURS.raisonDuChoix.min, LONGUEURS.raisonDuChoix.max, champRc, code, echecs);
  }
  controleTics(rc, champRc, code, echecs);
  controleCrochetsPrenom(rc, champRc, code, charge.prenom, echecs);
  controleSante(rc, champRc, code, echecs);
  return echecs;
}

// ---------------------------------------------------------------------------
// Ensemble du bilan
// ---------------------------------------------------------------------------

/** Contrôles d'ensemble (T15, T28), à relancer après un repli par champ (§7.2). */
export function echecsEnsemble(pistes: readonly PisteSortie[]): Echec[] {
  const echecs: Echec[] = [];
  const parReponse = new Map<string, Set<string>>();
  for (const p of pistes) {
    for (const l of p.pourquoi_parent) {
      for (const id of l.reponses) {
        const s = parReponse.get(id) ?? new Set<string>();
        s.add(p.code);
        parReponse.set(id, s);
      }
    }
  }
  for (const [id, codes] of parReponse) {
    if (codes.size > 2) {
      const liste = [...codes];
      echecs.push({
        ...echec(
          "T15",
          "pistes",
          `La réponse ${id} sert dans le « pourquoi_parent » de ${codes.size} pistes (${liste.join(", ")}) ; deux au plus. Retire-la de la piste ${liste[liste.length - 1]} et appuie ce lien sur une autre réponse citable.`,
        ),
        reponse: id,
      });
    }
  }
  const debuts = new Map<string, string>();
  pistes.forEach((p, i) => {
    const m = mots(p.metier_simplement).slice(0, 3).join(" ");
    if (m === "") return;
    const deja = debuts.get(m);
    if (deja !== undefined) {
      echecs.push(
        echec(
          "T28",
          `pistes[${i}].metier_simplement`,
          `Les textes « metier_simplement » de ${deja} et ${p.code} commencent de la même façon. Varie l'ouverture.`,
          p.code,
        ),
      );
    } else debuts.set(m, p.code);
  });
  // T33 : « humain » une fois par bilan au plus dans « Et l'IA ? ».
  let humain = false;
  pistes.forEach((p, i) => {
    if (!mots(p.ia_phrase).some((m) => m.startsWith(IA_MOT_REPETITIF))) return;
    if (humain) {
      echecs.push(
        echec(
          "T33",
          `pistes[${i}].ia_phrase`,
          `Piste ${p.code}, ia_phrase : « ${IA_MOT_REPETITIF} » revient d'une piste à l'autre. Dis concrètement ce qui reste au métier, sans ce mot.`,
          p.code,
        ),
      );
    }
    humain = true;
  });
  const vues = new Map<string, string>();
  pistes.forEach((p, i) => {
    const liens: [string, string][] = [
      ...p.pourquoi_parent.map(
        (l, j) => [`pistes[${i}].pourquoi_parent[${j}].metier`, l.metier] as [string, string],
      ),
      ...p.pourquoi_enfant.map(
        (l, j) => [`pistes[${i}].pourquoi_enfant[${j}].metier`, l.metier] as [string, string],
      ),
    ];
    for (const [champ, texte] of liens) {
      const n = normaliser(texte);
      if (n.split(" ").length < 5) continue;
      if (vues.has(n)) {
        echecs.push(
          echec(
            "T28",
            champ,
            `Piste ${p.code} : la proposition ${guillemets(texte)} revient deux fois dans le bilan. Varie-la.`,
            p.code,
          ),
        );
      } else vues.set(n, champ);
    }
  });
  return echecs;
}

// ---------------------------------------------------------------------------
// Validation complète
// ---------------------------------------------------------------------------

function lireSortie(brut: unknown): unknown {
  if (typeof brut !== "string") return brut;
  try {
    return JSON.parse(brut);
  } catch {
    return undefined;
  }
}

/**
 * Règles du choix (V02 à V09) sur une liste de codes. Chaque échec porte les
 * codes en cause (`codes`) : ce sont les pistes qu'une relance ciblée peut
 * remplacer. Sert aussi au trio partiel (index.ts).
 */
export function echecsDuChoix(
  codes: readonly string[],
  charge: Charge,
  options: OptionsValidation = {},
): Echec[] {
  const echecs: Echec[] = [];
  const n = charge.envoi.nombre_de_pistes;

  // V02 à V09
  if (codes.length !== n) {
    echecs.push(echec("V02", "pistes", `Il faut exactement ${n} pistes, pas ${codes.length}.`));
  }
  const inconnus = codes.filter((c) => !charge.candidats.has(c));
  for (const c of inconnus) {
    echecs.push(
      echec(
        "V03",
        "pistes",
        `Le code ${c} ne fait pas partie des candidats. Choisis uniquement parmi les codes fournis.`,
        c,
        [c],
      ),
    );
  }
  const doubles = codes.filter((c, k) => codes.indexOf(c) !== k);
  if (doubles.length > 0) {
    echecs.push(
      echec(
        "V04",
        "pistes",
        "Deux pistes ont le même code. Choisis des métiers différents.",
        undefined,
        doubles,
      ),
    );
  }
  const connus = codes.flatMap((c) => {
    const k = charge.candidats.get(c);
    return k ? [k] : [];
  });
  const metiers = connus.map((k) => k.metier);
  for (let a = 0; a < metiers.length; a++) {
    for (let b = a + 1; b < metiers.length; b++) {
      if (metiers[a].code_rome !== metiers[b].code_rome && !compatibles(metiers[a], metiers[b])) {
        echecs.push(
          echec(
            "V05",
            "pistes",
            `${metiers[a].code_rome} et ${metiers[b].code_rome} sont trop proches (« incompatibles »). Remplace l'un des deux.`,
            undefined,
            [metiers[a].code_rome, metiers[b].code_rome],
          ),
        );
      }
    }
  }
  const parDomaine = new Map<string, string[]>();
  for (const m of metiers) {
    const d = m.grand_domaine.code;
    parDomaine.set(d, [...(parDomaine.get(d) ?? []), m.code_rome]);
  }
  const surcharge = [...parDomaine.values()].find((v) => v.length > CONSTANTES.maxParGrandDomaine);
  if (surcharge) {
    echecs.push(
      echec(
        "V06",
        "pistes",
        "Plus de deux pistes du même « grand_domaine ». Remplace-en une.",
        undefined,
        surcharge,
      ),
    );
  }
  const tous = connus.map((k) => k.envoye.code);
  if (connus.length > 0 && connus.every((k) => k.envoye.connu)) {
    echecs.push(
      echec("V07", "pistes", "Au moins une piste doit avoir « connu » à false.", undefined, tous),
    );
  }
  if (!options.gabarit && connus.length > 0 && !connus.some((k) => k.envoye.position <= 10)) {
    echecs.push(
      echec(
        "V08",
        "pistes",
        "Aucune piste n'a une position de 1 à 10. Garde au moins un candidat parmi les dix premiers de la liste.",
        undefined,
        tous,
      ),
    );
  }
  if (
    charge.envoi.coeur !== null &&
    metiers.length > 0 &&
    !coeurSatisfait(charge.profil, metiers)
  ) {
    echecs.push(
      echec(
        "V09",
        "pistes",
        "« coeur » n'est pas null : au moins une piste doit avoir « porte_le_coeur » à true.",
        undefined,
        tous,
      ),
    );
  }
  return echecs;
}

/** Valide une sortie du LLM (ou des gabarits) pour cette charge. */
export function valider(
  brut: unknown,
  charge: Charge,
  options: OptionsValidation = {},
): ResultatValidation {
  const echecs: Echec[] = [];
  const objet = lireSortie(brut);
  if (options.fin === "longueur") {
    echecs.push(
      echec(
        "V01",
        "pistes",
        "La réponse a été coupée : elle dépasse la longueur permise. Raccourcis les textes.",
      ),
    );
    return { echecs, sortie: null };
  }
  const analyse = sortieSchemaPour(charge).safeParse(objet);
  if (!analyse.success) {
    const premier = analyse.error.issues[0];
    echecs.push(
      echec(
        "V01",
        "pistes",
        `La réponse ne respecte pas le schéma JSON demandé (${premier?.path.join(".") ?? "?"} : ${premier?.message ?? "?"}). Renvoie un objet conforme.`,
      ),
    );
    return { echecs, sortie: null };
  }
  const sortie = analyse.data;
  echecs.push(
    ...echecsDuChoix(
      sortie.pistes.map((p) => p.code),
      charge,
      options,
    ),
  );

  // Textes
  sortie.pistes.forEach((p, i) => echecs.push(...echecsPiste(p, i, charge, options)));
  echecs.push(...echecsEnsemble(sortie.pistes));

  // Analyse (jamais montrée)
  if (!options.gabarit) {
    longueur(
      sortie.analyse,
      LONGUEURS.analyse.min,
      LONGUEURS.analyse.max,
      "analyse",
      undefined,
      echecs,
    );
  }
  controleTics(sortie.analyse, "analyse", undefined, echecs);
  controleCrochetsPrenom(sortie.analyse, "analyse", undefined, charge.prenom, echecs);
  controleSante(sortie.analyse, "analyse", undefined, echecs);

  return { echecs, sortie };
}

/** Un échec de choix ? */
export function estEchecDeChoix(e: Echec): boolean {
  return e.nature === "choix";
}
