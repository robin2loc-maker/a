/**
 * Résultat du moteur (conception §8.4) : fonction pure des réponses et de
 * l'index. Ni date, ni aléa, ni réseau : mêmes réponses, même résultat.
 */
import { VERSION_QUESTIONNAIRE } from "@/lib/questionnaire/definition";
import type { Reponses } from "@/lib/questionnaire/reponses";
import { CONSTANTES, VERSION_MOTEUR } from "./constantes";
import { choisirEcartes, raisonsEcart, type MetierFiltre } from "./ecartes";
import { filtrer, formationsMontrees } from "./filtres";
import { contraintes, ecartsEvoque, liensExplicatifs } from "./liens";
import { METIERS_CONNUS } from "./metiers-connus";
import { construireProfil } from "./profil";
import { affinite, scorer, termesDuProfil } from "./score";
import { choisirTrio, coeurSatisfait, type Candidat, type Trio } from "./selection";
import type { IndexMoteur, Piste, Profil, ResultatMoteur, SituationEvoque, Terme } from "./types";

/** Clé de tri des candidats (§8.2) : score ↓, affinité ↓, projets BMO ↓, code ROME ↑. */
export function comparerCandidats(a: Candidat, b: Candidat): number {
  return (
    b.detail.score - a.detail.score ||
    b.detail.affinite - a.detail.affinite ||
    (b.metier.recrutement?.projets ?? 0) - (a.metier.recrutement?.projets ?? 0) ||
    (a.metier.code_rome < b.metier.code_rome ? -1 : a.metier.code_rome > b.metier.code_rome ? 1 : 0)
  );
}

export type Classement = {
  profil: Profil;
  termes: Terme[];
  candidats: Candidat[];
  filtres: MetierFiltre[];
};

/** Profil, filtres et classement des candidats, avant diversité (§2, §3, §8.2). */
export function classer(reponses: Reponses, index: IndexMoteur): Classement {
  const profil = construireProfil(reponses, index.appellations);
  const termes = termesDuProfil(profil);
  const candidats: Candidat[] = [];
  const filtres: MetierFiltre[] = [];
  for (const metier of index.metiers) {
    const { exclusions, formations } = filtrer(profil, metier, index);
    if (exclusions.length > 0) {
      filtres.push({ metier, affinite: affinite(termes, metier, index), exclusions });
      continue;
    }
    const detail = scorer(profil, termes, metier, formations, index);
    candidats.push({ metier, detail, formations, rang: 0 });
  }
  candidats.sort(comparerCandidats);
  candidats.forEach((c, i) => (c.rang = i + 1));
  return { profil, termes, candidats, filtres };
}

/** Calcule le résultat complet (§8.4). */
export function calculerResultat(reponses: Reponses, index: IndexMoteur): ResultatMoteur {
  return calculerResultatDepuis(classer(reponses, index), index);
}

/**
 * Le résultat du moteur pour des pistes imposées, choisies par le LLM parmi
 * la présélection (conseiller-ia.md §7.4) : même classement, puis écartés et
 * métiers évoqués recalculés. Un métier choisi ne peut plus être écarté, et
 * les variantes suivent les pistes retenues.
 */
export function resultatAvecPistes(
  reponses: Reponses,
  codes: readonly string[],
  index: IndexMoteur,
): ResultatMoteur {
  const classement = classer(reponses, index);
  const pistes = codes.map((code) => {
    const c = classement.candidats.find((x) => x.metier.code_rome === code);
    if (!c) throw new Error(`Piste imposée ${code} absente des candidats du moteur`);
    return c;
  });
  const { profil } = classement;
  const metiers = pistes.map((p) => p.metier);
  const trio: Trio = {
    pistes,
    palier: choisirTrio(profil, classement.candidats).palier,
    regleCoeur:
      profil.coeur === null
        ? "sans_objet"
        : coeurSatisfait(profil, metiers)
          ? "satisfaite"
          : "tombee",
  };
  return calculerResultatDepuis(classement, index, trio);
}

/** Résultat complet depuis un classement déjà calculé (trio du calcul seul, ou imposé). */
export function calculerResultatDepuis(
  classement: Classement,
  index: IndexMoteur,
  trioImpose?: Trio,
): ResultatMoteur {
  const { profil, termes, candidats, filtres } = classement;
  const trio = trioImpose ?? choisirTrio(profil, candidats);
  const pistes: Piste[] = trio.pistes.map((c) => ({
    code_rome: c.metier.code_rome,
    libelle: c.metier.libelle,
    rang: c.rang,
    score: c.detail.score,
    affinite: c.detail.affinite,
    penalites: c.detail.penalites,
    bonus: c.detail.bonus,
    connu: METIERS_CONNUS.has(c.metier.code_rome),
    formations: formationsMontrees(c.formations, profil),
    formationsCompatibles: c.formations.length,
    liens: liensExplicatifs(profil, termes, c.metier, index),
    contraintes: contraintes(profil, c.metier, c.formations, index),
  }));
  const ecartes = choisirEcartes(profil, filtres, candidats, trio.pistes);

  const evoques = profil.metiersEvoques.map((code) => {
    let situation: SituationEvoque;
    const rangPiste = pistes.findIndex((p) => p.code_rome === code);
    const raisons = raisonsEcart(code, filtres, ecartes);
    const candidat = candidats.find((c) => c.metier.code_rome === code);
    const nonEligible = index.nonEligibles.get(code);
    if (rangPiste !== -1) situation = { statut: "piste", rang: rangPiste + 1 };
    else if (raisons) situation = { statut: "ecarte", raisons };
    else if (candidat) {
      situation = {
        statut: "moins_proche",
        rang: candidat.rang,
        ecarts: ecartsEvoque(termes, candidat.metier, index),
      };
    } else {
      situation = {
        statut: "non_eligible",
        libelle: nonEligible?.libelle ?? null,
        manquants: nonEligible?.manquants ?? [],
      };
    }
    return { code_rome: code, situation };
  });

  return {
    moteur: {
      version: VERSION_MOTEUR,
      catalogue: index.empreintes.catalogue,
      panel: index.empreintes.panel,
      questionnaire: VERSION_QUESTIONNAIRE,
    },
    profil,
    pistes,
    pistesManquantes: (3 - pistes.length) as ResultatMoteur["pistesManquantes"],
    ecartes,
    evoques,
    candidats: candidats.slice(0, CONSTANTES.candidatsTransmis).map((c) => ({
      code_rome: c.metier.code_rome,
      libelle: c.metier.libelle,
      rang: c.rang,
      score: c.detail.score,
      affinite: c.detail.affinite,
      domaine: c.metier.domaine_professionnel.code,
      grandDomaine: c.metier.grand_domaine.code,
      metierBmo: c.metier.recrutement?.metier_bmo.code ?? null,
      valeurCoeur: profil.coeur ? (c.metier.dimensions.vecteur[profil.coeur.dim] ?? 0) : null,
      connu: METIERS_CONNUS.has(c.metier.code_rome),
    })),
    nombreCandidats: candidats.length,
    regleCoeur: trio.regleCoeur,
    palier: trio.palier,
    qualite: profil.qualite,
  };
}
