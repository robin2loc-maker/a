/**
 * Réponses au questionnaire : forme et validation (conception §5.7).
 *
 * Forme plate, compatible avec le stockage (src/lib/stockage/types.ts) et le
 * jeton signé (src/lib/jeton-signe.ts) : une clé par champ, une valeur par clé.
 *
 *   {
 *     version: 3,
 *     passees: ["temps_libre"],          // questions passées (« Je ne sais pas, passer »)
 *     genre: "elle", prenom: "Anaïs",    // Q1
 *     situation: "terminale_generale",   // choix unique : identifiant d'option
 *     specialites: ["maths", "svt"],     // choix multiple : liste d'identifiants
 *     temps_libre_precis: "Démonter des scooters",  // phrase libre (Q5, Q6, Q20)
 *     fierte_recit: "Le jour où…",
 *     departement: "69",
 *     metier_evoque: ["véto"], metier_evoque_appellations: ["20672"],
 *   }
 *
 * Une réponse devenue sans objet (Q2 modifiée) est gardée mais ignorée par le
 * parcours : la validation accepte toute option qui existe dans une variante.
 *
 * Les phrases libres sont nettoyées à la validation (questions ouvertes §3.3 :
 * le serveur ne fait pas confiance au navigateur) : non-réponses ramenées à
 * vide, passages de santé retirés (`nettoyerTextesLibres`).
 */
import { z } from "zod";
import { champsParCle, VERSION_QUESTIONNAIRE } from "./definition";
import { nettoyerTextesLibres } from "./textes-libres";
import { IDS_QUESTIONS, type Champ, type IdQuestion } from "./types";

export type ValeurChamp = string | string[];

export interface Reponses {
  version: typeof VERSION_QUESTIONNAIRE;
  /** Questions passées, dans l'ordre où elles l'ont été. */
  passees: IdQuestion[];
  [cle: string]: ValeurChamp | number;
}

/** Réponses vides, au début du questionnaire. */
export function reponsesVides(): Reponses {
  return { version: VERSION_QUESTIONNAIRE, passees: [] };
}

/** Les 101 départements : 01 à 95 (2A et 2B pour la Corse), et 971 à 976 sauf 975. */
export const CODES_DEPARTEMENTS: readonly string[] = [
  ...Array.from({ length: 95 }, (_, i) => String(i + 1).padStart(2, "0")).flatMap((code) =>
    code === "20" ? ["2A", "2B"] : [code],
  ),
  "971",
  "972",
  "973",
  "974",
  "976",
];

const CLES_RESERVEES = new Set(["version", "passees"]);

interface ChampConnu {
  champ: Champ;
  /** Options acceptées : celles de toutes les versions du champ. */
  options: Set<string>;
  exclusives: Set<string>;
  max: number | null;
}

/** Index des clés acceptées, construit une fois depuis la définition. */
function indexDesCles(): Map<string, ChampConnu> {
  const index = new Map<string, ChampConnu>();
  for (const [cle, { champs }] of champsParCle()) {
    const premier = champs[0];
    if (premier === undefined) continue;
    const options = new Set<string>();
    const exclusives = new Set<string>();
    let max: number | null = 0;
    for (const champ of champs) {
      if (champ.type === "choix_unique" || champ.type === "choix_multiple") {
        for (const o of champ.options) {
          options.add(o.id);
          if (o.exclusive) exclusives.add(o.id);
        }
      }
      const m = champ.type === "choix_multiple" || champ.type === "metiers" ? champ.max : 1;
      max = max === null || m === null ? null : Math.max(max, m);
    }
    index.set(cle, { champ: premier, options, exclusives, max });
    if (premier.type === "metiers") {
      index.set(premier.cleAppellations, { champ: premier, options, exclusives, max });
    }
  }
  return index;
}

const INDEX = indexDesCles();

const valeurBrute = z.union([
  z.string().max(500),
  z.array(z.string().max(500)).max(30),
  z.number(),
]);

function verifierValeur(
  cle: string,
  valeur: ValeurChamp | number,
  connu: ChampConnu,
  ajouter: (message: string) => void,
): void {
  const { champ } = connu;
  const liste = (): string[] | null => {
    if (!Array.isArray(valeur)) {
      ajouter(`${cle} : une liste est attendue`);
      return null;
    }
    if (new Set(valeur).size !== valeur.length) ajouter(`${cle} : valeur en double`);
    if (connu.max !== null && valeur.length > connu.max) {
      ajouter(`${cle} : ${valeur.length} choix pour ${connu.max} au plus`);
    }
    return valeur;
  };

  switch (champ.type) {
    case "choix_unique":
      if (typeof valeur !== "string" || !connu.options.has(valeur)) {
        ajouter(`${cle} : option inconnue`);
      }
      return;
    case "choix_multiple": {
      const choix = liste();
      if (choix === null) return;
      if (choix.length === 0) ajouter(`${cle} : liste vide`);
      for (const id of choix)
        if (!connu.options.has(id)) ajouter(`${cle} : option inconnue « ${id} »`);
      if (choix.length > 1 && choix.some((id) => connu.exclusives.has(id))) {
        ajouter(`${cle} : une option exclusive est cochée avec d'autres`);
      }
      return;
    }
    case "texte":
      if (typeof valeur !== "string" || valeur.trim().length > champ.longueurMax) {
        ajouter(`${cle} : texte de ${champ.longueurMax} caractères au plus attendu`);
      }
      return;
    case "departement":
      if (typeof valeur !== "string" || !CODES_DEPARTEMENTS.includes(valeur)) {
        ajouter(`${cle} : département inconnu`);
      }
      return;
    case "metiers": {
      const items = liste();
      if (items === null) return;
      const appellations = cle === champ.cleAppellations;
      for (const item of items) {
        const ok = appellations
          ? /^\d{1,7}$/.test(item)
          : item.trim() !== "" && item.trim().length <= champ.longueurMax;
        if (!ok) ajouter(`${cle} : valeur invalide « ${item} »`);
      }
      return;
    }
  }
}

/**
 * Schéma des réponses. À appliquer au résultat de `decoderJeton` ou d'une
 * lecture en base : `reponsesSchema.safeParse(decoderJeton(jeton, cle))`.
 * Le résultat a ses phrases libres nettoyées (`nettoyerTextesLibres`).
 */
export const reponsesSchema = z
  .record(z.string().regex(/^[a-z0-9_]{1,64}$/), valeurBrute)
  .superRefine((brut, ctx) => {
    const ajouter = (message: string) => ctx.addIssue({ code: "custom", message });
    if (brut.version !== VERSION_QUESTIONNAIRE)
      ajouter(`version ${VERSION_QUESTIONNAIRE} attendue`);
    const passees = brut.passees;
    if (!Array.isArray(passees)) {
      ajouter("passees : une liste est attendue");
    } else {
      const ids: readonly string[] = IDS_QUESTIONS;
      for (const id of passees)
        if (!ids.includes(id)) ajouter(`passees : question inconnue « ${id} »`);
      if (new Set(passees).size !== passees.length) ajouter("passees : question en double");
    }
    for (const [cle, valeur] of Object.entries(brut)) {
      if (CLES_RESERVEES.has(cle)) continue;
      const connu = INDEX.get(cle);
      if (connu === undefined) {
        ajouter(`clé inconnue « ${cle} »`);
        continue;
      }
      verifierValeur(cle, valeur, connu, ajouter);
    }
  })
  .transform((brut) => nettoyerTextesLibres(brut as Reponses));
