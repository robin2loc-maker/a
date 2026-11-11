/**
 * Compteur bloquant des appels LLM (conseiller-ia.md §9.1, CLAUDE.md §3.8) :
 * 150 appels au total depuis le code du produit, répartis par motif. Un seul
 * compteur, dans un fichier ignoré par git (`.llm/compteur.json`), protégé
 * par un verrou. Réservé avant l'appel, compté même si l'appel échoue. Le
 * mock ne compte pas.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync, openSync, closeSync } from "node:fs";
import { dirname } from "node:path";

export type MotifAppel = "essai" | "etiquetage" | "evaluation" | "bilan";

/** Parts du budget (`bilan` puise dans la part `essai` : pas de production en V1). */
export type Parts = { essai: number; etiquetage: number; evaluation: number };

export type ConfigBudget = {
  total: number;
  parts: Parts;
  /** `LLM_RESERVE=1` : un motif dont la part est atteinte peut puiser dans la réserve. */
  reserve: boolean;
};

type Seau = keyof Parts | "reserve";

export type EtatBudget = {
  total: { utilises: number; budget: number };
  parSeau: Record<Seau, { utilises: number; budget: number }>;
};

export interface CompteurAppels {
  /** Réserve un appel pour ce motif. `false` si sa part (ou le total) est atteinte : l'appel n'a pas lieu. */
  reserver(motif: MotifAppel): Promise<boolean>;
  etat(): Promise<EtatBudget>;
}

export const BUDGET_PAR_DEFAUT: ConfigBudget = {
  total: 150,
  parts: { essai: 8, etiquetage: 40, evaluation: 84 },
  reserve: false,
};

const seauDe = (motif: MotifAppel): keyof Parts => (motif === "bilan" ? "essai" : motif);

type Comptes = Record<Seau, number>;
const VIDE: Comptes = { essai: 0, etiquetage: 0, evaluation: 0, reserve: 0 };

function budgetReserve(c: ConfigBudget): number {
  return Math.max(0, c.total - c.parts.essai - c.parts.etiquetage - c.parts.evaluation);
}

/** Décision de réservation, fonction pure (partagée par les deux compteurs). */
export function decider(comptes: Comptes, motif: MotifAppel, c: ConfigBudget): Seau | null {
  const total = comptes.essai + comptes.etiquetage + comptes.evaluation + comptes.reserve;
  if (total >= c.total) return null;
  const seau = seauDe(motif);
  if (comptes[seau] < c.parts[seau]) return seau;
  if (c.reserve && comptes.reserve < budgetReserve(c)) return "reserve";
  return null;
}

function etatDe(comptes: Comptes, c: ConfigBudget): EtatBudget {
  const utilises = comptes.essai + comptes.etiquetage + comptes.evaluation + comptes.reserve;
  return {
    total: { utilises, budget: c.total },
    parSeau: {
      essai: { utilises: comptes.essai, budget: c.parts.essai },
      etiquetage: { utilises: comptes.etiquetage, budget: c.parts.etiquetage },
      evaluation: { utilises: comptes.evaluation, budget: c.parts.evaluation },
      reserve: { utilises: comptes.reserve, budget: budgetReserve(c) },
    },
  };
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Compteur en fichier, verrou par fichier `.lock` ouvert en `wx` (attente de 50 ms, refus après 2 s). */
export class CompteurFichier implements CompteurAppels {
  constructor(
    private readonly chemin: string,
    private readonly config: ConfigBudget = BUDGET_PAR_DEFAUT,
  ) {}

  private lire(): Comptes {
    try {
      const brut = JSON.parse(readFileSync(this.chemin, "utf-8")) as { comptes?: Partial<Comptes> };
      return { ...VIDE, ...brut.comptes };
    } catch {
      return { ...VIDE };
    }
  }

  private async sousVerrou<T>(f: () => T): Promise<T> {
    mkdirSync(dirname(this.chemin), { recursive: true });
    const verrou = `${this.chemin}.lock`;
    const debut = Date.now();
    for (;;) {
      try {
        closeSync(openSync(verrou, "wx"));
        break;
      } catch {
        if (Date.now() - debut > 2000) throw new Error("Compteur d'appels LLM verrouillé");
        await attendre(50);
      }
    }
    try {
      return f();
    } finally {
      rmSync(verrou, { force: true });
    }
  }

  async reserver(motif: MotifAppel): Promise<boolean> {
    return this.sousVerrou(() => {
      const comptes = this.lire();
      const seau = decider(comptes, motif, this.config);
      if (seau === null) return false;
      comptes[seau] += 1;
      writeFileSync(
        this.chemin,
        `${JSON.stringify({ comptes, misAJour: new Date().toISOString() }, null, 2)}\n`,
      );
      return true;
    });
  }

  async etat(): Promise<EtatBudget> {
    return etatDe(this.lire(), this.config);
  }
}

/** Compteur en mémoire (tests). */
export class CompteurMemoire implements CompteurAppels {
  private comptes: Comptes = { ...VIDE };
  constructor(private readonly config: ConfigBudget = BUDGET_PAR_DEFAUT) {}
  async reserver(motif: MotifAppel): Promise<boolean> {
    const seau = decider(this.comptes, motif, this.config);
    if (seau === null) return false;
    this.comptes[seau] += 1;
    return true;
  }
  async etat(): Promise<EtatBudget> {
    return etatDe(this.comptes, this.config);
  }
}
