/**
 * Les trois pistes (conception §5) : compatibilité de deux métiers, choix du
 * trio par paliers avec la règle de cœur, validation d'un trio proposé par le LLM.
 */
import { arrondi, CONSTANTES } from "./constantes";
import { METIERS_CONNUS } from "./metiers-connus";
import type { DetailScore, FormationCompatible, MetierMoteur, Profil } from "./types";

export type Candidat = {
  metier: MetierMoteur;
  detail: DetailScore;
  formations: FormationCompatible[];
  /** Rang parmi les candidats, 1 pour le premier. */
  rang: number;
};

/** §5.1 : domaines différents, pas « proches » (relation rendue symétrique), métiers BMO différents. */
export function compatibles(a: MetierMoteur, b: MetierMoteur): boolean {
  if (a.code_rome === b.code_rome) return false;
  if (a.domaine_professionnel.code === b.domaine_professionnel.code) return false;
  if (a.proches.includes(b.code_rome) || b.proches.includes(a.code_rome)) return false;
  const ba = a.recrutement?.metier_bmo.code;
  const bb = b.recrutement?.metier_bmo.code;
  return !(ba !== undefined && bb !== undefined && ba === bb);
}

/** Contraintes de groupe (§5.1) : au plus deux par grand domaine (si strict), au moins un hors liste des connus. */
export function groupeValide(
  metiers: readonly MetierMoteur[],
  grandDomaineStrict: boolean,
): boolean {
  if (!metiers.some((m) => !METIERS_CONNUS.has(m.code_rome))) return false;
  if (!grandDomaineStrict) return true;
  const comptes = new Map<string, number>();
  for (const m of metiers) {
    const n = (comptes.get(m.grand_domaine.code) ?? 0) + 1;
    if (n > CONSTANTES.maxParGrandDomaine) return false;
    comptes.set(m.grand_domaine.code, n);
  }
  return true;
}

export function coeurSatisfait(profil: Profil, metiers: readonly MetierMoteur[]): boolean {
  const coeur = profil.coeur;
  if (coeur === null) return true;
  return metiers.some((m) => (m.dimensions.vecteur[coeur.dim] ?? 0) >= CONSTANTES.couverture);
}

function interetsCouverts(profil: Profil, metiers: readonly MetierMoteur[]): number {
  return profil.interetsSecondaires.filter((d) =>
    metiers.some((m) => (m.dimensions.vecteur[d] ?? 0) >= CONSTANTES.couverture),
  ).length;
}

export type Trio = {
  pistes: Candidat[];
  palier: 1 | 2 | 3 | 4;
  regleCoeur: "satisfaite" | "sans_objet" | "tombee";
};

type Paire = { coeur: boolean; somme: number; i: number; j: number };

const meilleure = (a: Paire, b: Paire) =>
  a.coeur !== b.coeur
    ? a.coeur
    : a.somme !== b.somme
      ? a.somme > b.somme
      : a.i !== b.i
        ? a.i < b.i
        : a.j < b.j;

function meilleurePaire(
  profil: Profil,
  candidats: readonly Candidat[],
  palier: (typeof CONSTANTES.paliers)[number],
): Paire | null {
  const premier = candidats[0];
  const plancher = arrondi(premier.detail.score - palier.marge);
  const vivier: number[] = [];
  for (let i = 1; i < Math.min(candidats.length, palier.k); i++) {
    if (candidats[i].detail.score < plancher) continue;
    if (compatibles(premier.metier, candidats[i].metier)) vivier.push(i);
  }
  let best: Paire | null = null;
  for (let a = 0; a < vivier.length; a++) {
    const i = vivier[a];
    for (let b = a + 1; b < vivier.length; b++) {
      const j = vivier[b];
      const mi = candidats[i].metier;
      const mj = candidats[j].metier;
      if (!compatibles(mi, mj)) continue;
      const trio = [premier.metier, mi, mj];
      if (!groupeValide(trio, palier.grandDomaineStrict)) continue;
      const paire: Paire = {
        coeur: coeurSatisfait(profil, trio),
        somme: arrondi(
          candidats[i].detail.score +
            candidats[j].detail.score +
            CONSTANTES.bonusInteretSecondaire * interetsCouverts(profil, trio),
        ),
        i,
        j,
      };
      if (best === null || meilleure(paire, best)) best = paire;
    }
  }
  return best;
}

