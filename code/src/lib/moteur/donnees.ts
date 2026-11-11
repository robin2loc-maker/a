/**
 * Index du moteur : construit une fois par processus depuis data/processed/,
 * côté serveur seulement (formations.json pèse 18 Mo : il n'entre jamais
 * dans un bundle client). `construireIndex` est pure ; `chargerIndexMoteur`
 * lit les fichiers.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { chargerCatalogue, type Catalogue } from "@/lib/donnees/catalogue";
import { DIMENSIONS, type Dimension } from "@/lib/donnees/schema-dimensions";
import type { Reponses } from "@/lib/questionnaire/reponses";
import { calculerFrequences } from "./aimants";
import { arrondi, CONSTANTES } from "./constantes";
import { formationsDeBase } from "./filtres";
import { fractionIa, fractionRecrutement } from "./score";
import type {
  AccesMetier,
  DureeConnue,
  FormationIndex,
  IndexMoteur,
  MetierMoteur,
  Source,
} from "./types";

const texte = z.string().min(1);
const sourceSchema = z.object({ nom: texte, url: z.url(), millesime: texte });

export const formationsMoteurSchema = z.object({
  formations: z.array(
    z.object({
      code: z.number().int().positive(),
      intitule: texte,
      type: texte,
      etablissement: texte,
      statut: z.enum(["public", "prive_sous_contrat", "prive"]),
      commune: z.string().nullable(),
      departement: z.object({ code: texte }).nullable(),
      region: z.string().nullable(),
      apprentissage: z.boolean(),
      lien: z.string(),
      gps: z.tuple([z.number(), z.number()]).nullable(),
    }),
  ),
});

export const admissionsMoteurSchema = z.object({
  admissions: z.array(z.object({ code: z.number().int(), taux_acces: z.number().nullable() })),
});

const ligneDureeSchema = z.object({
  duree: z.number().int().positive().nullable(),
  source: sourceSchema.nullable(),
});

export const dureesSchema = z.object({
  par_type: z.record(z.string(), ligneDureeSchema),
  par_mention: z.record(z.string(), ligneDureeSchema),
  intitule_bac_plus: z.object({ types: z.array(z.string()), source: sourceSchema }),
});

const alpha = z.object({ cases: z.number().int(), alpha: z.number().nullable() });
export const controleSchema = z.object({
  B: z.record(z.string(), alpha),
  B_D_J1: z.record(z.string(), alpha),
  B_D_J2: z.record(z.string(), alpha),
  C: z.record(
    z.string(),
    z.object({ cases: z.number().int(), part_jugee_au_plus_1: z.number().nullable() }),
  ),
});

export const accesSchema = z.object({
  source: sourceSchema,
  metiers: z.record(
    z.string(),
    z.object({
      experience: z.enum(["texte", "intitule"]).nullable(),
      preuve: z.string().nullable(),
      method: z.enum(["texte_rome", "intitule_et_diriger"]).nullable(),
      condition_experience: z.string().nullable(),
      nature_experience: z.enum(["condition", "atout"]).nullable(),
      bac_plus_max: z.number().int().nullable(),
    }),
  ),
  appellations: z.record(z.string(), z.string()),
});

export const panelSchema = z.object({
  graine: z.number().int(),
  reponses: z.array(z.record(z.string(), z.unknown())),
});

export type DonneesMoteur = {
  catalogue: Catalogue;
  formations: z.infer<typeof formationsMoteurSchema>["formations"];
  admissions: z.infer<typeof admissionsMoteurSchema>["admissions"];
  durees: z.infer<typeof dureesSchema>;
  controle: z.infer<typeof controleSchema>;
  acces: z.infer<typeof accesSchema>;
  panel: readonly Reponses[];
  empreintes: { catalogue: string; panel: string };
};

/** k(d) (§3.2, règle recopiée par la réserve R2) : 0,5 pour une dimension réduite. */
export function calculerK(controle: DonneesMoteur["controle"]): Record<Dimension, number> {
  const { casesMin, alphaMin, ecartPaires, peuDiscriminantes, reduit } = CONSTANTES.k;
  const k = {} as Record<Dimension, number>;
  for (const d of DIMENSIONS) {
    const b = controle.B[d];
    const j1 = controle.B_D_J1[d]?.alpha;
    const j2 = controle.B_D_J2[d]?.alpha;
    let reduite = (peuDiscriminantes as readonly string[]).includes(d);
    if (b && b.cases >= casesMin) {
      if (b.alpha !== null && b.alpha < alphaMin) reduite = true;
      if (
        j1 !== undefined &&
        j2 !== undefined &&
        j1 !== null &&
        j2 !== null &&
        Math.abs(j1 - j2) > ecartPaires &&
        Math.min(j1, j2) < alphaMin
      ) {
        reduite = true;
      }
    }
    k[d] = reduite ? reduit : 1;
  }
  return k;
}

