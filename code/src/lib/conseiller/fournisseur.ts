/**
 * Fournisseur LLM abstrait (conseiller-ia.md §2) : xAI (API compatible
 * OpenAI), Anthropic en option, mock sans réseau. Un fournisseur réel n'est
 * rendu qu'avec `LLM_REEL=1` ; sinon, même avec une clé, c'est le mock.
 */
import type { Config } from "@/lib/config";
import type { JsonSchema } from "./schema";

export type NomFournisseur = "xai" | "anthropic" | "mock";

export type RequeteLlm = {
  systeme: string;
  /** Tour 1 : [utilisateur]. Relance : [utilisateur, assistant (1re réponse brute), utilisateur (motifs)]. */
  messages: { role: "user" | "assistant"; contenu: string }[];
  schema: JsonSchema;
  /** « conseil » : l'objet complet ; « correction » : les seules pistes à réécrire (relance ciblée) ;
   * « etiquettes » : un lot de fiches étiquetées sur les 21 dimensions (scripts/data, tâche 2.5). */
  nomSchema: "conseil" | "correction" | "etiquettes";
  maxJetonsSortie: number;
  temperature: number;
};

export type UsageLlm = {
  entree: number;
  entreeEnCache: number;
  sortie: number;
  raisonnement: number;
  /** xAI : `cost_in_usd_ticks` × 1e-10 ; sinon `null`. */
  coutUsd: number | null;
};

export type ReponseLlm = {
  /** Contenu brut ; JSON.parse et validation sont faits par l'appelant. */
  brut: string;
  fin: "complete" | "longueur" | "refus";
  usage: UsageLlm;
  dureeMs: number;
  modeleServi: string;
  /** Vrai si l'API a refusé la sortie structurée stricte et que le schéma a été recopié dans le prompt. */
  schemaDegrade?: boolean;
};

export class ErreurLlm extends Error {
  constructor(
    public readonly type: "delai" | "http" | "reseau" | "reponse_vide",
    public readonly statut: number | null,
    public readonly relancable: boolean,
  ) {
    super(statut === null ? type : `${type} ${statut}`);
    this.name = "ErreurLlm";
  }
}

export interface FournisseurLlm {
  readonly nom: NomFournisseur;
  readonly modele: string;
  /** Vrai pour un fournisseur qui consomme le budget d'appels (xAI, Anthropic). */
  readonly reel: boolean;
  generer(requete: RequeteLlm, signal: AbortSignal): Promise<ReponseLlm>;
}

export const USAGE_VIDE: UsageLlm = {
  entree: 0,
  entreeEnCache: 0,
  sortie: 0,
  raisonnement: 0,
  coutUsd: null,
};

/** Erreur à partir d'un statut HTTP : 429 et 5xx se relancent, 4xx non. */
export function erreurHttp(statut: number): ErreurLlm {
  return new ErreurLlm("http", statut, statut === 429 || statut >= 500);
}

/** Erreur à partir d'une exception de `fetch` : abandon = délai, sinon réseau. */
export function erreurFetch(e: unknown, signal: AbortSignal): ErreurLlm {
  if (e instanceof ErreurLlm) return e;
  if (signal.aborted) return new ErreurLlm("delai", null, false);
  return new ErreurLlm("reseau", null, true);
}

/**
 * Fournisseur pour cette configuration, ou `null` (aucun LLM : calcul seul et
 * gabarits). Les fournisseurs réels sont chargés à la demande.
 */
export async function choisirFournisseur(c: Config): Promise<FournisseurLlm | null> {
  const llm = c.llm;
  if (llm === null) return null;
  if (llm.fournisseur === "mock" || !llm.reel) {
    const { FournisseurMock } = await import("./fournisseurs/mock");
    return new FournisseurMock();
  }
  if (llm.fournisseur === "xai") {
    const { FournisseurXai } = await import("./fournisseurs/xai");
    return new FournisseurXai(llm.cle as string, llm.modele);
  }
  const { FournisseurAnthropic } = await import("./fournisseurs/anthropic");
  return new FournisseurAnthropic(llm.cle as string, llm.modele);
}
