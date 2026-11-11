/**
 * La charge utile envoyée au LLM (conseiller-ia.md §3) : une projection des
 * réponses et de la présélection, avec des identifiants partout. Rien de ce
 * que le LLM ne doit pas écrire ne lui est donné : ni prénom, ni département,
 * ni montant, ni nombre de projets, ni pourcentage, ni score.
 *
 * Fonction pure des réponses et de l'index : mêmes réponses, même charge,
 * octet pour octet.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { conseiller as textes } from "@content/conseiller";
import { CONSTANTES } from "@/lib/moteur/constantes";
import { chargerIndexMoteur } from "@/lib/moteur/donnees";
import { filtrer } from "@/lib/moteur/filtres";
import { preselectionner, type Preselection } from "@/lib/moteur/preselection";
import { reponsesEffectives } from "@/lib/moteur/profil";
import {
  fractionIa,
  fractionRecrutement,
  fractionSalaire,
  repereSalaire,
} from "@/lib/moteur/score";
import { compatibles } from "@/lib/moteur/selection";
import type { IndexMoteur, MetierMoteur } from "@/lib/moteur/types";
import { accorder, prenomOuNull, rendreTexte } from "@/lib/questionnaire/accords";
import {
  champsAffiches,
  conditionVraie,
  parcours,
  valeursDuChamp,
} from "@/lib/questionnaire/parcours";
import type { Reponses } from "@/lib/questionnaire/reponses";
import {
  amorceDe,
  citationDe,
  contenuDe,
  contenuOption,
  titreDe,
} from "@/lib/questionnaire/textes";
import type { Genre } from "@/lib/questionnaire/types";
import { accorderLibelle } from "./composer";
import {
  CLE_CONTRAINTE,
  CLES_INTERDITES_ENFANT,
  CLES_JAMAIS_ENVOYEES,
  CLES_NON_CITABLES,
  REPONSES_INTERDITES_ENFANT,
} from "./lexiques";
import { phraseDeBase } from "./raisons";
import { minusculeInitiale, normaliser, resserrer } from "./texte";
import type {
  CandidatEnvoye,
  CandidatInterne,
  Charge,
  Citable,
  EcarteInterne,
  FaitEnvoye,
  ReponseEnvoyee,
} from "./types";

// ---------------------------------------------------------------------------
// Conditions de travail (passe qualité de 2.4)
// ---------------------------------------------------------------------------

let conditions: ReadonlyMap<string, readonly string[]> | undefined;

/**
 * Conditions de travail ROME de chaque métier éligible (lieux, postures,
 * horaires), écrites par scripts/data/conditions_travail.py.
 */
export function chargerConditionsTravail(): ReadonlyMap<string, readonly string[]> {
  if (conditions) return conditions;
  const chemin = join(process.cwd(), "data", "processed", "conditions_travail.json");
  const brut = JSON.parse(readFileSync(chemin, "utf-8")) as {
    metiers: { code_rome: string; conditions: string[] }[];
  };
  conditions = new Map(brut.metiers.map((m) => [m.code_rome, m.conditions]));
  return conditions;
}

/**
 * Conditions ROME d'un métier où l'on ne reste pas assis à un bureau : le
 * drapeau `terrain`, seul à rendre « il n'aime pas rester assis » citable.
 */
export const CONDITIONS_TERRAIN: ReadonlySet<string> = new Set([
  "Sur chantier",
  "En extérieur",
  "Déplacements professionnels",
  "Station debout prolongée",
  "Au domicile d'un particulier",
  "En atelier",
  "Port et manipulation de charges lourdes ou encombrantes",
  "En milieu maritime",
  "En grande hauteur",
  "En club sportif",
]);

/** Réponse citable seulement pour un métier `terrain` (le questionnaire la dit citable partout). */
export const REPONSES_TERRAIN: ReadonlySet<string> = new Set(["rester_assis=besoin_de_bouger"]);

/** Conditions trop générales pour dire où l'on travaille : non envoyées (charge plus légère). */
const CONDITIONS_TUES: ReadonlySet<string> = new Set([
  "Travail en journée",
  "Port d'équipement de protection individuelle (EPI) : gants, chaussures, casque, protections auditives",
]);