/** Dimensions en échec sur l'absence informative (§3.3, R2). */
export function calculerEchecAbsence(controle: DonneesMoteur["controle"]): Set<Dimension> {
  const { echecCasesMin, echecPartMin } = CONSTANTES.q;
  return new Set(
    DIMENSIONS.filter((d) => {
      const c = controle.C[d];
      return (
        c !== undefined &&
        c.cases >= echecCasesMin &&
        c.part_jugee_au_plus_1 !== null &&
        c.part_jugee_au_plus_1 < echecPartMin
      );
    }),
  );
}

const BAC_PLUS = /bac\s*\+?\s*(\d+)/i;

function dureesParMention(donnees: DonneesMoteur): Map<string, DureeConnue | null> {
  const { durees } = donnees;
  const parIntitule = new Set(durees.intitule_bac_plus.types);
  const resultat = new Map<string, DureeConnue | null>();
  const ligne = (l: z.infer<typeof ligneDureeSchema> | undefined): DureeConnue | null =>
    l && l.duree !== null && l.source !== null ? { duree: l.duree, source: l.source } : null;
  for (const code of Object.keys(donnees.catalogue.mentions_parcoursup).sort()) {
    const mention = donnees.catalogue.mentions_parcoursup[code];
    if (parIntitule.has(mention.type)) {
      const n = BAC_PLUS.exec(mention.intitule);
      resultat.set(
        code,
        n ? { duree: Number(n[1]), source: durees.intitule_bac_plus.source } : null,
      );
    } else if (mention.type === "DE") {
      resultat.set(code, ligne(durees.par_mention[code]));
    } else {
      resultat.set(code, ligne(durees.par_type[mention.type]));
    }
  }
  return resultat;
}

const ACCES_VIDE: AccesMetier = {
  experience: null,
  preuve: null,
  method: null,
  condition_experience: null,
  nature_experience: null,
  bac_plus_max: null,
};

