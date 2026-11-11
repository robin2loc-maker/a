/**
 * Schéma de sortie du LLM (conseiller-ia.md §5), construit pour chaque
 * charge : les codes, les identifiants de réponses et de faits sont des
 * énumérations. Deux formes du même schéma : JSON Schema pour l'API (sortie
 * structurée stricte), zod pour la vérification V01.
 *
 * Les longueurs des chaînes sont dans le JSON Schema (l'API les applique) mais
 * pas dans zod : un texte trop long est un échec de texte (T11, repli par
 * champ), pas un échec de choix (repli total).
 *
 * Passe qualité de 2.4 : un lien cite une réponse (`reponse`), plus au besoin
 * la précision écrite de la même question (`precision`), au lieu d'une liste ;
 * le modèle ne peut plus coller deux réponses dans un rappel. Le code garde la
 * forme interne `reponses: string[]`, et zod lit aussi l'ancienne forme (les
 * réponses gardées des essais, les fixtures, les gabarits).
 */
import { z } from "zod";
import type { Charge, CorrectionLlm, SortieLlm } from "./types";

export type JsonSchema = Record<string, unknown>;

/** Longueurs du schéma (critique 2, A1 : resserrées pour tenir sous 700 et 220 caractères composés). */
export const LONGUEURS = {
  /** Champs jamais montrés, raccourcis pour gagner du temps de génération (passe qualité de 2.4). */
  analyse: { min: 80, max: 250 },
  raisonDuChoix: { min: 20, max: 150 },
  metierSimplement: { max: 420 },
  iaPhrase: { max: 200 },
  rappel: { min: 10, max: 110 },
  metierParent: { min: 15, max: 130 },
  trait: { min: 8, max: 80 },
  metierEnfant: { min: 15, max: 120 },
} as const;

/**
 * Marge du validateur sur les longueurs des fragments (rappel, metier, trait,
 * phrase IA) : le schéma et le prompt annoncent la cible, le validateur ne
 * rejette qu'au-delà de cette marge. Les vraies bornes sont celles des textes
 * composés (700 caractères pour le parent, 220 par phrase enfant). Mesuré à
 * l'essai réel : l'API ne fait pas respecter `maxLength`, et des phrases IA de
 * 204 caractères étaient bonnes.
 */
export const MARGE_LONGUEUR = 20;

function enumeration(valeurs: readonly string[]): JsonSchema {
  return { type: "string", enum: [...valeurs] };
}

/** Réponse écrite par le parent (champ libre) : elle peut préciser une case de sa question. */
const estLibre = (r: Charge["envoi"]["reponses"][number]) =>
  r.texte !== undefined && r.reponse === undefined;

function identifiants(charge: Charge) {
  const codes = charge.envoi.candidats.map((c) => c.code);
  const reponses = charge.envoi.reponses.map((r) => r.id);
  const reponsesEnfant = charge.envoi.reponses.filter((r) => r.enfant).map((r) => r.id);
  const libres = charge.envoi.reponses.filter(estLibre).map((r) => r.id);
  const libresEnfant = charge.envoi.reponses
    .filter((r) => estLibre(r) && r.enfant)
    .map((r) => r.id);
  const faits = charge.envoi.candidats.flatMap((c) => c.faits.map((f) => f.id));
  return { codes, reponses, reponsesEnfant, libres, libresEnfant, faits };
}

/** Valeur « aucune précision » de `precision`. */
export const SANS_PRECISION = "";

/** JSON Schema d'une piste ; `remplace` : la relance ciblée (codes réécrits). */
function schemaPiste(charge: Charge, remplace?: readonly string[]): JsonSchema {
  const ids = identifiants(charge);
  const L = LONGUEURS;
  const listeIds = (valeurs: string[], max: number): JsonSchema => ({
    type: "array",
    minItems: 1,
    maxItems: max,
    items: enumeration(valeurs.length > 0 ? valeurs : ["aucune"]),
  });
  const lien = (texte: "rappel" | "trait", reponses: string[], libres: string[]): JsonSchema => ({
    type: "object",
    additionalProperties: false,
    required: ["reponse", "precision", texte, "metier", "faits"],
    properties: {
      reponse: enumeration(reponses.length > 0 ? reponses : ["aucune"]),
      precision: enumeration([...libres, SANS_PRECISION]),
      [texte]:
        texte === "rappel" ? chaine(L.rappel.min, L.rappel.max) : chaine(L.trait.min, L.trait.max),
      metier:
        texte === "rappel"
          ? chaine(L.metierParent.min, L.metierParent.max)
          : chaine(L.metierEnfant.min, L.metierEnfant.max),
      faits: listeIds(ids.faits, 3),
    },
  });
  const champs = [
    "code",
    "raison_du_choix",
    "metier_simplement",
    "ia_phrase",
    "pourquoi_parent",
    "pourquoi_enfant",
  ];
  return {
    type: "object",
    additionalProperties: false,
    required: remplace ? ["remplace", ...champs] : champs,
    properties: {
      ...(remplace && { remplace: enumeration([...remplace]) }),
      code: enumeration(ids.codes),
      raison_du_choix: chaine(L.raisonDuChoix.min, L.raisonDuChoix.max),
      metier_simplement: chaine(undefined, L.metierSimplement.max),
      ia_phrase: chaine(undefined, L.iaPhrase.max),
      pourquoi_parent: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: lien("rappel", ids.reponses, ids.libres),
      },
      pourquoi_enfant: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: lien("trait", ids.reponsesEnfant, ids.libresEnfant),
      },
    },
  };
}