/** Le fait « c » : « Conditions de travail : sur chantier ; en bureau d'études. » */
export function faitConditions(liste: readonly string[]): string | null {
  const propres = liste
    .filter((c) => !CONDITIONS_TUES.has(c))
    .map((c) =>
      minusculeInitiale(
        c
          .replace(/\s*\([^)]*\)/g, "")
          .replace(/\s*:.*$/u, "")
          .trim(),
      ),
    )
    .filter((c) => c !== "");
  return propres.length === 0 ? null : `Conditions de travail : ${propres.join(" ; ")}.`;
}

// ---------------------------------------------------------------------------
// Nettoyage des réponses libres (§3.1)
// ---------------------------------------------------------------------------

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const LIEN = /\b(?:https?:\/\/|www\.)\S+/gi;
const TELEPHONE = /(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g;
const LONG_NOMBRE = /\d{5,}/g;

/**
 * Prénom → « [prénom] » (sans casse ni accents, mot entier), emails, liens,
 * téléphones et suites de 5 chiffres ou plus remplacés.
 */
export function nettoyerTexteLibre(texte: string, prenom: string | null): string {
  let t = texte
    .replace(EMAIL, "[email]")
    .replace(LIEN, "[lien]")
    .replace(TELEPHONE, "[téléphone]")
    .replace(LONG_NOMBRE, "[nombre]");
  const p = prenomOuNull(prenom);
  if (p !== null) {
    const cible = normaliser(p);
    if (cible !== "") {
      t = t.replace(/[\p{L}\p{M}'’-]+/gu, (mot) => {
        // « d'Anaïs » : l'élision reste, le prénom part.
        const m = mot.match(/^([dlj]['’])(.*)$/iu);
        const tete = m ? m[1] : "";
        const corps = m ? m[2] : mot;
        return normaliser(corps) === cible ? `${tete}[prénom]` : mot;
      });
    }
  }
  return resserrer(t);
}

// ---------------------------------------------------------------------------
// Faits d'un métier (§3.3)
// ---------------------------------------------------------------------------

/**
 * Corrections des définitions ROME (§7.3.2), appliquées à la lecture :
 * code ROME, texte fautif, correction. Un test cherche les fautes
 * d'accord du même type dans les 545 définitions.
 */
export const CORRECTIONS_DEFINITIONS: readonly [string, string, string][] = [
  ["F1201", "dont ils coordonne", "dont il coordonne"],
  // Un slogan avec point d'exclamation en tête de définition (T09) : retiré.
  ["K1425", "Son objectif est de soigner mieux en dépensant mieux ! ", ""],
];

export function definitionCorrigee(metier: Pick<MetierMoteur, "code_rome" | "definition">): string {
  let d = metier.definition;
  for (const [code, faute, correction] of CORRECTIONS_DEFINITIONS) {
    if (code === metier.code_rome) d = d.replace(faute, correction);
  }
  return d;
}

const MOTS_LIAISON = new Set([
  "le",
  "la",
  "les",
  "l",
  "de",
  "du",
  "des",
  "d",
  "en",
  "au",
  "aux",
  "a",
  "et",
  "ou",
]);

/**
 * Découpe de la définition (§3.3) : la première phrase, puis les activités,
 * coupées avant chaque mot à majuscule initiale suivie de minuscules qui
 * n'est pas précédé d'un article ou d'une préposition.
 */
export function decouperDefinition(definition: string): string[] {
  const d = resserrer(definition);
  const fin = d.search(/\.\s+(?=\p{Lu})/u);
  // Sans point après la première phrase (« … locales Identifie les besoins… »),
  // la première coupe vient de la même règle que les activités.
  const premiere = fin === -1 ? null : d.slice(0, fin + 1).trim();
  const reste = fin === -1 ? d : d.slice(fin + 1).trim();
  const jetons = reste.split(" ");
  const activites: string[][] = [];
  for (const [i, jeton] of jetons.entries()) {
    const precedent = i > 0 ? normaliser(jetons[i - 1].replace(/['’]$/, "")) : "";
    const majuscule = /^\p{Lu}\p{Ll}/u.test(jeton);
    const coupe =
      i === 0 || (majuscule && !MOTS_LIAISON.has(precedent) && !/['’]$/.test(jetons[i - 1] ?? ""));
    if (coupe || activites.length === 0) activites.push([jeton]);
    else activites[activites.length - 1].push(jeton);
  }
  const segments = activites.map((a) => a.join(" ").trim()).filter((a) => a !== "");
  return premiere === null ? segments : [premiere, ...segments];
}

function niveauEtudes(bacPlus: number): string {
  if (bacPlus >= 1) return `bac + ${bacPlus}`;
  if (bacPlus === 0) return "le bac";
  return "sans diplôme après le bac";
}

function phraseNiveau(bacPlus: number, max: number | null): string {
  if (bacPlus >= 1) {
    return max !== null && max > bacPlus
      ? `Niveau d'accès : bac + ${bacPlus}, jusqu'à bac + ${max} selon les postes.`
      : `Niveau d'accès : bac + ${bacPlus}.`;
  }
  if (bacPlus === 0) return "Niveau d'accès : le bac.";
  return "Niveau d'accès : aucun diplôme exigé après le bac.";
}

/**
 * Preuves ROME gardées par candidat (la conception en prévoyait 10) : 6
 * suffisent aux liens du moteur et tiennent la charge sous 50 Ko.
 */
export const PREUVES_MAX = 6;
/** Liens de proximité envoyés par candidat. */
export const PROXIMITES_MAX = 4;

export type FaitsMetier = { faits: FaitEnvoye[]; idDePreuve: Map<string, string> };

/** Faits d'un candidat, identifiants `<code>.<lettre><n>` (§3.3). */
export function construireFaits(
  metier: MetierMoteur,
  preuvesDesLiens: readonly string[],
  conditionsTravail: readonly string[] = [],
): FaitsMetier {
  const code = metier.code_rome;
  const faits: FaitEnvoye[] = decouperDefinition(definitionCorrigee(metier)).map((texte, i) => ({
    id: `${code}.d${i + 1}`,
    texte,
  }));
  const idDePreuve = new Map<string, string>();
  let n = 0;
  for (const preuve of preuvesDesLiens) {
    if (idDePreuve.has(preuve) || n >= PREUVES_MAX) continue;
    n += 1;
    idDePreuve.set(preuve, `${code}.p${n}`);
    faits.push({ id: `${code}.p${n}`, texte: preuve });
  }
  const max = metier.acces.bac_plus_max;
  faits.push({ id: `${code}.e`, texte: phraseNiveau(metier.etudes.bac_plus, max) });
  if (metier.acces.condition_experience) {
    faits.push({ id: `${code}.x`, texte: metier.acces.condition_experience });
  }
  const c = faitConditions(conditionsTravail);
  if (c !== null) faits.push({ id: `${code}.c`, texte: c });
  return { faits, idDePreuve };
}

// ---------------------------------------------------------------------------
// Repères calculés une fois par index
// ---------------------------------------------------------------------------

const seuilsParIndex = new WeakMap<IndexMoteur, [number, number]>();

/** Terciles du repère de salaire sur les métiers éligibles (§3.3), jamais affichés. */
export function seuilsSalaire(index: IndexMoteur): [number, number] {
  const deja = seuilsParIndex.get(index);
  if (deja) return deja;
  const reperes = index.metiers
    .map((m) => repereSalaire(m)?.repere)
    .filter((r): r is number => r !== undefined)
    .sort((a, b) => a - b);
  const q = (p: number) => reperes[Math.min(reperes.length - 1, Math.floor(p * reperes.length))];
  const seuils: [number, number] = [q(1 / 3), q(2 / 3)];
  seuilsParIndex.set(index, seuils);
  return seuils;
}

export function niveauSalaire(
  metier: MetierMoteur,
  index: IndexMoteur,
): "bas" | "moyen" | "haut" | null {
  const r = repereSalaire(metier);
  if (!r) return null;
  const [bas, haut] = seuilsSalaire(index);
  return r.repere < bas ? "bas" : r.repere < haut ? "moyen" : "haut";
}

/**
 * « Souvent proposé » (critique 2, R6) : le métier est dans les 10 premiers
 * par affinité pour au moins 15 % des profils du panel (pénalité « aimant »
 * de 0,02 ou plus). Un signal porté par un candidat sur trois ne dirait rien.
 */
export const FREQUENCE_SOUVENT_PROPOSE = 0.15;

/** Types de formation qui mènent directement à un premier emploi (§3.3, R7 du moteur). */
const TYPES_VOIE_COURTE = new Set(["BTS", "BUT", "DEUST", "DE", "FORMATION_PRO"]);

let preRediges: ReadonlyMap<string, string> | undefined;

/**
 * Textes pré-rédigés de « Le métier, simplement » (§7.3.2), écrits par 2.5
 * dans data/processed/metiers_simplement.json ; vide tant qu'il n'existe pas.
 */
export function chargerSimplementPreRediges(): ReadonlyMap<string, string> {
  if (preRediges) return preRediges;
  const chemin = join(process.cwd(), "data", "processed", "metiers_simplement.json");
  const map = new Map<string, string>();
  if (existsSync(chemin)) {
    const brut = JSON.parse(readFileSync(chemin, "utf-8")) as {
      metiers?: { code_rome: string; texte: string }[];
    };
    for (const m of brut.metiers ?? []) map.set(m.code_rome, m.texte);
  }
  preRediges = map;
  return map;
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

export type OptionsCharge = {
  index?: IndexMoteur;
  preselection?: Preselection;
  /** Textes pré-rédigés, par code ROME (défaut : data/processed/metiers_simplement.json). */
  simplementPreRediges?: ReadonlyMap<string, string>;
  /** Conditions de travail, par code ROME (défaut : data/processed/conditions_travail.json). */
  conditionsTravail?: ReadonlyMap<string, readonly string[]>;
};

/** Trait enfant d'une réponse, accordé (§7.3.4). */
export function traitEnfantDe(id: string, varianteId: string, genre: Genre): string | undefined {
  const gabarit =
    (varianteId === "apres_bac" ? textes.traitsEnfantApresBac[id] : undefined) ??
    textes.traitsEnfant[id];
  return gabarit === undefined ? undefined : accorder(gabarit, { genre, prenom: null });
}

/** Réponse interdite à la version enfant (§3.2) ? */
export function interditeEnfant(id: string): boolean {
  const cle = id.split("=")[0];
  return CLES_INTERDITES_ENFANT.has(cle) || REPONSES_INTERDITES_ENFANT.has(id);
}

function construireReponses(
  effectives: Reponses,
  genre: Genre,
  prenom: string | null,
): { reponses: ReponseEnvoyee[]; passees: string[]; questions: Map<string, string> } {
  const accord = { genre, prenom: null };
  const reponses: ReponseEnvoyee[] = [];
  const passees: string[] = [];
  const questions = new Map<string, string>();
  const passeesIds = new Set<string>(effectives.passees);
  for (const { question, variante } of parcours(effectives)) {
    const titreGabarit = titreDe(question, variante);
    const titre = titreGabarit === undefined ? "" : rendreTexte(titreGabarit, accord);
    if (passeesIds.has(question.id)) {
      if (titre !== "") passees.push(titre);
      continue;
    }
    const contenu = contenuDe(question);
    for (const champ of champsAffiches(variante, effectives)) {
      if (CLES_JAMAIS_ENVOYEES.has(champ.cle)) continue;
      if (champ.type === "departement") continue;
      const libelleChamp = contenu.champs?.[champ.cle]?.libelle;
      const intitule =
        libelleChamp === undefined
          ? titre
          : resserrer(`${titre} ${rendreTexte(libelleChamp, accord)}`);
      if (champ.type === "choix_unique" || champ.type === "choix_multiple") {
        for (const optionId of valeursDuChamp(effectives, champ.cle)) {
          const option = champ.options.find((o) => o.id === optionId);
          if (option === undefined) continue;
          const id = `${champ.cle}=${optionId}`;
          const texteOption = contenuOption(question, variante, optionId);
          const citation = citationDe(question, variante, optionId, accord);
          let citable: Citable = false;
          const regle = option.citation;
          if (!CLES_NON_CITABLES.has(champ.cle) && regle !== undefined && citation !== undefined) {
            if (regle === "toujours") citable = true;
            else if ("si" in regle) citable = conditionVraie(regle.si, effectives);
            else citable = { si_metier: regle.siMetier };
          }
          const trait =
            citable !== false && !interditeEnfant(id)
              ? traitEnfantDe(id, variante.id, genre)
              : undefined;
          if (REPONSES_TERRAIN.has(id) && citable !== false) citable = { si_metier: "terrain" };
          questions.set(id, question.id);
          reponses.push({
            id,
            question: intitule,
            ...(texteOption && { reponse: rendreTexte(texteOption.libelle, accord) }),
            ...(citation !== undefined && { citation }),
            ...(trait !== undefined && { trait_enfant: trait }),
            citable,
            contrainte: champ.cle === CLE_CONTRAINTE,
            enfant: trait !== undefined,
          });
        }
      } else if (champ.type === "texte") {
        const valeur = effectives[champ.cle];
        if (typeof valeur !== "string" || valeur.trim() === "") continue;
        const amorce = amorceDe(champ.cle, genre);
        const enfant = champ.enfant !== false && !interditeEnfant(champ.cle);
        const amorceEnfant = enfant ? textes.amorcesEnfant[champ.cle] : undefined;
        questions.set(champ.cle, question.id);
        reponses.push({
          id: champ.cle,
          question: intitule,
          texte: nettoyerTexteLibre(valeur, prenom),
          ...(amorce !== undefined && { citation: amorce }),
          ...(amorceEnfant !== undefined && {
            trait_enfant: accorder(amorceEnfant, { genre, prenom: null }),
          }),
          citable: champ.citable !== false,
          contrainte: false,
          enfant,
        });
      } else if (champ.type === "metiers") {
        const saisies = valeursDuChamp(effectives, champ.cle);
        if (saisies.length === 0) continue;
        questions.set(champ.cle, question.id);
        reponses.push({
          id: champ.cle,
          question: intitule,
          texte: nettoyerTexteLibre(saisies.join(" ; "), prenom),
          citable: false,
          contrainte: false,
          enfant: false,
        });
      }
    }
  }
  return { reponses, passees, questions };
}

/** Construit la charge (§3.4) et son contexte. */
export function construireCharge(reponses: Reponses, options: OptionsCharge = {}): Charge {
  const index = options.index ?? chargerIndexMoteur();
  const preselection = options.preselection ?? preselectionner(reponses, { index });
  const preRedigesMap = options.simplementPreRediges ?? chargerSimplementPreRediges();
  const effectives = reponsesEffectives(reponses);
  const [genreBrut] = valeursDuChamp(effectives, "genre");
  // Sans genre choisi (profil de test), « il » : la charge doit rester constructible.
  const genre: Genre = genreBrut === "elle" ? "elle" : "il";
  const prenom = prenomOuNull(typeof reponses.prenom === "string" ? reponses.prenom : null);
  const { reponses: envoyees, passees, questions } = construireReponses(effectives, genre, prenom);
  const conditionsParCode = options.conditionsTravail ?? chargerConditionsTravail();
  const parId = new Map(envoyees.map((r) => [r.id, r]));

  const { profil, repli } = preselection;
  const codesPreselection = preselection.candidats.map((c) => c.code_rome);
  const metiers = new Map<string, MetierMoteur>();
  for (const code of codesPreselection) {
    const m = index.parCode.get(code);
    if (!m) throw new Error(`Candidat ${code} absent de l'index`);
    metiers.set(code, m);
  }

  const candidats = new Map<string, CandidatInterne>();
  preselection.candidats.forEach((c, i) => {
    const metier = metiers.get(c.code_rome) as MetierMoteur;
    const preuves = c.liens.flatMap((l) => l.metier.preuves);
    const conditionsMetier = conditionsParCode.get(c.code_rome) ?? [];
    const { faits, idDePreuve } = construireFaits(metier, preuves, conditionsMetier);
    const terrain =
      metier.dimensions.drapeaux.effort_physique ||
      conditionsMetier.some((k) => CONDITIONS_TERRAIN.has(k));
    const formationsCompatibles = filtrer(profil, metier, index).formations;
    const types = [...new Set(formationsCompatibles.map((f) => f.type))];
    const experience = c.contraintes.find(
      (k) => k.type === "experience_citee" && k.nature === "condition" && !k.voieLongueOuverte,
    );
    const bacPlus = metier.etudes.bac_plus;
    const bacPlusMax =
      metier.acces.bac_plus_max !== null && metier.acces.bac_plus_max > bacPlus
        ? metier.acces.bac_plus_max
        : null;
    const etudesMax = profil.filtres.etudesMax;
    const voieCourteIncertaine =
      etudesMax !== null &&
      bacPlusMax !== null &&
      bacPlusMax > etudesMax &&
      !formationsCompatibles.some((f) => TYPES_VOIE_COURTE.has(f.type));
    const fr = fractionRecrutement(metier);
    const fs = fractionSalaire(metier);
    const fi = fractionIa(metier);
    const ia = metier.exposition_ia;
    const simplement = preRedigesMap.get(c.code_rome) ?? null;
    const libelle = accorderLibelle(metier.libelle, genre);
    const envoye: CandidatEnvoye = {
      code: c.code_rome,
      metier: libelle,
      position: i + 1,
      rang: c.rang,
      domaine: c.domaine.libelle,
      grand_domaine: c.grandDomaine.libelle,
      connu: c.connu,
      evoque: profil.metiersEvoques.includes(c.code_rome),
      souvent_propose: (index.frequences.get(c.code_rome) ?? 0) >= FREQUENCE_SOUVENT_PROPOSE,
      porte_le_coeur: (c.valeurCoeur ?? 0) >= CONSTANTES.couverture,
      incompatibles: codesPreselection.filter(
        (autre) =>
          autre !== c.code_rome && !compatibles(metier, metiers.get(autre) as MetierMoteur),
      ),
      simplement_pre_redige: simplement !== null,
      etudes: {
        niveau: niveauEtudes(bacPlus),
        jusqu_a: bacPlusMax === null ? null : `bac + ${bacPlusMax}`,
        types_de_formation: types,
        apprentissage: formationsCompatibles.some((f) => f.apprentissage),
        condition_experience:
          experience && experience.type === "experience_citee" ? experience.preuve : null,
        voie_courte_incertaine: voieCourteIncertaine,
      },
      marche: {
        recrute_peu: fr !== null && fr >= CONSTANTES.ecartes.fractionRaison,
        salaire_debut_bas: fs !== null && fs >= CONSTANTES.ecartes.fractionRaison,
        ia_elevee: fi !== null && fi >= CONSTANTES.ecartes.fractionRaison,
        salaire_niveau: niveauSalaire(metier, index),
      },
      drapeaux: [
        ...Object.entries(metier.dimensions.drapeaux)
          .filter(([, v]) => v === true)
          .map(([k]) => k),
        ...(terrain ? ["terrain"] : []),
      ],
      ia: {
        afficher: ia !== null && ia.concordance,
        niveau: ia !== null && ia.concordance ? ia.niveau : null,
      },
      faits,
      proximite: c.liens
        .filter((l) => l.citable && l.reponses.length > 0)
        .map((l) => ({
          dimension: l.dimension,
          reponses: l.reponses.map((r) => `${r.cle}=${r.option}`).filter((id) => parId.has(id)),
          faits: l.metier.preuves
            .map((p) => idDePreuve.get(p))
            .filter((id): id is string => id !== undefined),
        }))
        .filter((p) => p.reponses.length > 0 && p.faits.length > 0)
        .slice(0, PROXIMITES_MAX),
    };
    candidats.set(c.code_rome, {
      envoye,
      metier,
      preselection: c,
      bacPlus,
      bacPlusMax,
      libelle,
      simplementPreRedige: simplement,
    });
  });

  const libelleDe = (code: string) => {
    const m = index.parCode.get(code);
    return m ? accorderLibelle(m.libelle, genre) : code;
  };
  const ecartes: EcarteInterne[] = repli.ecartes.flatMap((e) => {
    const motif = e.raison.code;
    if (
      motif !== "etudes_niveau" &&
      motif !== "formations" &&
      motif !== "refus" &&
      motif !== "encadrement"
    ) {
      return [];
    }
    return [
      {
        code: e.code_rome,
        metier: accorderLibelle(e.libelle, genre),
        motif,
        phrase_de_base: phraseDeBase(e.raison, { genre, libelleDe }),
        raison: e.raison,
      },
    ];
  });

  const coeur =
    profil.coeur !== null && repli.regleCoeur === "satisfaite"
      ? {
          dimension: profil.coeur.dim,
          reponse:
            profil.coeur.origine === "fierte" && typeof effectives.fierte === "string"
              ? `fierte=${effectives.fierte}`
              : null,
        }
      : null;

  return {
    questions,
    envoi: {
      pronom: genre,
      nombre_de_pistes: repli.pistes.length,
      coeur,
      reponses: envoyees,
      passees,
      candidats: [...candidats.values()].map((c) => c.envoye),
      ecartes: ecartes.map(({ code, metier, motif, phrase_de_base }) => ({
        code,
        metier,
        motif,
        phrase_de_base,
      })),
    },
    genre,
    prenom,
    profil,
    preselection,
    candidats,
    reponses: parId,
    ecartes,
  };
}