/** Construit l'index (pure : mêmes données, même index). */
export function construireIndex(donnees: DonneesMoteur): IndexMoteur {
  const { catalogue } = donnees;
  const metiers: MetierMoteur[] = catalogue.metiers.map((m) => ({
    ...m,
    acces: donnees.acces.metiers[m.code_rome] ?? ACCES_VIDE,
  }));

  const taux = new Map(donnees.admissions.map((a) => [a.code, a.taux_acces]));
  const utilisees = new Set<number>();
  for (const m of catalogue.metiers) {
    for (const f of m.formations) {
      for (const c of catalogue.mentions_parcoursup[f.code_formation]?.codes ?? []) {
        utilisees.add(c);
      }
    }
  }
  const formations = new Map<number, FormationIndex>();
  const parDepartement = new Map<
    string,
    { lat: number; lon: number; n: number; regions: Map<string, number> }
  >();
  for (const f of donnees.formations) {
    if (f.departement && f.region) {
      const code = f.departement.code;
      const dep = parDepartement.get(code) ?? { lat: 0, lon: 0, n: 0, regions: new Map() };
      if (f.gps) {
        dep.lat += f.gps[0];
        dep.lon += f.gps[1];
        dep.n += 1;
      }
      dep.regions.set(f.region, (dep.regions.get(f.region) ?? 0) + 1);
      parDepartement.set(code, dep);
    }
    if (!utilisees.has(f.code)) continue;
    formations.set(f.code, {
      code: f.code,
      intitule: f.intitule,
      type: f.type,
      etablissement: f.etablissement,
      commune: f.commune,
      departement: f.departement?.code ?? null,
      region: f.region,
      statut: f.statut,
      apprentissage: f.apprentissage,
      lien: f.lien,
      gps: f.gps,
      tauxAcces: taux.get(f.code) ?? null,
    });
  }
  const departements = new Map<string, { lat: number; lon: number; region: string }>();
  for (const code of [...parDepartement.keys()].sort()) {
    const d = parDepartement.get(code);
    if (!d || d.n === 0) continue;
    const region = [...d.regions.entries()].sort(
      (a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1),
    )[0][0];
    departements.set(code, { lat: d.lat / d.n, lon: d.lon / d.n, region });
  }

  const moyennes = {} as Record<Dimension, number>;
  for (const d of DIMENSIONS) {
    const valeurs = metiers.map((m) => m.dimensions.vecteur[d] ?? 0);
    moyennes[d] = arrondi(valeurs.reduce((s, v) => s + v, 0) / Math.max(1, valeurs.length));
  }
  const moyenne = (xs: number[]) =>
    xs.length ? arrondi(xs.reduce((s, x) => s + x, 0) / xs.length) : 0;
  const penaliteMoyenne = {
    recrutement: moyenne(
      metiers.flatMap((m) => {
        const f = fractionRecrutement(m);
        return f === null ? [] : [CONSTANTES.recrutement.max * f];
      }),
    ),
    ia: moyenne(
      metiers.flatMap((m) => {
        const f = fractionIa(m);
        return f === null ? [] : [CONSTANTES.ia.max * f];
      }),
    ),
  };

  const sourceAcces: Source = donnees.acces.source;
  const mentions = new Map(Object.entries(catalogue.mentions_parcoursup));
  const durees = dureesParMention(donnees);
  const sansFrequences: Omit<IndexMoteur, "frequences"> = {
    metiers,
    parCode: new Map(metiers.map((m) => [m.code_rome, m])),
    mentions,
    formations,
    formationsParMetier: new Map(
      metiers.map((m) => [
        m.code_rome,
        formationsDeBase(m, { mentions, formations, dureesParMention: durees }),
      ]),
    ),
    dureesParMention: durees,
    departements,
    k: calculerK(donnees.controle),
    echecAbsence: calculerEchecAbsence(donnees.controle),
    moyennes,
    penaliteMoyenne,
    appellations: new Map(Object.entries(donnees.acces.appellations)),
    sourceAcces,
    nonEligibles: new Map(
      catalogue.non_eligibles.map((n) => [
        n.code_rome,
        { libelle: n.libelle, manquants: n.manquants },
      ]),
    ),
    empreintes: donnees.empreintes,
  };
  return { ...sansFrequences, frequences: calculerFrequences(donnees.panel, sansFrequences) };
}

const PROCESSED = join(process.cwd(), "data", "processed");
export const CHEMIN_PANEL = join(PROCESSED, "panel_moteur.json");

function lireJson(nom: string): { brut: string; json: unknown } {
  const brut = readFileSync(join(PROCESSED, nom), "utf-8");
  return { brut, json: JSON.parse(brut) };
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Lit les fichiers de data/processed/ (côté serveur). */
export function chargerDonneesMoteur(): DonneesMoteur {
  const catalogueBrut = readFileSync(join(PROCESSED, "catalogue.json"), "utf-8");
  const panel = lireJson("panel_moteur.json");
  return {
    catalogue: chargerCatalogue(),
    formations: formationsMoteurSchema.parse(lireJson("formations.json").json).formations,
    admissions: admissionsMoteurSchema.parse(lireJson("formations_admission.json").json).admissions,
    durees: dureesSchema.parse(lireJson("durees_formations.json").json),
    controle: controleSchema.parse(lireJson("dimensions_controle.json").json),
    acces: accesSchema.parse(lireJson("acces_metiers.json").json),
    panel: panelSchema.parse(panel.json).reponses as Reponses[],
    empreintes: { catalogue: sha256(catalogueBrut), panel: sha256(panel.brut) },
  };
}

let cache: IndexMoteur | undefined;

/** Index du moteur, construit une fois par processus. */
export function chargerIndexMoteur(): IndexMoteur {
  cache ??= construireIndex(chargerDonneesMoteur());
  return cache;
}
