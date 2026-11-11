/**
 * Fournisseur mock (conseiller-ia.md §2) : déterministe, sans réseau, ne
 * consomme aucun budget. C'est lui qui sert quand une clé est présente sans
 * `LLM_REEL=1` (tests E2E, captures, développement).
 *
 * - scénario « gabarits » (défaut) : le trio du calcul seul et les textes des
 *   gabarits, au format de sortie du LLM ;
 * - scénario « sequence » : rend, dans l'ordre, les réponses données par le
 *   test (objet ou texte JSON, erreur, ou « delai » : attend l'abandon).
 */
import { sortieGabarits } from "../repli";
import type { Charge } from "../types";
import {
  ErreurLlm,
  USAGE_VIDE,
  type FournisseurLlm,
  type ReponseLlm,
  type RequeteLlm,
} from "../fournisseur";

export type EtapeMock =
  | { type: "sortie"; sortie: unknown; fin?: ReponseLlm["fin"] }
  | { type: "erreur"; erreur: ErreurLlm }
  | { type: "delai" };

export type ScenarioMock = { type: "gabarits" } | { type: "sequence"; etapes: EtapeMock[] };

export class FournisseurMock implements FournisseurLlm {
  readonly nom = "mock" as const;
  readonly modele = "mock";
  readonly reel: boolean = false;
  /** Requêtes reçues, pour les tests. */
  readonly requetes: RequeteLlm[] = [];
  private charge: Charge | null = null;
  private rang = 0;

  constructor(private readonly scenario: ScenarioMock = { type: "gabarits" }) {}

  /** Le mock « gabarits » a besoin de la charge complète, pas seulement du prompt. */
  preparer(charge: Charge): void {
    this.charge = charge;
  }

  async generer(requete: RequeteLlm, signal: AbortSignal): Promise<ReponseLlm> {
    this.requetes.push(requete);
    const reponse = (sortie: unknown, fin: ReponseLlm["fin"] = "complete"): ReponseLlm => ({
      brut: typeof sortie === "string" ? sortie : JSON.stringify(sortie),
      fin,
      usage: USAGE_VIDE,
      dureeMs: 0,
      modeleServi: "mock",
    });
    if (this.scenario.type === "gabarits") {
      if (!this.charge) throw new ErreurLlm("reponse_vide", null, false);
      return reponse(sortieGabarits(this.charge));
    }
    const etape = this.scenario.etapes[Math.min(this.rang, this.scenario.etapes.length - 1)];
    this.rang += 1;
    if (!etape) throw new ErreurLlm("reponse_vide", null, false);
    if (etape.type === "erreur") throw etape.erreur;
    if (etape.type === "delai") {
      await new Promise<void>((resoudre) => {
        if (signal.aborted) resoudre();
        signal.addEventListener("abort", () => resoudre(), { once: true });
      });
      throw new ErreurLlm("delai", null, false);
    }
    return reponse(etape.sortie, etape.fin);
  }
}