/** JSON Schema de la sortie, pour `response_format.json_schema.schema`. */
export function schemaSortie(charge: Charge): JsonSchema {
  const n = charge.envoi.nombre_de_pistes;
  return {
    type: "object",
    additionalProperties: false,
    required: ["analyse", "pistes"],
    properties: {
      analyse: chaine(LONGUEURS.analyse.min, LONGUEURS.analyse.max),
      pistes: { type: "array", minItems: n, maxItems: n, items: schemaPiste(charge) },
    },
  };
}

/**
 * JSON Schema de la relance ciblée : `nombre` pistes réécrites, chacune avec
 * le code de la piste qu'elle remplace (pris dans `remplace`).
 */
export function schemaCorrection(
  charge: Charge,
  remplace: readonly string[],
  nombre: number,
): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["pistes"],
    properties: {
      pistes: {
        type: "array",
        minItems: nombre,
        maxItems: nombre,
        items: schemaPiste(charge, remplace),
      },
    },
  };
}

function chaine(min: number | undefined, max: number): JsonSchema {
  return { type: "string", ...(min !== undefined && { minLength: min }), maxLength: max };
}

const CODE_ROME = /^[A-N]\d{4}$/;
const ID_REPONSE = /^[a-z0-9_]+(?:=[a-z0-9_]+)?$/;
const ID_FAIT = /^[A-N]\d{4}\.[a-z]\d*$/;

/**
 * Schéma zod de la sortie (V01) : la structure et la forme des identifiants.
 * L'appartenance aux candidats, aux réponses et aux faits est vérifiée par le
 * validateur, chacune avec son code (V03, T01, T03, T21), comme le demandent
 * les tests du §10.3 ; l'API, elle, reçoit les énumérations.
 */
const reponsesDuLien = {
  reponse: z.string().regex(ID_REPONSE),
  precision: z.union([z.string().regex(ID_REPONSE), z.literal(SANS_PRECISION)]),
};

/** Nouvelle forme (`reponse`, `precision`) rendue en `reponses`. */
function enListe<T extends { reponse: string; precision: string }>({
  reponse,
  precision,
  ...reste
}: T) {
  return { ...reste, reponses: precision === SANS_PRECISION ? [reponse] : [reponse, precision] };
}

/** Un lien : nouvelle forme (`reponse`, `precision`) ou ancienne (`reponses`). */
function lienSchema(texte: "rappel" | "trait") {
  const faits = z.array(z.string().regex(ID_FAIT)).min(1).max(3);
  const reponses = z.array(z.string().regex(ID_REPONSE)).min(1).max(2);
  if (texte === "rappel") {
    const commun = { rappel: z.string(), metier: z.string(), faits };
    return z.union([
      z.strictObject({ ...reponsesDuLien, ...commun }).transform(enListe),
      z.strictObject({ reponses, ...commun }),
    ]);
  }
  const commun = { trait: z.string(), metier: z.string(), faits };
  return z.union([
    z.strictObject({ ...reponsesDuLien, ...commun }).transform(enListe),
    z.strictObject({ reponses, ...commun }),
  ]);
}

function pisteSchema() {
  return {
    code: z.string().regex(CODE_ROME),
    raison_du_choix: z.string(),
    metier_simplement: z.string(),
    ia_phrase: z.string(),
    pourquoi_parent: z.array(lienSchema("rappel")).min(2).max(4),
    pourquoi_enfant: z.array(lienSchema("trait")).min(2).max(3),
  };
}

export function sortieSchemaPour(_charge: Charge): z.ZodType<SortieLlm> {
  void _charge;
  return z
    .strictObject({
      analyse: z.string(),
      pistes: z.array(z.strictObject(pisteSchema())).min(1),
      // Ancienne forme (réponses gardées des essais) : lue, puis ignorée.
      ecartes: z.array(z.unknown()).optional(),
    })
    .transform(({ analyse, pistes }) => ({ analyse, pistes })) as unknown as z.ZodType<SortieLlm>;
}

/** Schéma zod de la réponse à une relance ciblée. */
export const correctionSchema = z.strictObject({
  pistes: z
    .array(z.strictObject({ remplace: z.string().regex(CODE_ROME), ...pisteSchema() }))
    .min(1),
}) as unknown as z.ZodType<CorrectionLlm>;
