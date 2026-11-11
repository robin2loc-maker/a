/**
 * Journal des appels LLM (conseiller-ia.md §9.3) : une ligne JSON par appel,
 * sans donnée personnelle. Jamais : prompt, réponses, textes produits,
 * extraits des messages d'échec, prénom, email, département. Seuls les codes
 * d'échec et leur nombre.
 */
import { createHmac } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export type StatutAppel =
  | "ok"
  | "echec_validation"
  | "delai"
  | `http_${number}`
  | "reseau"
  | "reponse_vide"
  | "budget_atteint"
  | "schema_degrade"
  | "repli_champ"
  | "trio_partiel"
  | "repli_total";

export type LigneJournal = {
  le: string;
  motif: string;
  /** HMAC-SHA256 de l'identifiant du bilan, tronqué à 12 caractères. */
  bilan: string;
  fournisseur: string;
  modele: string;
  modele_servi: string | null;
  tentative: number;
  statut: StatutAppel;
  echecs: Record<string, number>;
  duree_ms: number;
  entree: number;
  entree_cache: number;
  sortie: number;
  raisonnement: number;
  cout_usd: number | null;
  versions: { prompt: number; moteur: string; catalogue: string };
};

export type Journal = (ligne: LigneJournal) => void;

/** Identifiant du bilan, haché : on relie les lignes d'un bilan sans remonter au bilan. */
export function hacherBilan(id: string, cle: string): string {
  return createHmac("sha256", cle).update(id).digest("hex").slice(0, 12);
}

/** Codes d'échec et leur nombre. */
export function compterEchecs(codes: readonly string[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const c of codes) r[c] = (r[c] ?? 0) + 1;
  return r;
}

/**
 * Journal par défaut : `console.info` en production, `.llm/journal.jsonl` en
 * développement, rien pendant les tests.
 */
export function journalParDefaut(env: NodeJS.ProcessEnv = process.env): Journal {
  if (env.NODE_ENV === "test" || env.VITEST) return () => {};
  if (env.NODE_ENV === "production") {
    return (ligne) => console.info(JSON.stringify({ journal: "llm", ...ligne }));
  }
  const chemin = join(process.cwd(), ".llm", "journal.jsonl");
  return (ligne) => {
    mkdirSync(dirname(chemin), { recursive: true });
    appendFileSync(chemin, `${JSON.stringify(ligne)}\n`);
  };
}