function regle(profil: Profil, pistes: readonly Candidat[]): Trio["regleCoeur"] {
  if (profil.coeur === null) return "sans_objet";
  return coeurSatisfait(
    profil,
    pistes.map((p) => p.metier),
  )
    ? "satisfaite"
    : "tombee";
}

/** Choix du trio (§5.2). Les candidats sont triés par la clé du §8.2. */
export function choisirTrio(profil: Profil, candidats: readonly Candidat[]): Trio {
  if (candidats.length === 0) return { pistes: [], palier: 4, regleCoeur: regle(profil, []) };
  // Paliers calculés à la demande : les paliers 3 et 4 examinent toutes les paires.
  const paires: (Paire | null | undefined)[] = [];
  const paire = (n: number) => {
    if (paires[n] === undefined)
      paires[n] = meilleurePaire(profil, candidats, CONSTANTES.paliers[n]);
    return paires[n];
  };
  const avecCoeur = [0, 1].find((n) => paire(n)?.coeur);
  const n = avecCoeur ?? [0, 1, 2, 3].find((k) => paire(k) !== null) ?? -1;
  if (n !== -1) {
    const p = paire(n) as Paire;
    const pistes = [candidats[0], candidats[p.i], candidats[p.j]];
    return { pistes, palier: (n + 1) as Trio["palier"], regleCoeur: regle(profil, pistes) };
  }
  // Aucun trio, même grand domaine relâché : deux pistes, ou une (§5.2, D1).
  const premier = candidats[0];
  const seconds = candidats
    .slice(1)
    .filter((c) => compatibles(premier.metier, c.metier))
    .sort(
      (a, b) =>
        Number(coeurSatisfait(profil, [premier.metier, b.metier])) -
          Number(coeurSatisfait(profil, [premier.metier, a.metier])) ||
        Number(groupeValide([premier.metier, b.metier], false)) -
          Number(groupeValide([premier.metier, a.metier], false)) ||
        b.detail.score - a.detail.score ||
        a.rang - b.rang,
    );
  const pistes = seconds.length > 0 ? [premier, seconds[0]] : [premier];
  return { pistes, palier: 4, regleCoeur: regle(profil, pistes) };
}

/**
 * Trio proposé par le LLM (§5.2) : il peut reformuler et réordonner, mais le
 * trio doit contenir le premier candidat, respecter le §5.1 et la règle de
 * cœur (si le trio déterministe la satisfait), et ne contenir que des
 * candidats transmis.
 */
export function validerTrio(
  profil: Profil,
  codes: readonly string[],
  candidats: readonly Candidat[],
  deterministe: Trio,
): boolean {
  const transmis = candidats.slice(0, CONSTANTES.candidatsTransmis);
  if (codes.length !== deterministe.pistes.length || new Set(codes).size !== codes.length) {
    return false;
  }
  if (candidats.length === 0 || !codes.includes(candidats[0].metier.code_rome)) return false;
  const metiers: MetierMoteur[] = [];
  for (const code of codes) {
    const c = transmis.find((x) => x.metier.code_rome === code);
    if (!c) return false;
    metiers.push(c.metier);
  }
  for (let a = 0; a < metiers.length; a++) {
    for (let b = a + 1; b < metiers.length; b++) {
      if (!compatibles(metiers[a], metiers[b])) return false;
    }
  }
  if (!groupeValide(metiers, deterministe.palier < 4)) return false;
  return deterministe.regleCoeur !== "satisfaite" || coeurSatisfait(profil, metiers);
}
