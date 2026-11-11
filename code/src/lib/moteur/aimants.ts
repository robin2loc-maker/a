/**
 * Métiers « aimants » (conception §3.6, critique 2 R4) : part des profils d'un
 * panel fixe (data/processed/panel_moteur.json, committé) où le métier est
 * dans les 10 premiers par affinité, sans filtre. Le moteur ne tire jamais
 * d'aléa : il relit le panel et recalcule f(m) avec sa propre affinité.
 */
import type { Reponses } from "@/lib/questionnaire/reponses";
import { arrondi, CONSTANTES } from "./constantes";
import { construireProfil } from "./profil";
import { affinite, termesDuProfil } from "./score";
import type { IndexMoteur } from "./types";

/** Les `top` premiers métiers par affinité arrondie, départagés par code ROME. */
export function premiersParAffinite(
  reponses: Reponses,
  index: Omit<IndexMoteur, "frequences">,
  top: number = CONSTANTES.aimant.top,
): string[] {
  const termes = termesDuProfil(construireProfil(reponses, index.appellations));
  const indexComplet = { ...index, frequences: new Map<string, number>() };
  return index.metiers
    .map((m) => ({ code: m.code_rome, a: affinite(termes, m, indexComplet) }))
    .sort((x, y) => y.a - x.a || (x.code < y.code ? -1 : x.code > y.code ? 1 : 0))
    .slice(0, top)
    .map((x) => x.code);
}

/** f(m) pour chaque métier qui apparaît au moins une fois dans les 10 premiers du panel. */
export function calculerFrequences(
  panel: readonly Reponses[],
  index: Omit<IndexMoteur, "frequences">,
): Map<string, number> {
  const comptes = new Map<string, number>();
  for (const reponses of panel) {
    for (const code of premiersParAffinite(reponses, index)) {
      comptes.set(code, (comptes.get(code) ?? 0) + 1);
    }
  }
  const frequences = new Map<string, number>();
  if (panel.length === 0) return frequences;
  for (const code of [...comptes.keys()].sort()) {
    frequences.set(code, arrondi((comptes.get(code) ?? 0) / panel.length));
  }
  return frequences;
}
